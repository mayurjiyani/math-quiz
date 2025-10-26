import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuizService } from './quiz.service';
import { DifficultyLevel } from '../entities/question.entity';

@WebSocketGateway({
  cors: {
    origin: '*', // NOTE: In production, specify exact origins
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Set<string>();

  constructor(private quizService: QuizService) {}

  async handleConnection(client: Socket) {
    this.activeUsers.add(client.id);
    console.log(
      `Client connected: ${client.id}, Total users: ${this.activeUsers.size}`,
    );

    // Send current question to newly connected client
    const current = await this.quizService.getCurrentQuestion();
    if (current) {
      client.emit('currentQuestion', {
        id: current.question.id,
        question: current.question.question,
        difficulty: current.question.difficulty,
        points: current.question.points,
      });
    }

    // Send active users count
    this.server.emit('activeUsers', this.activeUsers.size);
  }

  handleDisconnect(client: Socket) {
    this.activeUsers.delete(client.id);
    console.log(
      `Client disconnected: ${client.id}, Total users: ${this.activeUsers.size}`,
    );
    this.server.emit('activeUsers', this.activeUsers.size);
  }

  @SubscribeMessage('joinQuiz')
  async handleJoinQuiz(
    @MessageBody() data: { username: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = await this.quizService.createOrGetUser(data.username);
      client.data.user = user;

      // Send current question
      const current = await this.quizService.getCurrentQuestion();
      if (current) {
        return {
          event: 'currentQuestion',
          data: {
            id: current.question.id,
            question: current.question.question,
            difficulty: current.question.difficulty,
            points: current.question.points,
          },
        };
      } else {
        // Generate new question if none exists
        const question = await this.quizService.generateNewQuestion();
        this.server.emit('newQuestion', {
          id: question.id,
          question: question.question,
          difficulty: question.difficulty,
          points: question.points,
        });
      }
    } catch (error) {
      console.error('Error in joinQuiz:', error);
      return { event: 'error', data: { message: 'Failed to join quiz' } };
    }
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: { answer: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      if (!user) {
        return {
          event: 'error',
          data: { message: 'User not found. Please join first.' },
        };
      }

      const result = await this.quizService.submitAnswer(user.id, data.answer);

      // Send result to the submitter
      client.emit('answerResult', {
        isCorrect: result.isCorrect,
        isWinner: result.isWinner,
        points: result.points,
      });

      // If there's a winner, broadcast to all clients
      if (result.isWinner) {
        this.server.emit('winner', {
          username: user.username,
          points: result.points,
          answer: result.question.answer,
        });

        // Generate and broadcast new question after a short delay
        setTimeout(async () => {
          const newQuestion = await this.quizService.generateNewQuestion(
            this.getRandomDifficulty(),
          );
          this.server.emit('newQuestion', {
            id: newQuestion.id,
            question: newQuestion.question,
            difficulty: newQuestion.difficulty,
            points: newQuestion.points,
          });
        }, 3000); // 3 second delay before new question
      }

      return { event: 'submitted', data: { success: true } };
    } catch (error) {
      console.error('Error in submitAnswer:', error);
      return { event: 'error', data: { message: error.message } };
    }
  }

  @SubscribeMessage('getLeaderboard')
  async handleGetLeaderboard() {
    try {
      const leaderboard = await this.quizService.getLeaderboard(10);
      return {
        event: 'leaderboard',
        data: leaderboard.map((user) => ({
          username: user.username,
          totalScore: user.totalScore,
          correctAnswers: user.correctAnswers,
        })),
      };
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      return { event: 'error', data: { message: 'Failed to get leaderboard' } };
    }
  }

  private getRandomDifficulty(): DifficultyLevel {
    const difficulties = [
      DifficultyLevel.EASY,
      DifficultyLevel.MEDIUM,
      DifficultyLevel.HARD,
    ];
    const weights = [0.3, 0.5, 0.2]; // 30% easy, 50% medium, 20% hard
    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random < sum) {
        return difficulties[i];
      }
    }

    return DifficultyLevel.MEDIUM;
  }
}

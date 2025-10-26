import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('api/quiz')
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Get('current')
  async getCurrentQuestion() {
    const current = await this.quizService.getCurrentQuestion();
    if (!current) {
      return { message: 'No active question' };
    }

    return {
      id: current.question.id,
      question: current.question.question,
      difficulty: current.question.difficulty,
      points: current.question.points,
    };
  }

  @Get('leaderboard')
  async getLeaderboard() {
    const leaderboard = await this.quizService.getLeaderboard(10);
    return leaderboard.map((user) => ({
      username: user.username,
      totalScore: user.totalScore,
      correctAnswers: user.correctAnswers,
    }));
  }

  @Post('user')
  async createUser(@Body() body: { username: string }) {
    const user = await this.quizService.createOrGetUser(body.username);
    return {
      id: user.id,
      username: user.username,
      totalScore: user.totalScore,
      correctAnswers: user.correctAnswers,
    };
  }

  @Get('user/:id')
  async getUserStats(@Param('id') id: string) {
    const user = await this.quizService.getUserStats(parseInt(id));
    if (!user) {
      return { message: 'User not found' };
    }

    return {
      id: user.id,
      username: user.username,
      totalScore: user.totalScore,
      correctAnswers: user.correctAnswers,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Question } from '../entities/question.entity';
import { Submission } from '../entities/submission.entity';
import { CurrentQuestion } from '../entities/current-question.entity';
import { QuestionGeneratorService } from './question-generator.service';
import { DifficultyLevel } from '../entities/question.entity';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(CurrentQuestion)
    private currentQuestionRepository: Repository<CurrentQuestion>,
    private questionGenerator: QuestionGeneratorService,
    private dataSource: DataSource,
  ) {}

  async createOrGetUser(username: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      user = this.userRepository.create({ username });
      await this.userRepository.save(user);
    }

    return user;
  }

  async getCurrentQuestion(): Promise<{
    question: Question;
    currentQuestionId: number;
  } | null> {
    const current = await this.currentQuestionRepository.findOne({
      where: { hasWinner: false },
      order: { id: 'DESC' },
    });

    if (!current) {
      return null;
    }

    const question = await this.questionRepository.findOne({
      where: { id: current.questionId },
    });

    return question ? { question, currentQuestionId: current.id } : null;
  }

  async generateNewQuestion(
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM,
  ): Promise<Question> {
    const generatedQ = this.questionGenerator.generateQuestion(difficulty);

    const question = this.questionRepository.create({
      question: generatedQ.question,
      answer: generatedQ.answer,
      difficulty: generatedQ.difficulty,
      points: generatedQ.points,
    });

    await this.questionRepository.save(question);

    const currentQuestion = this.currentQuestionRepository.create({
      questionId: question.id,
      hasWinner: false,
    });

    await this.currentQuestionRepository.save(currentQuestion);

    return question;
  }

  /**
   * CRITICAL: This method uses database transactions with row locking to ensure
   * only ONE winner is selected even under high concurrency.
   *
   * The approach:
   * 1. Start a transaction with READ COMMITTED isolation level
   * 2. Use FOR UPDATE lock to prevent race conditions
   * 3. Check if there's already a winner
   * 4. If no winner, validate answer and mark this submission as winner
   * 5. Commit transaction atomically
   */
  async submitAnswer(
    userId: number,
    answer: string,
  ): Promise<{
    isCorrect: boolean;
    isWinner: boolean;
    question: Question;
    points?: number;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get current question with row lock to prevent race conditions
      const currentQuestion = await queryRunner.manager
        .createQueryBuilder(CurrentQuestion, 'cq')
        .where('cq.hasWinner = :hasWinner', { hasWinner: false })
        .orderBy('cq.id', 'DESC')
        .setLock('pessimistic_write') // Critical: Lock the row
        .getOne();

      if (!currentQuestion) {
        await queryRunner.rollbackTransaction();
        throw new Error('No active question found');
      }

      const question = await queryRunner.manager.findOne(Question, {
        where: { id: currentQuestion.questionId },
      });

      if (!question) {
        await queryRunner.rollbackTransaction();
        throw new Error('Question not found');
      }

      // Check if answer is correct
      const isCorrect = this.validateAnswer(answer, question.answer);
      const isWinner = isCorrect && !currentQuestion.hasWinner;

      // Create submission record
      const submission = queryRunner.manager.create(Submission, {
        userId,
        questionId: question.id,
        answer,
        isCorrect,
        isWinner,
      });
      await queryRunner.manager.save(submission);

      // If this is the winner, update current question and user score
      if (isWinner) {
        currentQuestion.hasWinner = true;
        currentQuestion.winnerId = userId;
        currentQuestion.completedAt = new Date();
        await queryRunner.manager.save(currentQuestion);

        // Update user score
        await queryRunner.manager.increment(
          User,
          { id: userId },
          'totalScore',
          question.points,
        );
        await queryRunner.manager.increment(
          User,
          { id: userId },
          'correctAnswers',
          1,
        );
      }

      await queryRunner.commitTransaction();

      return {
        isCorrect,
        isWinner,
        question,
        points: isWinner ? question.points : undefined,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private validateAnswer(userAnswer: string, correctAnswer: string): boolean {
    return userAnswer.trim() === correctAnswer.trim();
  }

  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return this.userRepository.find({
      order: { totalScore: 'DESC' },
      take: limit,
    });
  }

  async getUserStats(userId: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}

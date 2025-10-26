import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizGateway } from './quiz.gateway';
import { QuestionGeneratorService } from './question-generator.service';
import { User } from '../entities/user.entity';
import { Question } from '../entities/question.entity';
import { Submission } from '../entities/submission.entity';
import { CurrentQuestion } from '../entities/current-question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Question, Submission, CurrentQuestion]),
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizGateway, QuestionGeneratorService],
})
export class QuizModule {}

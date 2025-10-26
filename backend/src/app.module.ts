import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Question } from './entities/question.entity';
import { Submission } from './entities/submission.entity';
import { CurrentQuestion } from './entities/current-question.entity';
import { QuizModule } from './quiz/quiz.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'math_quiz',
      entities: [User, Question, Submission, CurrentQuestion],
      synchronize: true, // NOTE: Set to false in production
    }),
    QuizModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

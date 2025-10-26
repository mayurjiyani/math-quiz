import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Submission } from './submission.entity';

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.EASY,
  })
  difficulty: DifficultyLevel;

  @Column({ default: 10 })
  points: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Submission, (submission) => submission.question)
  submissions: Submission[];
}

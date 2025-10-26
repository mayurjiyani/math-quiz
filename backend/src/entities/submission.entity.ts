import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  questionId: number;

  @Column()
  answer: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ default: false })
  isWinner: boolean;

  @CreateDateColumn()
  submittedAt: Date;

  @ManyToOne(() => User, (user) => user.submissions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Question, (question) => question.submissions)
  @JoinColumn({ name: 'questionId' })
  question: Question;
}

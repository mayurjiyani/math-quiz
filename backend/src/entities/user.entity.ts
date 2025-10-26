import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Submission } from './submission.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ default: 0 })
  totalScore: number;

  @Column({ default: 0 })
  correctAnswers: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Submission, (submission) => submission.user)
  submissions: Submission[];
}

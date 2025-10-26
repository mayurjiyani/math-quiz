import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('current_question')
export class CurrentQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionId: number;

  @Column({ default: false })
  hasWinner: boolean;

  @Column({ nullable: true })
  winnerId: number;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}

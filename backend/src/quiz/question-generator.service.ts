import { Injectable } from '@nestjs/common';
import { DifficultyLevel } from '../entities/question.entity';

interface GeneratedQuestion {
  question: string;
  answer: string;
  difficulty: DifficultyLevel;
  points: number;
}

@Injectable()
export class QuestionGeneratorService {
  private operators = ['+', '-', '*'];

  generateQuestion(
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM,
  ): GeneratedQuestion {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return this.generateEasyQuestion();
      case DifficultyLevel.MEDIUM:
        return this.generateMediumQuestion();
      case DifficultyLevel.HARD:
        return this.generateHardQuestion();
      default:
        return this.generateMediumQuestion();
    }
  }

  private generateEasyQuestion(): GeneratedQuestion {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operator = this.operators[Math.floor(Math.random() * 2)]; // Only + and -

    const { question, answer } = this.createQuestion(num1, num2, operator);

    return {
      question,
      answer: answer.toString(),
      difficulty: DifficultyLevel.EASY,
      points: 10,
    };
  }

  private generateMediumQuestion(): GeneratedQuestion {
    const num1 = Math.floor(Math.random() * 50) + 10;
    const num2 = Math.floor(Math.random() * 50) + 10;
    const operator =
      this.operators[Math.floor(Math.random() * this.operators.length)];

    const { question, answer } = this.createQuestion(num1, num2, operator);

    return {
      question,
      answer: answer.toString(),
      difficulty: DifficultyLevel.MEDIUM,
      points: 20,
    };
  }

  private generateHardQuestion(): GeneratedQuestion {
    // Generate multi-step questions like: (a + b) * c - d
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const c = Math.floor(Math.random() * 10) + 1;
    const d = Math.floor(Math.random() * 30) + 1;

    const answer = (a + b) * c - d;
    const question = `(${a} + ${b}) × ${c} - ${d}`;

    return {
      question,
      answer: answer.toString(),
      difficulty: DifficultyLevel.HARD,
      points: 50,
    };
  }

  private createQuestion(
    num1: number,
    num2: number,
    operator: string,
  ): { question: string; answer: number } {
    let answer: number;
    let displayOperator = operator;

    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        displayOperator = '×';
        break;
      default:
        answer = num1 + num2;
    }

    const question = `${num1} ${displayOperator} ${num2}`;
    return { question, answer };
  }
}

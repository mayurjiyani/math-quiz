# Competitive Math Quiz

A real-time competitive math quiz application where multiple users compete to solve math problems. The first user to provide the correct answer wins points!

## Live Demo

[View Application](#) _(Add your deployment URL here)_

## Features

-   **Real-time Competition**: Multiple users can compete simultaneously
-   **Concurrency Handling**: Robust server-side validation ensures only ONE winner per question
-   **Dynamic Question Generation**: Questions are generated on-the-fly with varying difficulty levels
-   **Network Resilience**: Server-side timestamping prevents network latency advantages
-   **Live Leaderboard**: Track high scores in real-time
-   **WebSocket Communication**: Instant updates for all connected users
-   **Difficulty Levels**: Easy, Medium, and Hard questions with varying point values

## Tech Stack

### Backend

-   **NestJS** - Progressive Node.js framework
-   **TypeScript** - Type-safe development
-   **TypeORM** - ORM for database operations
-   **MySQL** - Relational database
-   **Socket.IO** - Real-time WebSocket communication

### Frontend

-   **React** - UI library
-   **TypeScript** - Type-safe development
-   **Socket.IO Client** - WebSocket client

## Key Technical Implementations

### 1. Concurrency Handling

The application uses **database transactions with pessimistic locking** to handle concurrent answer submissions:

```typescript
// In quiz.service.ts
const currentQuestion = await queryRunner.manager
    .createQueryBuilder(CurrentQuestion, "cq")
    .where("cq.hasWinner = :hasWinner", { hasWinner: false })
    .orderBy("cq.id", "DESC")
    .setLock("pessimistic_write") // Critical: Locks the row
    .getOne();
```

**How it works:**

-   Each answer submission starts a database transaction
-   The current question row is locked with `pessimistic_write`
-   Only one transaction can proceed at a time
-   Winner status is checked and updated atomically
-   Prevents race conditions even with thousands of concurrent users

### 2. Dynamic Question Generation

Questions are generated programmatically with three difficulty levels:

-   **Easy**: Simple addition/subtraction (1-20 range) - 10 points
-   **Medium**: Mixed operations (10-50 range) - 20 points
-   **Hard**: Multi-step problems like `(a + b) × c - d` - 50 points

### 3. Network Condition Handling

-   **Server-side timestamping**: All submissions are timestamped on the server
-   **No client-side trust**: Client timestamps are ignored
-   **Database-level ordering**: Uses `submittedAt` timestamp for fairness
-   **WebSocket for low latency**: Reduces communication overhead

### 4. High Scores & Leaderboard

-   User scores persist in the database
-   Real-time leaderboard updates via WebSocket
-   Tracks total score and number of correct answers

## Installation & Setup

### Prerequisites

-   Node.js (v16 or higher)
-   MySQL (v8 or higher)
-   npm or yarn

### Local Development

1. **Clone the repository**

    ```bash
    git clone <your-repo-url>
    cd math-quiz
    ```

2. **Set up MySQL database**

    ```sql
    CREATE DATABASE math_quiz;
    ```

3. **Configure Backend**

    ```bash
    cd backend
    cp .env.example .env
    # Edit .env with your MySQL credentials
    npm install
    ```

4. **Configure Frontend**

    ```bash
    cd frontend
    npm install
    ```

5. **Run the application**

    Terminal 1 (Backend):

    ```bash
    cd backend
    npm run start:dev
    ```

    Terminal 2 (Frontend):

    ```bash
    cd frontend
    npm start
    ```

6. **Access the application**
    - Frontend: http://localhost:3000
    - Backend: http://localhost:3001

## Deployment

For detailed deployment instructions, see:

-   **[Railway Deployment Guide](./DEPLOY_RAILWAY.md)** - Recommended for easiest setup
-   **[Heroku + Vercel Deployment Guide](./DEPLOY_HEROKU_VERCEL.md)** - Alternative option
-   **[General Deployment Options](./DEPLOYMENT.md)** - Multiple platform options

### Quick Start: Railway (Recommended)

Railway offers the simplest deployment with built-in database and auto-deploy from GitHub.

See [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md) for complete instructions.

## Configuration

### Backend Environment Variables (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=math_quiz
PORT=3001
```

### Frontend Environment Variables (.env)

```env
REACT_APP_BACKEND_URL=http://localhost:3001
```

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./QuizGame.css";

const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

interface Question {
    id: number;
    question: string;
    difficulty: string;
    points: number;
}

interface Winner {
    username: string;
    points: number;
    answer: string;
}

interface LeaderboardEntry {
    username: string;
    totalScore: number;
    correctAnswers: number;
}

const QuizGame: React.FC = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [username, setUsername] = useState("");
    const [isJoined, setIsJoined] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
        null
    );
    const [answer, setAnswer] = useState("");
    const [message, setMessage] = useState("");
    const [winner, setWinner] = useState<Winner | null>(null);
    const [activeUsers, setActiveUsers] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userScore, setUserScore] = useState(0);

    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to server");
        });

        newSocket.on("currentQuestion", (question: Question) => {
            setCurrentQuestion(question);
            setWinner(null);
            setMessage("");
        });

        newSocket.on("newQuestion", (question: Question) => {
            setCurrentQuestion(question);
            setAnswer("");
            setWinner(null);
            setMessage("");
        });

        newSocket.on(
            "answerResult",
            (result: {
                isCorrect: boolean;
                isWinner: boolean;
                points?: number;
            }) => {
                if (result.isWinner) {
                    setMessage(
                        `Congratulations! You won ${result.points} points!`
                    );
                    setUserScore((prev) => prev + (result.points || 0));
                } else if (result.isCorrect) {
                    setMessage("Correct! But someone else was faster.");
                } else {
                    setMessage("Incorrect answer. Try again!");
                }
            }
        );

        newSocket.on("winner", (winnerData: Winner) => {
            setWinner(winnerData);
            // Request updated leaderboard
            newSocket.emit("getLeaderboard");
        });

        newSocket.on("activeUsers", (count: number) => {
            setActiveUsers(count);
        });

        newSocket.on("leaderboard", (data: LeaderboardEntry[]) => {
            setLeaderboard(data);
        });

        newSocket.on("error", (error: { message: string }) => {
            setMessage(`Error: ${error.message}`);
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const handleJoin = () => {
        if (!username.trim()) {
            alert("Please enter a username");
            return;
        }

        if (socket) {
            socket.emit("joinQuiz", { username: username.trim() });
            socket.emit("getLeaderboard");
            setIsJoined(true);
        }
    };

    const handleSubmitAnswer = (e: React.FormEvent) => {
        e.preventDefault();

        if (!answer.trim()) {
            return;
        }

        if (socket) {
            socket.emit("submitAnswer", { answer: answer.trim() });
            // Don't clear answer immediately - let the user see what they submitted
        }
    };

    if (!isJoined) {
        return (
            <div className="container">
                <div className="join-screen">
                    <h1>Competitive Math Quiz</h1>
                    <p className="subtitle">
                        Be the first to solve and win points!
                    </p>
                    <div className="join-form">
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === "Enter" && handleJoin()
                            }
                            autoFocus
                        />
                        <button onClick={handleJoin}>Join Quiz</button>
                    </div>
                    <div className="active-users">
                        <span className="user-count">{activeUsers}</span> users
                        online
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <div className="user-info">
                    <span className="username">{username}</span>
                    <span className="score">Score: {userScore}</span>
                </div>
                <div className="active-users">
                    <span className="user-count">{activeUsers}</span> users
                    competing
                </div>
            </div>

            <div className="main-content">
                <div className="quiz-area">
                    {currentQuestion ? (
                        <div className="question-card">
                            <div
                                className="difficulty-badge"
                                data-difficulty={currentQuestion.difficulty}
                            >
                                {currentQuestion.difficulty} •{" "}
                                {currentQuestion.points} pts
                            </div>
                            <h2 className="question">
                                {currentQuestion.question}
                            </h2>

                            {winner ? (
                                <div className="winner-announcement">
                                    <h3>Winner: {winner.username}</h3>
                                    <p>Answer: {winner.answer}</p>
                                    <p className="next-question">
                                        Next question coming soon...
                                    </p>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmitAnswer}
                                    className="answer-form"
                                >
                                    <input
                                        type="text"
                                        placeholder="Your answer"
                                        value={answer}
                                        onChange={(e) =>
                                            setAnswer(e.target.value)
                                        }
                                        autoFocus
                                        disabled={!!winner}
                                    />
                                    <button type="submit" disabled={!!winner}>
                                        Submit
                                    </button>
                                </form>
                            )}

                            {message && (
                                <div
                                    className={`message ${
                                        message.includes("won")
                                            ? "success"
                                            : message.includes("Incorrect")
                                            ? "error"
                                            : "info"
                                    }`}
                                >
                                    {message}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="loading">Loading question...</div>
                    )}
                </div>

                <div className="leaderboard-area">
                    <h3>Leaderboard</h3>
                    <div className="leaderboard">
                        {leaderboard.length > 0 ? (
                            leaderboard.map((entry, index) => (
                                <div
                                    key={entry.username}
                                    className={`leaderboard-item ${
                                        entry.username === username
                                            ? "current-user"
                                            : ""
                                    }`}
                                >
                                    <span className="rank">#{index + 1}</span>
                                    <span className="name">
                                        {entry.username}
                                    </span>
                                    <span className="points">
                                        {entry.totalScore} pts
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">No scores yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizGame;

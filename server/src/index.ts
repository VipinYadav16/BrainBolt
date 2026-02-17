import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
import { quizRouter } from "./routes/quiz.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { errorHandler } from "./middleware/errorHandler.js";

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  }),
);

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// Stricter rate limit for answer submissions
const answerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 answers per minute max
  message: { error: "Too many answer submissions, please slow down." },
});
app.use("/v1/quiz/answer", answerLimiter);

// Body parsing
app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/v1/quiz", quizRouter);
app.use("/v1/leaderboard", leaderboardRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 BrainBolt API server running on port ${PORT}`);
});

export default app;

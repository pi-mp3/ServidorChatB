/**
 * app.ts
 * Express app, routes and middlewares
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import meetingRoutes from "./routes/meetingRoutes";
import chatRoutes from "./routes/chatRoutes";

dotenv.config();

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Routes
app.use("/api/meetings", meetingRoutes);
app.use("/api/chat", chatRoutes);

// Healthcheck
app.get("/health", (_req, res) => res.json({ status: "ok", service: "chat-backend" }));

export default app;

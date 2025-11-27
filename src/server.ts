/**
 * server.ts
 * Entry point - creates HTTP server and initializes Socket.io
 */

import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import app from "./app";
import { initSocket } from "./services/socketService";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const server = http.createServer(app);

// Initialize socket.io with CORS policy
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

// Initialize socket handlers (attach to io)
initSocket(io);

server.listen(PORT, () => {
  console.log(`Servidor chat escuchando en puerto ${PORT}`);
});

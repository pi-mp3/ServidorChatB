// 🌟 Cargar dotenv antes de cualquier import que use process.env
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { initSocket } from "./services/socketService";

// Resto de tu código
const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`Servidor chat escuchando en puerto ${PORT}`);
});

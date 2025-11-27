/**
 * socketService.ts
 * Socket.io handlers: join room, send message, enforce max participants
 */

import { Server, Socket } from "socket.io";
import { addMessage, getMeeting, addParticipant } from "./firestoreService";
import admin from "firebase-admin";

/**
 * Maximum users per meeting (as requested)
 */
const MAX_USERS_PER_MEETING = 10;

/**
 * Initialize socket handlers on provided io server
 * @param io - Socket.IO server instance
 */
export const initSocket = (io: Server) => {
  // Middleware to validate Firebase token on socket handshake
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("Token no proporcionado");
      const decoded = await admin.auth().verifyIdToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err: any) {
      next(new Error("No autorizado: " + err.message));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`Socket connected: uid=${user.uid} socketId=${socket.id}`);

    // join meeting room
    socket.on("joinMeeting", async ({ meetingId }: { meetingId: string }) => {
      try {
        const room = `meeting-${meetingId}`;
        // check number of clients in room
        const clients = io.sockets.adapter.rooms.get(room)?.size || 0;
        if (clients >= MAX_USERS_PER_MEETING) {
          socket.emit("meeting:error", { message: "La reunión está llena (10 usuarios máximo)" });
          return;
        }

        // optionally check meeting exists
        const meeting = await getMeeting(meetingId);
        if (!meeting) {
          socket.emit("meeting:error", { message: "Reunión no encontrada" });
          return;
        }

        await addParticipant(meetingId, user.uid).catch(() => { /* ignore if already */ });

        socket.join(room);
        io.to(room).emit("userJoined", { userId: user.uid });
        console.log(`User ${user.uid} joined ${room}`);
      } catch (err: any) {
        console.error("joinMeeting error:", err);
        socket.emit("meeting:error", { message: "Error al unir a la reunión: " + err.message });
      }
    });

    // handle incoming chat messages
    socket.on("sendMessage", async ({ meetingId, text }: { meetingId: string; text: string }) => {
      try {
        const msg = { userId: user.uid, text, timestamp: Date.now() };
        await addMessage(meetingId, msg);
        const room = `meeting-${meetingId}`;
        io.to(room).emit("receiveMessage", msg);
      } catch (err: any) {
        console.error("sendMessage error:", err);
        socket.emit("meeting:error", { message: "Error al enviar el mensaje: " + err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: uid=${user.uid} socketId=${socket.id}`);
      // Optionally: broadcast user left message to rooms
    });
  });
};

/**
 * Socket.IO service for real-time meeting communication
 * Handles chat messages, audio streaming, and participant management
 * Supports both Firebase ID tokens and JWT authentication
 */

import { Server, Socket } from "socket.io";
import { addMessage, getMeeting, addParticipant, createMeeting } from "./firestoreService";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Maximum number of participants allowed per meeting room
 */
const MAX_USERS_PER_MEETING = 10;

/**
 * Initializes Socket.IO event handlers and authentication middleware
 * Sets up real-time listeners for meeting operations, chat, and audio streaming
 * 
 * @param {Server} io - Socket.IO server instance
 */
export const initSocket = (io: Server) => {
  /**
   * Authentication middleware for Socket.IO connections
   * Validates token from handshake.auth and attaches user data to socket
   * Supports dual authentication: Firebase ID tokens (OAuth) and JWT (manual login)
   */
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("Token no proporcionado");
      
      // Try Firebase ID token first (Google/GitHub OAuth)
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        (socket as any).user = decoded;
        return next();
      } catch (firebaseErr) {
        // Fallback to JWT verification (manual login)
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          (socket as any).user = {
            uid: decoded.uid,
            email: decoded.email
          };
          return next();
        } catch (jwtErr: any) {
          throw new Error("Token inválido (ni Firebase ni JWT): " + jwtErr.message);
        }
      }
    } catch (err: any) {
      next(new Error("No autorizado: " + err.message));
    }
  });

  /**
   * Main connection handler - registers all socket event listeners
   */
  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;

    /**
     * Event: joinMeeting
     * Handles user joining a meeting room
     * Creates meeting if it doesn't exist, enforces max participants limit
     * 
     * @event joinMeeting
     * @param {Object} data - Join request data
     * @param {string} data.meetingId - Unique meeting identifier
     * @param {string} [data.userName] - Optional display name for the user
     * @emits meeting:error - If room is full or error occurs
     * @emits meeting:participants - Sends current participant list to joining user
     * @emits userJoined - Broadcasts to other participants that new user joined
     */
    socket.on("joinMeeting", async ({ meetingId, userName }: { meetingId: string; userName?: string }) => {
      try {
        const room = `meeting-${meetingId}`;
        // check number of clients in room
        const clients = io.sockets.adapter.rooms.get(room)?.size || 0;
        if (clients >= MAX_USERS_PER_MEETING) {
          socket.emit("meeting:error", { message: "La reunión está llena (10 usuarios máximo)" });
          return;
        }

        // Check if meeting exists, create if not
        let meeting = await getMeeting(meetingId);
        if (!meeting) {
          console.log(`📝 Creando reunión automáticamente: ${meetingId}`);
          meeting = {
            id: meetingId,
            title: `Reunión ${meetingId}`,
            hostId: user.uid,
            participants: [],
            createdAt: Date.now()
          };
          await createMeeting(meeting);
        }

        await addParticipant(meetingId, user.uid).catch(() => { /* Ignore if already exists */ });

        // Store user display name and meeting ID in socket instance
        (socket as any).userName = userName || user.email || user.uid;
        (socket as any).meetingId = meetingId;

        socket.join(room);

        // Fetch current participants in the room
        const socketsInRoom = await io.in(room).fetchSockets();
        const participantsList = socketsInRoom.map(s => ({
          uid: (s as any).user?.uid || 'unknown',
          name: (s as any).userName
        }));

        // Send participant list to the new user
        socket.emit("meeting:participants", participantsList);

        // Broadcast to existing participants that new user joined
        socket.to(room).emit("userJoined", { 
          userId: user.uid, 
          userName: (socket as any).userName 
        });
      } catch (err: any) {
        socket.emit("meeting:error", { message: "Error al unir a la reunión: " + err.message });
      }
    });

    /**
     * Event: leaveMeeting
     * Handles user explicitly leaving a meeting room
     * 
     * @event leaveMeeting
     * @param {Object} data - Leave request data
     * @param {string} data.meetingId - Meeting identifier to leave
     * @emits userLeft - Broadcasts to remaining participants that user left
     */
    socket.on("leaveMeeting", async ({ meetingId }: { meetingId: string }) => {
      try {
        const room = `meeting-${meetingId}`;
        socket.leave(room);
        socket.to(room).emit("userLeft", { userId: user.uid });
      } catch (err: any) {
        // Silent fail on leave errors
      }
    });

    /**
     * Event: sendMessage
     * Handles incoming chat messages from participants
     * Persists message to Firestore and broadcasts to all room members
     * 
     * @event sendMessage
     * @param {Object} data - Message data
     * @param {string} data.meetingId - Meeting identifier
     * @param {string} data.text - Message content
     * @emits receiveMessage - Broadcasts message to all participants including sender
     * @emits meeting:error - If message fails to send
     */
    socket.on("sendMessage", async ({ meetingId, text }: { meetingId: string; text: string }) => {
      try {
        const msg = { 
          userId: (socket as any).userName || user.uid, 
          text, 
          timestamp: Date.now() 
        };
        await addMessage(meetingId, msg);
        const room = `meeting-${meetingId}`;
        io.to(room).emit("receiveMessage", msg);
      } catch (err: any) {
        socket.emit("meeting:error", { message: "Error al enviar el mensaje: " + err.message });
      }
    });

    /**
     * Event: audio:stream
     * Handles real-time audio data streaming from participants
     * Relays audio chunks to all other participants in the meeting
     * 
     * @event audio:stream
     * @param {Object} data - Audio stream data
     * @param {string} data.meetingId - Meeting identifier
     * @param {number[]} data.audioData - Float32 audio samples array
     * @emits audio:stream - Broadcasts audio to all participants except sender
     */
    socket.on("audio:stream", ({ meetingId, audioData }: { meetingId: string; audioData: number[] }) => {
      try {
        const room = `meeting-${meetingId}`;
        // Broadcast to all room members except the sender
        socket.to(room).emit("audio:stream", { 
          userId: user.uid, 
          audioData 
        });
      } catch (err: any) {
        // Silent fail on audio streaming errors to avoid interrupting flow
      }
    });

    /**
     * Event: disconnect
     * Handles socket disconnection (manual or network failure)
     * Notifies remaining participants that user left the meeting
     */
    socket.on("disconnect", () => {
      const meetingId = (socket as any).meetingId;
      if (meetingId) {
        const room = `meeting-${meetingId}`;
        socket.to(room).emit("userLeft", { userId: user.uid });
      }
    });
  });
};

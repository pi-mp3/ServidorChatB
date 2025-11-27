/**
 * chatController.ts
 * HTTP controllers to get chat history
 */

import { Request, Response } from "express";
import { getMessages } from "../services/firestoreService";

/**
 * Get chat history for meeting
 */
export const getMessagesController = async (req: Request, res: Response) => {
  try {
    const meetingId = req.params.meetingId;
    const messages = await getMessages(meetingId);
    return res.status(200).json(messages);
  } catch (err: any) {
    return res.status(500).json({ message: "Error al obtener los mensajes: " + err.message });
  }
};

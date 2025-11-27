/**
 * meetingController.ts
 * HTTP controllers for meeting creation and join (used by frontend)
 */

import { Request, Response } from "express";
import { createMeeting, getMeeting, addParticipant } from "../services/firestoreService";

/**
 * Create meeting controller
 */
export const createMeetingController = async (req: Request, res: Response) => {
  try {
    const host = (req as any).user;
    const { id, title } = req.body;
    if (!id) return res.status(400).json({ message: "ID de reunión requerido" });

    const meetingExists = await getMeeting(id);
    if (meetingExists) return res.status(400).json({ message: "Ya existe una reunión con ese ID" });

    const meeting = {
      id,
      title: title || "Reunión",
      hostId: host.uid,
      participants: [host.uid],
      createdAt: Date.now()
    };
    await createMeeting(meeting);
    return res.status(201).json({ message: "Reunión creada con éxito", meeting });
  } catch (err: any) {
    return res.status(500).json({ message: "Error al crear la reunión: " + err.message });
  }
};

/**
 * Join meeting via REST (alternative to socket join)
 */
export const joinMeetingController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const meetingId = req.params.id;
    const meeting = await getMeeting(meetingId);
    if (!meeting) return res.status(404).json({ message: "Reunión no encontrada" });

    await addParticipant(meetingId, user.uid);
    return res.status(200).json({ message: "Usuario unido a la reunión con éxito" });
  } catch (err: any) {
    return res.status(500).json({ message: "Error al unirse a la reunión: " + err.message });
  }
};

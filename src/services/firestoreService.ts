/**
 * firestoreService.ts
 * Firestore operations for meetings and chat
 */

import { db } from "../config/firebaseConfig";
import { Message } from "../models/chatModel";
import { Meeting } from "../models/meetingModel";

/**
 * Create meeting document
 */
export const createMeeting = async (meeting: Meeting): Promise<Meeting> => {
  const ref = db.collection("meetings").doc(meeting.id);
  await ref.set(meeting);
  return meeting;
};

/**
 * Add participant to meeting (idempotent)
 */
export const addParticipant = async (meetingId: string, userId: string) => {
  const ref = db.collection("meetings").doc(meetingId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Reunión no encontrada");

  const data = snap.data() || {};
  const participants: string[] = data.participants || [];
  if (!participants.includes(userId)) participants.push(userId);

  await ref.update({ participants });
};

/**
 * Save chat message under meetings/{meetingId}/chat/
 */
export const addMessage = async (meetingId: string, message: Message) => {
  const chatRef = db.collection("meetings").doc(meetingId).collection("chat");
  await chatRef.add(message);
};

/**
 * Get messages ordered by timestamp asc
 */
export const getMessages = async (meetingId: string): Promise<Message[]> => {
  const chatRef = db.collection("meetings").doc(meetingId).collection("chat");
  const snapshot = await chatRef.orderBy("timestamp").get();

  return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) =>
    doc.data() as Message
  );
};

/**
 * Get meeting document
 */
export const getMeeting = async (meetingId: string): Promise<Meeting | null> => {
  const ref = db.collection("meetings").doc(meetingId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap.data() as Meeting;
};

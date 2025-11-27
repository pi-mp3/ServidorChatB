/**
 * meetingModel.ts
 * Meeting structure stored in Firestore
 */

export interface Meeting {
  id: string;
  title?: string;
  hostId: string;
  participants: string[];
  createdAt: number;
}

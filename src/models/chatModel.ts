/**
 * chatModel.ts
 * Message interface stored in Firestore
 */

/**
 * @typedef Message
 * @property {string} userId - UID del usuario
 * @property {string} text - Contenido del mensaje
 * @property {number} timestamp - Epoch ms
 */
export interface Message {
  userId: string;
  text: string;
  timestamp: number;
}

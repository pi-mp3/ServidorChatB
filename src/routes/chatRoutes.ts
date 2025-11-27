/**
 * chatRoutes.ts
 */

import { Router } from "express";
import { authenticateRequest } from "../middlewares/authMiddleware";
import { getMessagesController } from "../controllers/chatController";

const router = Router();

/**
 * Get chat history of meeting
 */
router.get("/:meetingId/messages", authenticateRequest, getMessagesController);

export default router;

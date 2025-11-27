/**
 * meetingRoutes.ts
 */

import { Router } from "express";
import { authenticateRequest } from "../middlewares/authMiddleware";
import { createMeetingController, joinMeetingController } from "../controllers/meetingController";

const router = Router();

/**
 * Create meeting (requires Firebase token)
 */
router.post("/", authenticateRequest, createMeetingController);

/**
 * Join meeting (HTTP)
 */
router.post("/:id/join", authenticateRequest, joinMeetingController);

export default router;

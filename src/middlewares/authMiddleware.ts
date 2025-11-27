/**
 * authMiddleware.ts
 * Middleware to protect HTTP routes with Firebase ID token
 */

import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

/**
 * Authenticate incoming HTTP request using Firebase ID token in Authorization header.
 * Header: Authorization: Bearer <token>
 */
export const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split("Bearer ")[1] : null;
    if (!token) return res.status(401).json({ message: "Token no proporcionado" });

    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ message: "No autorizado: " + err.message });
  }
};

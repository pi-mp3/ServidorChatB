/**
 * HTTP authentication middleware for protected routes
 * Validates Firebase ID tokens (OAuth) or JWT tokens (manual login)
 * Attaches decoded user data to request object for downstream handlers
 */

import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Express middleware for authenticating HTTP requests
 * Extracts token from Authorization header and validates it
 * Supports dual authentication strategy for different login methods
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void} - Calls next() on success, sends 401 response on failure
 * 
 * @example
 * router.get('/protected', authenticateRequest, (req, res) => {
 *   const userId = req.user.uid;
 *   // Handle authenticated request
 * });
 */
export const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split("Bearer ")[1] : null;
    if (!token) return res.status(401).json({ message: "Token no proporcionado" });

    // Try Firebase ID token validation first (OAuth flows)
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      (req as any).user = decoded;
      return next();
    } catch (firebaseErr) {
      // Fallback to JWT validation (manual email/password login)
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = {
          uid: decoded.uid,
          email: decoded.email
        };
        return next();
      } catch (jwtErr) {
        throw new Error("Token inválido (ni Firebase ni JWT)");
      }
    }
  } catch (err: any) {
    return res.status(401).json({ message: "No autorizado: " + err.message });
  }
};

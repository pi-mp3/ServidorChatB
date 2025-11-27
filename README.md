# chat-backend

Backend for Sprint 2 (Chat in real-time) — Node.js + Express + TypeScript + Firebase Admin + Socket.io

## How to use

1. Copy `.env.example` to `.env` and fill Firebase admin service account values.
2. `npm install`
3. `npm run start` (development) or `npm run build && npm run start:prod` (production)
4. Configure your frontend to use the backend URL and pass Firebase ID token:
   - HTTP: `Authorization: Bearer <token>`
   - Socket.io: `io(BACKEND_URL, { auth: { token } })`

## Notes
- The project persists meetings and chat under Firestore.
- User-visible messages are in Spanish.
- Developer docs (JSDoc) are written in English.

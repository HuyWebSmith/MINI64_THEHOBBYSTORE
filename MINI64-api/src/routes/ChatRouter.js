import express from "express";
import ChatController from "../controllers/ChatController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/session", optionalAuthMiddleware, ChatController.createSession);
router.get(
  "/conversations",
  authMiddleware,
  adminAuthMiddleware,
  ChatController.getAdminConversations,
);
router.get(
  "/conversations/:conversationId",
  optionalAuthMiddleware,
  ChatController.getConversationDetail,
);
router.patch(
  "/conversations/:conversationId/seen",
  optionalAuthMiddleware,
  ChatController.markSeen,
);

export default router;

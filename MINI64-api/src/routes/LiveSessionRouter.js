import express from "express";
import LiveSessionController from "../controllers/LiveSessionController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  adminAuthMiddleware,
  LiveSessionController.createLiveSession,
);
router.get(
  "/get-all",
  authMiddleware,
  adminAuthMiddleware,
  LiveSessionController.getAllLiveSessions,
);
router.get("/public-feed", LiveSessionController.getPublicLiveFeed);
router.get("/current", LiveSessionController.getCurrentLiveSession);
router.post(
  "/start/:id",
  authMiddleware,
  adminAuthMiddleware,
  LiveSessionController.startLiveSession,
);
router.post(
  "/end/:id",
  authMiddleware,
  adminAuthMiddleware,
  LiveSessionController.endLiveSession,
);
router.post(
  "/pin-product/:id",
  authMiddleware,
  adminAuthMiddleware,
  LiveSessionController.pinProduct,
);
router.post(
  "/add-product/:id",
  authMiddleware,
  adminAuthMiddleware,
  LiveSessionController.addProductToSession,
);
router.post(
  "/remove-product/:id",
  authMiddleware,
  adminAuthMiddleware,
  LiveSessionController.removeProductFromSession,
);

export default router;

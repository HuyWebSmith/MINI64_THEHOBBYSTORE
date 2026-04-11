import express from "express";
import { validateRegister } from "../validations/AuthValidation.js";
import AuthController from "../controllers/AuthController.js";
import {
  authMiddleware,
  adminAuthMiddleware,
} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/sign-up", validateRegister, AuthController.createUser);
router.post("/sign-in", AuthController.loginUser);
router.post("/google", AuthController.loginWithGoogle);
router.post("/logout", AuthController.logoutUser);
router.post("/refresh-token", AuthController.refreshToken);
router.patch(
  "/lock-user/:id",
  authMiddleware,
  adminAuthMiddleware,
  AuthController.lockUser,
);
export default router;

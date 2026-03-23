import express from "express";
import { validateRegister } from "../validations/AuthValidation.js";
import AuthController from "../controllers/authController.js";
const router = express.Router();

router.post("/sign-up", validateRegister, AuthController.createUser);
router.post("/sign-in", AuthController.loginUser);
router.post("/logout", AuthController.logoutUser);
router.post("/refresh-token", AuthController.refreshToken);
export default router;

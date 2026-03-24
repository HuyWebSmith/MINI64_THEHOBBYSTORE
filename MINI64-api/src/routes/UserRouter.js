import express from "express";
import userController from "../controllers/UserController.js";
import { adminAuthMiddleware } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.put("/:id", userController.updateUser);
router.delete("/:id", adminAuthMiddleware, userController.deleteUser);

export default router;

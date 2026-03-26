import express from "express";
import userController from "../controllers/UserController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/get-all", authMiddleware, adminAuthMiddleware, userController.getAllUsers);
router.put("/:id", userController.updateUser);
router.delete("/:id", authMiddleware, adminAuthMiddleware, userController.deleteUser);

export default router;

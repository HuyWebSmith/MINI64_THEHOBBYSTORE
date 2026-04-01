import express from "express";
import userController from "../controllers/UserController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/get-all", authMiddleware, adminAuthMiddleware, userController.getAllUsers);
router.get("/wishlist", authMiddleware, userController.getWishlist);
router.post("/wishlist/toggle", authMiddleware, userController.toggleWishlist);
router.put("/:id", userController.updateUser);
router.delete("/:id", authMiddleware, adminAuthMiddleware, userController.deleteUser);

export default router;

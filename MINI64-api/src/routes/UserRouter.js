import express from "express";
import userController from "../controllers/UserController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/get-all", authMiddleware, adminAuthMiddleware, userController.getAllUsers);
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.updateProfile);
router.get("/wishlist", authMiddleware, userController.getWishlist);
router.post("/wishlist", authMiddleware, userController.toggleWishlist);
router.post("/wishlist/:productId", authMiddleware, userController.toggleWishlist);
router.patch(
  "/wishlist/:productId/notify",
  authMiddleware,
  userController.updateWishlistNotify,
);
router.put("/:id", userController.updateUser);
router.delete("/:id", authMiddleware, adminAuthMiddleware, userController.deleteUser);

export default router;

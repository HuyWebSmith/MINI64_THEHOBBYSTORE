import express from "express";
import CartController from "../controllers/CartController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, CartController.getMyCart);
router.post("/add", authMiddleware, CartController.addToCart);
router.put("/item/:itemId", authMiddleware, CartController.updateCartItem);
router.delete("/item/:itemId", authMiddleware, CartController.deleteCartItem);

export default router;

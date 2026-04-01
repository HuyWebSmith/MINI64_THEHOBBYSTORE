import express from "express";
import OrderController from "../controllers/OrderController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-cod", authMiddleware, OrderController.createCodOrder);
router.get("/my-orders", authMiddleware, OrderController.getMyOrders);
router.get(
  "/get-all",
  authMiddleware,
  adminAuthMiddleware,
  OrderController.getAllOrders,
);
router.patch(
  "/update-status/:id",
  authMiddleware,
  adminAuthMiddleware,
  OrderController.updateOrderStatus,
);

export default router;

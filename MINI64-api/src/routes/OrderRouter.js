import express from "express";
import OrderController from "../controllers/OrderController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";
import {
  validateBulkUpdateOrderStatus,
  validateUpdateOrderStatus,
} from "../validators/orderValidator.js";

const router = express.Router();

router.post("/create", OrderController.createOrder);
router.get("/track", OrderController.trackOrder);
router.get("/my-orders", authMiddleware, OrderController.getMyOrders);
router.get(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  OrderController.getAdminOrders,
);
router.get(
  "/:id",
  authMiddleware,
  OrderController.getAdminOrderDetail,
);
router.put(
  "/update-status-bulk",
  authMiddleware,
  adminAuthMiddleware,
  validateBulkUpdateOrderStatus,
  OrderController.updateManyOrderStatuses,
);
router.put(
  "/update-status/:id",
  authMiddleware,
  adminAuthMiddleware,
  validateUpdateOrderStatus,
  OrderController.updateOrderStatus,
);

export default router;

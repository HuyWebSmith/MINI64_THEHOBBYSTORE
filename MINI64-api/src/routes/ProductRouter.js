import express from "express";
import ProductController from "../controllers/ProductController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  adminAuthMiddleware,
  ProductController.createProduct,
);
router.put(
  "/update/:id",
  authMiddleware,
  adminAuthMiddleware,
  ProductController.updateProduct,
);
router.delete(
  "/delete/:id",
  authMiddleware,
  adminAuthMiddleware,
  ProductController.deleteProduct,
);
router.get("/get-details/:id", ProductController.getDetailProduct);
router.get("/get-all", ProductController.getAllProduct);

export default router;

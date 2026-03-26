import express from "express";
import ProductController from "../controllers/ProductController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";
import { validateProduct } from "../validations/ProductValidation.js";
import { validateProductUpdate } from "../validations/ProductValidation.js";
const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  adminAuthMiddleware,
  validateProduct,
  ProductController.createProduct,
);
router.put(
  "/update/:id",
  authMiddleware,
  adminAuthMiddleware,
  validateProductUpdate,
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

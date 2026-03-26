import express from "express";
import ProductController from "../controllers/ProductController.js";
import { adminAuthMiddleware } from "../middlewares/authMiddleware.js";
import { validateProduct } from "../validations/ProductValidation.js";
import { validateProductUpdate } from "../validations/ProductValidation.js";
const router = express.Router();

router.post(
  "/create",
  validateProduct,
  adminAuthMiddleware,
  ProductController.createProduct,
);
router.put(
  "/update/:id",
  validateProductUpdate,
  adminAuthMiddleware,
  ProductController.updateProduct,
);
router.delete(
  "/delete/:id",
  adminAuthMiddleware,
  ProductController.deleteProduct,
);
router.get("/get-details/:id", ProductController.getDetailProduct);
router.get("/get-all", ProductController.getAllProduct);

export default router;

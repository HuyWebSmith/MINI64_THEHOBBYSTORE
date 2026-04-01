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
router.post(
  "/upload-cloudinary/:id",
  authMiddleware,
  adminAuthMiddleware,
  ProductController.uploadProductImageToCloudinary,
);
router.post(
  "/generate-3d/:id",
  authMiddleware,
  adminAuthMiddleware,
  ProductController.startGenerate3D,
);
router.post(
  "/sync-3d/:id",
  authMiddleware,
  adminAuthMiddleware,
  ProductController.syncGenerate3D,
);
router.get(
  "/3d-status/:id",
  authMiddleware,
  adminAuthMiddleware,
  ProductController.get3DStatus,
);
router.get("/get-details/:id", ProductController.getDetailProduct);
router.get("/get-all", ProductController.getAllProduct);

export default router;

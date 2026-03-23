import express from "express";
import ProductController from "../controllers/ProductController.js";
import { adminAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", adminAuthMiddleware, ProductController.createProduct);
router.put("/update/:id", adminAuthMiddleware, ProductController.updateProduct);
router.delete(
  "/delete/:id",
  adminAuthMiddleware,
  ProductController.deleteProduct,
);
router.get("/get-details/:id", ProductController.getDetailProduct);
router.get("/get-all", ProductController.getAllProduct);

export default router;

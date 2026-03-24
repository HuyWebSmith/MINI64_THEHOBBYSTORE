import express from "express";
import CategoryController from "../controllers/CategoryController.js";
import {
  authMiddleware,
  adminAuthMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  adminAuthMiddleware,
  CategoryController.createCategory,
);

router.put(
  "/update/:id",
  authMiddleware,
  adminAuthMiddleware,
  CategoryController.updateCategory,
);

router.delete(
  "/delete/:id",
  authMiddleware,
  adminAuthMiddleware,
  CategoryController.deleteCategory,
);

router.get("/get-details/:id", CategoryController.getDetailCategory);

router.get("/get-all", CategoryController.getAllCategory);

export default router;

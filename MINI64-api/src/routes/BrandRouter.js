import express from "express";
import BrandController from "../controllers/BrandController.js";
import {
  adminAuthMiddleware,
  authMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, adminAuthMiddleware, BrandController.createBrand);
router.put("/update/:id", authMiddleware, adminAuthMiddleware, BrandController.updateBrand);
router.delete("/delete/:id", authMiddleware, adminAuthMiddleware, BrandController.deleteBrand);
router.get("/get-details/:id", BrandController.getDetailBrand);
router.get("/get-all", BrandController.getAllBrand);

export default router;

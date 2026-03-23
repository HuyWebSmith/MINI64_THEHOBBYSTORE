import express from "express";
import BrandController from "../controllers/BrandController.js";
import { adminAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", adminAuthMiddleware, BrandController.createBrand);
router.put("/update/:id", adminAuthMiddleware, BrandController.updateBrand);
router.delete("/delete/:id", adminAuthMiddleware, BrandController.deleteBrand);
router.get("/get-details/:id", BrandController.getDetailBrand);
router.get("/get-all", BrandController.getAllBrand);

export default router;

import express from "express";
import multer from "multer";
import ReviewController from "../controllers/ReviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  ReviewController.createReview,
);
router.get("/:productId", ReviewController.getProductReviews);

export default router;

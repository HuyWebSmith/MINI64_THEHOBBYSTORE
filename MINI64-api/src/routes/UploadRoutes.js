import express from "express";
import multer from "multer";
import UploadController from "../controllers/UploadController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), UploadController.handleUpload);

export default router;

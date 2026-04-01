import UploadService from "../services/UploadService.js";

class UploadController {
  async handleUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Không tìm thấy file!" });
      }

      // Đẩy Buffer trực tiếp từ RAM lên Cloudinary
      const uploadResult = await UploadService.uploadImage(
        req.file.buffer,
        `prod_${Date.now()}`,
      );

      // Lấy các link ảnh tối ưu
      const optimizeUrl = UploadService.getOptimizeUrl(uploadResult.public_id);
      const autoCropUrl = UploadService.getAutoCropUrl(uploadResult.public_id);

      return res.status(200).json({
        message: "Upload trực tiếp thành công!",
        data: {
          original: uploadResult.secure_url,
          optimized: optimizeUrl,
          cropped: autoCropUrl,
          public_id: uploadResult.public_id,
        },
      });
    } catch (error) {
      console.error("Cloudinary Error:", error);
      return res.status(500).json({
        message: "Lỗi khi lưu lên Cloudinary",
        error: error.message,
      });
    }
  }
}

export default new UploadController();

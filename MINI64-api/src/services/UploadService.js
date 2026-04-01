import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
class UploadService {
  async uploadImage(fileBuffer, publicId) {
    return new Promise((resolve, reject) => {
      // Tạo luồng upload lên Cloudinary
      const cld_upload_stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: "mini64", // Bạn có thể gom nhóm vào folder trên Cloudinary
        },
        (error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        },
      );

      // Chuyển Buffer từ RAM thành Stream và "bơm" vào Cloudinary
      streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
    });
  }

  // Các hàm tạo URL vẫn giữ nguyên
  getOptimizeUrl(publicId) {
    return cloudinary.url(publicId, { fetch_format: "auto", quality: "auto" });
  }

  getAutoCropUrl(publicId) {
    return cloudinary.url(publicId, {
      crop: "auto",
      gravity: "auto",
      width: 500,
      height: 500,
    });
  }
}

export default new UploadService();

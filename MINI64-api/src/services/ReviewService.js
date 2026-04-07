import mongoose from "mongoose";
import Review from "../models/ReviewModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import Order from "../models/OrderProduct.js";
import UploadService from "./UploadService.js";

class ReviewService {
  resolveUserId(userPayload) {
    return userPayload?.id || userPayload?.payload?.id || null;
  }

  async createReview(userPayload, payload, files = []) {
    const userId = this.resolveUserId(userPayload);
    const { productId, rating, title, comment } = payload;

    if (!userId) {
      return { status: "ERR", message: "Unauthorized" };
    }

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return { status: "ERR", message: "Invalid product id" };
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return { status: "ERR", message: "Rating must be between 1 and 5" };
    }

    if (!comment?.trim()) {
      return { status: "ERR", message: "Comment is required" };
    }

    const [product, user] = await Promise.all([
      Product.findById(productId),
      User.findById(userId),
    ]);

    if (!product) {
      return { status: "ERR", message: "Product not found" };
    }

    if (!user) {
      return { status: "ERR", message: "User not found" };
    }

    const uploadedImages = await Promise.all(
      files.map(async (file, index) => {
        const uploaded = await UploadService.uploadImage(
          file.buffer,
          `review-${productId}-${userId}-${Date.now()}-${index}`,
        );

        return {
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        };
      }),
    );

    const verifiedOrder = await Order.findOne({
      user: userId,
      "orderItems.product": productId,
    }).sort({ createdAt: -1 });

    const review = await Review.create({
      product: productId,
      user: userId,
      order: verifiedOrder?._id ?? null,
      rating: Number(rating),
      title: title?.trim() ?? "",
      comment: comment.trim(),
      images: uploadedImages,
      verifiedBuyer: !!verifiedOrder,
    });

    const productReviews = await Review.find({ product: productId });
    const averageRating =
      productReviews.reduce((sum, item) => sum + item.rating, 0) /
      Math.max(productReviews.length, 1);

    await Product.findByIdAndUpdate(productId, {
      rating: Number(averageRating.toFixed(1)),
    });

    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "name email",
    );

    return {
      status: "OK",
      message: "Review created successfully",
      data: populatedReview,
    };
  }

  async getProductReviews(productId, sort = "recent") {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return { status: "ERR", message: "Invalid product id" };
    }

    const sortOption =
      sort === "highest-rated"
        ? { rating: -1, createdAt: -1 }
        : { createdAt: -1 };

    const reviews = await Review.find({ product: productId })
      .populate("user", "name email")
      .sort(sortOption);

    return {
      status: "OK",
      message: "SUCCESS",
      data: reviews,
    };
  }
}

export default new ReviewService();

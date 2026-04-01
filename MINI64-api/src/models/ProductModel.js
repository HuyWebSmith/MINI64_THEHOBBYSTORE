import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    model3dUrl: { type: String, default: "" },
    model3dStatus: {
      type: String,
      enum: ["idle", "processing", "ready", "failed"],
      default: "idle",
    },
    model3dProvider: { type: String, default: "tripo3d" },
    model3dJobId: { type: String, default: "" },
    model3dError: { type: String, default: "" },
    model3dRequestedAt: { type: Date, default: null },
    model3dCompletedAt: { type: Date, default: null },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    rating: { type: Number, required: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);
export default Product;

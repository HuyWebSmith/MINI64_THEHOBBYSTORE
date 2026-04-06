import mongoose from "mongoose";

const liveOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    product: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      originalPrice: {
        type: Number,
        required: true,
      },
      tempPrice: {
        type: Number,
        required: true,
      },
      options: {
        type: [String],
        default: [],
      },
    },
    selectedOptions: {
      type: [String],
      default: [],
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const LiveOrder = mongoose.model("LiveOrder", liveOrderSchema);

export default LiveOrder;

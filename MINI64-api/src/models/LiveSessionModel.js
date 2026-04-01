import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "live", "ended"],
      default: "draft",
    },
    streamProvider: {
      type: String,
      enum: ["100ms"],
      default: "100ms",
    },
    hostRoomLink: {
      type: String,
      default: "",
      trim: true,
    },
    viewerRoomLink: {
      type: String,
      default: "",
      trim: true,
    },
    hostUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    featuredProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSession;

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["admin", "customer"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

const conversationSchema = new mongoose.Schema(
  {
    customerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestSessionId: {
      type: String,
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    lastMessageText: {
      type: String,
      default: "",
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadAdminCount: {
      type: Number,
      default: 0,
    },
    unreadCustomerCount: {
      type: Number,
      default: 0,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index(
  { customerUser: 1 },
  {
    unique: true,
    partialFilterExpression: { customerUser: { $type: "objectId" } },
  },
);

conversationSchema.index(
  { guestSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { guestSessionId: { $type: "string" } },
  },
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;

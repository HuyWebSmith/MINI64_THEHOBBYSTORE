import mongoose from "mongoose";
import Conversation from "../models/ConversationModel.js";
import User from "../models/UserModel.js";

const MAX_MESSAGES = 100;

class ChatService {
  resolveUserPayload(userPayload) {
    return userPayload?.payload || userPayload || null;
  }

  resolveUserId(userPayload) {
    const user = this.resolveUserPayload(userPayload);
    return user?.id || user?._id || null;
  }

  resolveUserRole(userPayload) {
    const user = this.resolveUserPayload(userPayload);
    return user?.role || null;
  }

  async buildConversationResponse(conversation) {
    if (!conversation) {
      return null;
    }

    const doc =
      typeof conversation.toObject === "function"
        ? conversation.toObject()
        : { ...conversation };

    const isCustomerOnline = !!doc.isCustomerOnline;
    const isAdminOnline = !!doc.isAdminOnline;
    const typingRole = doc.typingRole || null;

    delete doc.isCustomerOnline;
    delete doc.isAdminOnline;
    delete doc.typingRole;

    return {
      ...doc,
      id: doc._id?.toString?.() || doc._id,
      customerUser: doc.customerUser
        ? {
            _id: doc.customerUser._id?.toString?.() || doc.customerUser._id,
            name: doc.customerUser.name,
            email: doc.customerUser.email,
            role: doc.customerUser.role,
          }
        : null,
      messages: Array.isArray(doc.messages)
        ? doc.messages.map((message) => ({
            ...message,
            id: message._id?.toString?.() || message._id,
          }))
        : [],
      isCustomerOnline,
      isAdminOnline,
      typingRole,
    };
  }

  async findConversationById(conversationId) {
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return null;
    }

    return Conversation.findById(conversationId)
      .populate("customerUser", "name email role")
      .exec();
  }

  async getOrCreateConversation({ userPayload, guestName, guestSessionId }) {
    const resolvedUser = this.resolveUserPayload(userPayload);
    const userId = this.resolveUserId(resolvedUser);

    if (!userId && !guestSessionId) {
      return {
        status: "ERR",
        message: "guestSessionId is required for guest chat.",
      };
    }

    let conversation = null;

    if (userId) {
      conversation = await Conversation.findOne({ customerUser: userId }).populate(
        "customerUser",
        "name email role",
      );
    } else {
      conversation = await Conversation.findOne({ guestSessionId }).populate(
        "customerUser",
        "name email role",
      );
    }

    if (!conversation) {
      let user = null;

      if (userId) {
        user = await User.findById(userId).select("name email role");
      }

      conversation = await Conversation.create({
        customerUser: user?._id ?? null,
        guestSessionId: user ? null : guestSessionId,
        customerName: user?.name || String(guestName || "").trim() || "Guest Customer",
        customerEmail: user?.email || "",
        messages: [],
      });

      conversation = await Conversation.findById(conversation._id).populate(
        "customerUser",
        "name email role",
      );
    } else {
      const nextName =
        resolvedUser?.name || String(guestName || "").trim() || conversation.customerName;
      const nextEmail = resolvedUser?.email || conversation.customerEmail || "";

      if (
        nextName !== conversation.customerName ||
        nextEmail !== conversation.customerEmail
      ) {
        conversation.customerName = nextName;
        conversation.customerEmail = nextEmail;
        await conversation.save();
      }
    }

    return {
      status: "OK",
      message: "CHAT_SESSION_READY",
      data: await this.buildConversationResponse(conversation),
    };
  }

  async canAccessConversation({ conversation, userPayload, guestSessionId }) {
    if (!conversation) {
      return false;
    }

    const role = this.resolveUserRole(userPayload);
    if (role === "admin") {
      return true;
    }

    const userId = this.resolveUserId(userPayload);
    if (userId && conversation.customerUser?._id?.toString() === userId.toString()) {
      return true;
    }

    if (!userId && guestSessionId && conversation.guestSessionId === guestSessionId) {
      return true;
    }

    return false;
  }

  async getAdminConversations() {
    const conversations = await Conversation.find()
      .populate("customerUser", "name email role")
      .sort({ lastMessageAt: -1 });

    return {
      status: "OK",
      message: "GET_CHAT_CONVERSATIONS_SUCCESS",
      data: await Promise.all(
        conversations.map(async (conversation) => {
          const formattedConversation = await this.buildConversationResponse(
            conversation,
          );

          return {
            ...formattedConversation,
            messages: formattedConversation?.messages?.slice(-20) ?? [],
          };
        }),
      ),
    };
  }

  async getConversationDetail({ conversationId, userPayload, guestSessionId }) {
    const conversation = await this.findConversationById(conversationId);
    if (!conversation) {
      return { status: "ERR", message: "Conversation not found." };
    }

    const canAccess = await this.canAccessConversation({
      conversation,
      userPayload,
      guestSessionId,
    });

    if (!canAccess) {
      return { status: "ERR", message: "Unauthorized chat access." };
    }

    return {
      status: "OK",
      message: "GET_CHAT_CONVERSATION_SUCCESS",
      data: await this.buildConversationResponse(conversation),
    };
  }

  async appendMessage({ conversationId, senderRole, senderName, text }) {
    const conversation = await this.findConversationById(conversationId);

    if (!conversation) {
      return { status: "ERR", message: "Conversation not found." };
    }

    const trimmedText = String(text || "").trim();
    if (!trimmedText) {
      return { status: "ERR", message: "Message cannot be empty." };
    }

    conversation.messages.push({
      senderRole,
      senderName: String(senderName || "").trim() || "Anonymous",
      text: trimmedText.slice(0, 1000),
      deliveredAt: new Date(),
    });

    if (conversation.messages.length > MAX_MESSAGES) {
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
    }

    conversation.lastMessageText = trimmedText.slice(0, 1000);
    conversation.lastMessageAt = new Date();
    if (senderRole === "customer") {
      conversation.unreadAdminCount += 1;
      conversation.unreadCustomerCount = 0;
    } else {
      conversation.unreadCustomerCount += 1;
      conversation.unreadAdminCount = 0;
    }

    await conversation.save();

    return {
      status: "OK",
      message: "CHAT_MESSAGE_SENT",
      data: await this.buildConversationResponse(conversation),
    };
  }

  async markConversationSeen({
    conversationId,
    viewerRole,
    userPayload,
    guestSessionId,
  }) {
    const conversation = await this.findConversationById(conversationId);

    if (!conversation) {
      return { status: "ERR", message: "Conversation not found." };
    }

    const canAccess = await this.canAccessConversation({
      conversation,
      userPayload,
      guestSessionId,
    });

    if (!canAccess) {
      return { status: "ERR", message: "Unauthorized chat access." };
    }

    const now = new Date();
    conversation.messages = conversation.messages.map((message) => {
      if (message.senderRole !== viewerRole && !message.seenAt) {
        message.seenAt = now;
      }
      return message;
    });

    if (viewerRole === "admin") {
      conversation.unreadAdminCount = 0;
    } else {
      conversation.unreadCustomerCount = 0;
    }

    await conversation.save();

    return {
      status: "OK",
      message: "CHAT_MARK_SEEN_SUCCESS",
      data: await this.buildConversationResponse(conversation),
    };
  }
}

export default new ChatService();

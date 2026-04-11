import jwt from "jsonwebtoken";
import ChatService from "../services/ChatService.js";

const CHAT_EVENTS = {
  JOIN_ADMIN: "CHAT_JOIN_ADMIN",
  JOIN_CONVERSATION: "CHAT_JOIN_CONVERSATION",
  SEND_MESSAGE: "CHAT_SEND_MESSAGE",
  MESSAGE_RECEIVED: "CHAT_MESSAGE_RECEIVED",
  TYPING: "CHAT_TYPING",
  TYPING_UPDATED: "CHAT_TYPING_UPDATED",
  PRESENCE_UPDATED: "CHAT_PRESENCE_UPDATED",
  CONVERSATION_UPDATED: "CHAT_CONVERSATION_UPDATED",
  ERROR: "CHAT_ERROR",
};

const adminSocketIds = new Set();
const conversationPresence = new Map();
const socketMembership = new Map();

function getConversationRoom(conversationId) {
  return `chat:conversation:${conversationId}`;
}

function getTokenFromHandshake(socket) {
  const authToken = socket.handshake.auth?.token;
  const headerToken = socket.handshake.headers?.authorization;

  if (authToken) {
    return authToken.startsWith("Bearer ") ? authToken.split(" ")[1] : authToken;
  }

  if (headerToken?.startsWith("Bearer ")) {
    return headerToken.split(" ")[1];
  }

  return null;
}

function normalizeUserFromTokenPayload(decodedToken) {
  return decodedToken?.payload || decodedToken || null;
}

function ensureConversationPresence(conversationId) {
  if (!conversationPresence.has(conversationId)) {
    conversationPresence.set(conversationId, {
      customerSocketIds: new Set(),
      adminSocketIds: new Set(),
      typingRole: null,
    });
  }

  return conversationPresence.get(conversationId);
}

function getPresencePayload(conversationId) {
  const presence = conversationPresence.get(conversationId);

  return {
    conversationId,
    isCustomerOnline: !!presence?.customerSocketIds.size,
    isAdminOnline: !!presence?.adminSocketIds.size,
    typingRole: presence?.typingRole ?? null,
  };
}

function removeSocketMembership(socketId) {
  const membership = socketMembership.get(socketId);
  if (!membership) {
    return [];
  }

  const changedConversationIds = [];

  membership.forEach(({ conversationId, role }) => {
    const presence = conversationPresence.get(conversationId);
    if (!presence) {
      return;
    }

    if (role === "admin") {
      presence.adminSocketIds.delete(socketId);
    } else {
      presence.customerSocketIds.delete(socketId);
    }

    if (presence.typingRole === role) {
      presence.typingRole = null;
    }

    if (!presence.adminSocketIds.size && !presence.customerSocketIds.size) {
      conversationPresence.delete(conversationId);
    }

    changedConversationIds.push(conversationId);
  });

  socketMembership.delete(socketId);
  return changedConversationIds;
}

async function emitConversationSnapshot(io, conversationId) {
  const response = await ChatService.getConversationDetail({
    conversationId,
    userPayload: { payload: { role: "admin" } },
    guestSessionId: null,
  });

  if (response.status !== "OK") {
    return;
  }

  const snapshot = {
    ...response.data,
    ...getPresencePayload(conversationId),
  };

  io.to(getConversationRoom(conversationId)).emit(CHAT_EVENTS.CONVERSATION_UPDATED, snapshot);
  io.to("chat:admins").emit(CHAT_EVENTS.CONVERSATION_UPDATED, snapshot);
}

export function initChatSocket(io) {
  io.use((socket, next) => {
    const token = getTokenFromHandshake(socket);

    if (!token) {
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
      socket.user = normalizeUserFromTokenPayload(decoded);
      return next();
    } catch {
      socket.user = null;
      return next();
    }
  });

  io.on("connection", (socket) => {
    socket.on(CHAT_EVENTS.JOIN_ADMIN, () => {
      const role = ChatService.resolveUserRole(socket.user);
      if (role !== "admin") {
        socket.emit(CHAT_EVENTS.ERROR, {
          message: "Admin privileges are required for chat dashboard.",
        });
        return;
      }

      adminSocketIds.add(socket.id);
      socket.join("chat:admins");
    });

    socket.on(
      CHAT_EVENTS.JOIN_CONVERSATION,
      async ({ conversationId, guestSessionId } = {}) => {
        const response = await ChatService.getConversationDetail({
          conversationId,
          userPayload: socket.user,
          guestSessionId,
        });

        if (response.status !== "OK") {
          socket.emit(CHAT_EVENTS.ERROR, { message: response.message });
          return;
        }

        const role = ChatService.resolveUserRole(socket.user) === "admin" ? "admin" : "customer";
        const room = getConversationRoom(conversationId);
        socket.join(room);

        if (!socketMembership.has(socket.id)) {
          socketMembership.set(socket.id, []);
        }

        const membership = socketMembership.get(socket.id);
        const exists = membership.some((item) => item.conversationId === conversationId);
        if (!exists) {
          membership.push({ conversationId, role });
        }

        const presence = ensureConversationPresence(conversationId);
        if (role === "admin") {
          presence.adminSocketIds.add(socket.id);
        } else {
          presence.customerSocketIds.add(socket.id);
        }

        const snapshot = {
          ...response.data,
          ...getPresencePayload(conversationId),
        };

        socket.emit(CHAT_EVENTS.CONVERSATION_UPDATED, snapshot);
        io.to(room).emit(CHAT_EVENTS.PRESENCE_UPDATED, getPresencePayload(conversationId));
        io.to("chat:admins").emit(CHAT_EVENTS.PRESENCE_UPDATED, getPresencePayload(conversationId));
      },
    );

    socket.on(
      CHAT_EVENTS.SEND_MESSAGE,
      async ({ conversationId, guestSessionId, text } = {}) => {
        const detailResponse = await ChatService.getConversationDetail({
          conversationId,
          userPayload: socket.user,
          guestSessionId,
        });

        if (detailResponse.status !== "OK") {
          socket.emit(CHAT_EVENTS.ERROR, { message: detailResponse.message });
          return;
        }

        const senderRole =
          ChatService.resolveUserRole(socket.user) === "admin" ? "admin" : "customer";
        const senderName =
          senderRole === "admin"
            ? ChatService.resolveUserPayload(socket.user)?.name || "Admin"
            : detailResponse.data.customerName;

        const messageResponse = await ChatService.appendMessage({
          conversationId,
          senderRole,
          senderName,
          text,
        });

        if (messageResponse.status !== "OK") {
          socket.emit(CHAT_EVENTS.ERROR, { message: messageResponse.message });
          return;
        }

        const updatedConversation = {
          ...messageResponse.data,
          ...getPresencePayload(conversationId),
        };
        const lastMessage =
          updatedConversation.messages[updatedConversation.messages.length - 1] || null;

        io.to(getConversationRoom(conversationId)).emit(CHAT_EVENTS.MESSAGE_RECEIVED, {
          conversationId,
          message: lastMessage,
        });

        io.to(getConversationRoom(conversationId)).emit(
          CHAT_EVENTS.CONVERSATION_UPDATED,
          updatedConversation,
        );
        io.to("chat:admins").emit(CHAT_EVENTS.CONVERSATION_UPDATED, updatedConversation);

        const presence = ensureConversationPresence(conversationId);
        presence.typingRole = null;
        io.to(getConversationRoom(conversationId)).emit(
          CHAT_EVENTS.TYPING_UPDATED,
          getPresencePayload(conversationId),
        );
      },
    );

    socket.on(
      CHAT_EVENTS.TYPING,
      async ({ conversationId, guestSessionId, isTyping } = {}) => {
        const detailResponse = await ChatService.getConversationDetail({
          conversationId,
          userPayload: socket.user,
          guestSessionId,
        });

        if (detailResponse.status !== "OK") {
          return;
        }

        const role = ChatService.resolveUserRole(socket.user) === "admin" ? "admin" : "customer";
        const presence = ensureConversationPresence(conversationId);
        presence.typingRole = isTyping ? role : null;

        const payload = getPresencePayload(conversationId);
        io.to(getConversationRoom(conversationId)).emit(CHAT_EVENTS.TYPING_UPDATED, payload);
        io.to("chat:admins").emit(CHAT_EVENTS.TYPING_UPDATED, payload);
      },
    );

    socket.on("disconnect", async () => {
      adminSocketIds.delete(socket.id);
      const changedConversationIds = removeSocketMembership(socket.id);

      for (const conversationId of changedConversationIds) {
        const payload = getPresencePayload(conversationId);
        io.to(getConversationRoom(conversationId)).emit(CHAT_EVENTS.PRESENCE_UPDATED, payload);
        io.to("chat:admins").emit(CHAT_EVENTS.PRESENCE_UPDATED, payload);
        await emitConversationSnapshot(io, conversationId);
      }
    });
  });
}

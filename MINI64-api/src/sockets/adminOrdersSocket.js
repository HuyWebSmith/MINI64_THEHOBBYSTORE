import jwt from "jsonwebtoken";

const ADMIN_ORDER_EVENTS = {
  CREATED: "ADMIN_ORDER_CREATED",
  UPDATED: "ADMIN_ORDER_UPDATED",
  ERROR: "ADMIN_ORDER_ERROR",
};

const ADMIN_ROOM = "admins";

let adminOrdersIo = null;

function normalizeUserFromTokenPayload(decodedToken) {
  return decodedToken?.payload || decodedToken || null;
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

function toAdminOrderRow(orderLike) {
  if (!orderLike?._id) {
    return null;
  }

  return {
    _id: orderLike._id?.toString?.() ? orderLike._id.toString() : String(orderLike._id),
    createdAt: orderLike.createdAt,
    totalPrice: orderLike.totalPrice,
    status: orderLike.status,
    trackingCode: orderLike.trackingCode ?? "",
    carrierName: orderLike.carrierName ?? "",
    shippingAddress: {
      fullName: orderLike.shippingAddress?.fullName ?? "",
    },
  };
}

export function initAdminOrdersSocket(io) {
  adminOrdersIo = io;

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
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user?.role === "admin") {
      socket.join(ADMIN_ROOM);
      return;
    }

    socket.emit(ADMIN_ORDER_EVENTS.ERROR, {
      message: "Admin privileges are required for this channel.",
    });
  });
}

export function emitAdminOrderCreated(orderLike) {
  if (!adminOrdersIo) return;
  const payload = toAdminOrderRow(orderLike);
  if (!payload) return;
  adminOrdersIo.to(ADMIN_ROOM).emit(ADMIN_ORDER_EVENTS.CREATED, payload);
}

export function emitAdminOrderUpdated(orderLike) {
  if (!adminOrdersIo) return;
  const payload = toAdminOrderRow(orderLike);
  if (!payload) return;
  adminOrdersIo.to(ADMIN_ROOM).emit(ADMIN_ORDER_EVENTS.UPDATED, payload);
}


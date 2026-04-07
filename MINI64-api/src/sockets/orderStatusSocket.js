import mongoose from "mongoose";
import Order from "../models/OrderProduct.js";
import { ORDER_STATUSES } from "../constants/orderStatus.js";

const ORDER_SOCKET_EVENTS = {
  SUBSCRIBE: "SUBSCRIBE_ORDER_TRACKING",
  UNSUBSCRIBE: "UNSUBSCRIBE_ORDER_TRACKING",
  UPDATED: "ORDER_STATUS_UPDATED",
  ERROR: "ORDER_TRACKING_ERROR",
};

const orderSubscriptions = new Map();
let orderStatusIo = null;

function addSubscription(orderId, socketId) {
  const current = orderSubscriptions.get(orderId) ?? new Set();
  current.add(socketId);
  orderSubscriptions.set(orderId, current);
}

function removeSubscription(orderId, socketId) {
  const current = orderSubscriptions.get(orderId);
  if (!current) {
    return;
  }

  current.delete(socketId);
  if (current.size === 0) {
    orderSubscriptions.delete(orderId);
  }
}

function removeSocketFromAllOrders(socketId) {
  orderSubscriptions.forEach((socketIds, orderId) => {
    socketIds.delete(socketId);
    if (socketIds.size === 0) {
      orderSubscriptions.delete(orderId);
    }
  });
}

function buildOrderStatusMessage(order) {
  const shortOrderId = order._id.toString().slice(-6).toUpperCase();

  if (order.status === ORDER_STATUSES.SHIPPING) {
    return `Đơn hàng #${shortOrderId} của bạn đang trên đường giao đến!`;
  }

  if (order.status === ORDER_STATUSES.DELIVERED) {
    return `Đơn hàng #${shortOrderId} đã được giao thành công.`;
  }

  return `Đơn hàng #${shortOrderId} vừa được cập nhật trạng thái.`;
}

export function initOrderStatusSocket(io) {
  orderStatusIo = io;

  io.on("connection", (socket) => {
    socket.on(
      ORDER_SOCKET_EVENTS.SUBSCRIBE,
      async ({ orderId, email } = {}) => {
        try {
          if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            socket.emit(ORDER_SOCKET_EVENTS.ERROR, {
              message: "Invalid order id.",
            });
            return;
          }

          const normalizedEmail = String(email ?? "").trim().toLowerCase();
          if (!normalizedEmail) {
            socket.emit(ORDER_SOCKET_EVENTS.ERROR, {
              message: "Email is required to subscribe.",
            });
            return;
          }

          const order = await Order.findOne({
            _id: orderId,
            "shippingAddress.email": normalizedEmail,
          }).select("_id");

          if (!order) {
            socket.emit(ORDER_SOCKET_EVENTS.ERROR, {
              message: "Order subscription failed.",
            });
            return;
          }

          addSubscription(orderId, socket.id);
          socket.join(`order:${orderId}`);
        } catch (error) {
          socket.emit(ORDER_SOCKET_EVENTS.ERROR, {
            message: error.message,
          });
        }
      },
    );

    socket.on(ORDER_SOCKET_EVENTS.UNSUBSCRIBE, ({ orderId } = {}) => {
      if (!orderId) {
        return;
      }

      removeSubscription(orderId, socket.id);
      socket.leave(`order:${orderId}`);
    });

    socket.on("disconnect", () => {
      removeSocketFromAllOrders(socket.id);
    });
  });
}

export function emitOrderStatusUpdated(order) {
  if (!orderStatusIo || !order?._id) {
    return;
  }

  const shouldNotify =
    order.status === ORDER_STATUSES.SHIPPING ||
    order.status === ORDER_STATUSES.DELIVERED;

  if (!shouldNotify) {
    return;
  }

  const subscribedSocketIds = orderSubscriptions.get(order._id.toString());
  if (!subscribedSocketIds?.size) {
    return;
  }

  const payload = {
    orderId: order._id.toString(),
    status: order.status,
    message: buildOrderStatusMessage(order),
    trackingCode: order.trackingCode ?? "",
    carrierName: order.carrierName ?? "",
    currentTimelineNote: order.currentTimelineNote ?? "",
    updatedAt: order.updatedAt ?? new Date().toISOString(),
    statusHistory: order.statusHistory ?? [],
  };

  subscribedSocketIds.forEach((socketId) => {
    orderStatusIo.to(socketId).emit(ORDER_SOCKET_EVENTS.UPDATED, payload);
  });
}

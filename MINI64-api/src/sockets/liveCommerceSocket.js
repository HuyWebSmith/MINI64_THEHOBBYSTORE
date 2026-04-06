import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import LiveOrder from "../models/LiveOrderModel.js";
import {
  buildPinnedProduct,
  clearPinnedProduct,
  getDisplayPrice,
  getRemainingGoldenHourSeconds,
  liveSession,
  updatePinnedGoldenHour,
} from "./liveSessionStore.js";

let broadcasterSocketId = null;
const audienceSocketIds = new Set();
let tickInterval = null;

const ADMIN_EVENTS = {
  START: "ADMIN_START_LIVE",
  END: "ADMIN_END_LIVE",
  PIN_PRODUCT: "ADMIN_PIN_PRODUCT",
  UPDATE_STOCK: "ADMIN_UPDATE_STOCK",
  UPDATE_DEAL: "ADMIN_UPDATE_PINNED_DEAL",
};

const CLIENT_EVENTS = {
  SYNC_STATE: "SYNC_LIVE_STATE",
  SYNC_PRODUCT: "SYNC_PRODUCT",
  STOCK_UPDATED: "STOCK_UPDATED",
  TICK: "TICK",
  BROADCAST_READY: "LIVE_BROADCAST_READY",
  NEW_ORDER_ALERT: "NEW_ORDER_ALERT",
  CHAT_MESSAGE: "LIVE_CHAT_MESSAGE",
  ERROR: "LIVE_ERROR",
  VIEWER_JOINED: "LIVE_VIEWER_JOINED",
  PEER_LEFT: "LIVE_PEER_LEFT",
  SIGNAL: "LIVE_SIGNAL",
};

const STREAM_EVENTS = {
  REGISTER_BROADCASTER: "ADMIN_REGISTER_BROADCASTER",
  JOIN_AUDIENCE: "JOIN_LIVE_AUDIENCE",
  SIGNAL: "WEBRTC_SIGNAL",
  CHAT_MESSAGE: "SEND_LIVE_CHAT_MESSAGE",
  RESYNC_AUDIENCE: "ADMIN_RESYNC_AUDIENCE",
};

async function ensureAdmin(socket) {
  if (socket.user?.role !== "admin") {
    socket.emit(CLIENT_EVENTS.ERROR, {
      message: "Admin privileges are required for this action.",
    });
    return false;
  }

  return true;
}

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

function emitLiveState(io) {
  io.emit(CLIENT_EVENTS.SYNC_STATE, {
    isActive: liveSession.isActive,
    viewerCount: liveSession.viewerCount,
    pinnedProduct: liveSession.pinnedProduct,
    orders: liveSession.orders,
    comments: liveSession.comments,
    remainingSeconds: liveSession.remainingSeconds,
  });
}

function emitTick(io) {
  io.emit(CLIENT_EVENTS.TICK, {
    remainingSeconds: liveSession.remainingSeconds,
    pinnedProductId: liveSession.pinnedProduct?.id ?? null,
  });
}

function stopTicking() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function startGoldenHourCountdown(io) {
  stopTicking();
  liveSession.remainingSeconds = getRemainingGoldenHourSeconds();
  emitTick(io);

  tickInterval = setInterval(() => {
    liveSession.remainingSeconds = getRemainingGoldenHourSeconds();
    emitTick(io);

    if (liveSession.remainingSeconds <= 0) {
      stopTicking();
      clearPinnedProduct();
      io.emit(CLIENT_EVENTS.SYNC_PRODUCT, null);
      emitLiveState(io);
      emitTick(io);
    }
  }, 1000);
}

function endLiveSession(io) {
  liveSession.isActive = false;
  clearPinnedProduct();
  stopTicking();
  io.emit(CLIENT_EVENTS.SYNC_PRODUCT, null);
  emitLiveState(io);
  emitTick(io);
}

function notifyBroadcasterAboutAudience(io) {
  if (!broadcasterSocketId) {
    return;
  }

  audienceSocketIds.forEach((viewerSocketId) => {
    io.to(broadcasterSocketId).emit(CLIENT_EVENTS.VIEWER_JOINED, {
      viewerSocketId,
    });
  });
}

function notifyAudienceBroadcasterReady(io) {
  audienceSocketIds.forEach((viewerSocketId) => {
    io.to(viewerSocketId).emit(CLIENT_EVENTS.BROADCAST_READY, {
      broadcasterSocketId,
    });
  });
}

export function initLiveCommerceSocket(io) {
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
    socket.emit(CLIENT_EVENTS.SYNC_STATE, {
      isActive: liveSession.isActive,
      viewerCount: liveSession.viewerCount,
      pinnedProduct: liveSession.pinnedProduct,
      orders: liveSession.orders,
      comments: liveSession.comments,
      remainingSeconds: liveSession.remainingSeconds,
    });
    socket.emit(CLIENT_EVENTS.TICK, {
      remainingSeconds: liveSession.remainingSeconds,
      pinnedProductId: liveSession.pinnedProduct?.id ?? null,
    });

    if (liveSession.isActive && liveSession.pinnedProduct) {
      socket.emit(CLIENT_EVENTS.SYNC_PRODUCT, liveSession.pinnedProduct);
    }

    socket.on(ADMIN_EVENTS.START, async () => {
      if (!(await ensureAdmin(socket))) {
        return;
      }

      liveSession.isActive = true;
      emitLiveState(io);
    });

    socket.on(ADMIN_EVENTS.END, async () => {
      if (!(await ensureAdmin(socket))) {
        return;
      }

      endLiveSession(io);
    });

    socket.on(STREAM_EVENTS.REGISTER_BROADCASTER, async () => {
      if (!(await ensureAdmin(socket))) {
        return;
      }

      broadcasterSocketId = socket.id;
      socket.emit(CLIENT_EVENTS.SYNC_STATE, {
        isActive: liveSession.isActive,
        viewerCount: liveSession.viewerCount,
        pinnedProduct: liveSession.pinnedProduct,
        orders: liveSession.orders,
        comments: liveSession.comments,
        remainingSeconds: liveSession.remainingSeconds,
      });
      notifyBroadcasterAboutAudience(io);
      notifyAudienceBroadcasterReady(io);
    });

    socket.on(STREAM_EVENTS.RESYNC_AUDIENCE, async () => {
      if (!(await ensureAdmin(socket))) {
        return;
      }

      broadcasterSocketId = socket.id;
      notifyBroadcasterAboutAudience(io);
      notifyAudienceBroadcasterReady(io);
    });

    socket.on(STREAM_EVENTS.JOIN_AUDIENCE, () => {
      if (!audienceSocketIds.has(socket.id)) {
        audienceSocketIds.add(socket.id);
        liveSession.viewerCount = audienceSocketIds.size;
      }

      socket.emit(CLIENT_EVENTS.SYNC_STATE, {
        isActive: liveSession.isActive,
        viewerCount: liveSession.viewerCount,
        pinnedProduct: liveSession.pinnedProduct,
        orders: liveSession.orders,
        comments: liveSession.comments,
        remainingSeconds: liveSession.remainingSeconds,
      });

      if (broadcasterSocketId) {
        io.to(broadcasterSocketId).emit(CLIENT_EVENTS.VIEWER_JOINED, {
          viewerSocketId: socket.id,
        });
      }

      emitLiveState(io);
    });

    socket.on(STREAM_EVENTS.SIGNAL, ({ targetSocketId, signal }) => {
      if (!targetSocketId || !signal) {
        socket.emit(CLIENT_EVENTS.ERROR, {
          message: "Signal payload is incomplete.",
        });
        return;
      }

      io.to(targetSocketId).emit(CLIENT_EVENTS.SIGNAL, {
        sourceSocketId: socket.id,
        signal,
      });
    });

    socket.on(
      ADMIN_EVENTS.PIN_PRODUCT,
      async ({ productId, goldenHourPrice, durationSeconds }) => {
      if (!(await ensureAdmin(socket))) {
        return;
      }

      try {
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
          socket.emit(CLIENT_EVENTS.ERROR, { message: "Invalid product id." });
          return;
        }

        const product = await Product.findById(productId);
        if (!product) {
          socket.emit(CLIENT_EVENTS.ERROR, { message: "Product not found." });
          return;
        }

        if (Number(goldenHourPrice) <= 0) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "Golden Hour price must be greater than zero.",
          });
          return;
        }

        liveSession.pinnedProduct = buildPinnedProduct(
          product,
          goldenHourPrice,
          durationSeconds,
        );
        liveSession.isActive = true;
        liveSession.remainingSeconds = getRemainingGoldenHourSeconds();

        io.emit(CLIENT_EVENTS.SYNC_PRODUCT, liveSession.pinnedProduct);
        emitLiveState(io);
        emitTick(io);
        startGoldenHourCountdown(io);
      } catch (error) {
        socket.emit(CLIENT_EVENTS.ERROR, { message: error.message });
      }
      },
    );

    socket.on(ADMIN_EVENTS.UPDATE_STOCK, async ({ productId, stock }) => {
      if (!(await ensureAdmin(socket))) {
        return;
      }

      if (!liveSession.pinnedProduct || liveSession.pinnedProduct.id !== productId) {
        socket.emit(CLIENT_EVENTS.ERROR, {
          message: "No pinned product matches the provided product id.",
        });
        return;
      }

      const nextStock = Number(stock);
      if (Number.isNaN(nextStock) || nextStock < 0) {
        socket.emit(CLIENT_EVENTS.ERROR, {
          message: "Stock must be a non-negative number.",
        });
        return;
      }

      liveSession.pinnedProduct.stock = nextStock;
      io.emit(CLIENT_EVENTS.STOCK_UPDATED, {
        productId,
        stock: liveSession.pinnedProduct.stock,
      });
      io.emit(CLIENT_EVENTS.SYNC_PRODUCT, liveSession.pinnedProduct);
      emitLiveState(io);
    });

    socket.on(
      ADMIN_EVENTS.UPDATE_DEAL,
      async ({ productId, goldenHourPrice, durationSeconds }) => {
        if (!(await ensureAdmin(socket))) {
          return;
        }

        if (!liveSession.pinnedProduct || liveSession.pinnedProduct.id !== productId) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "No pinned product matches the provided product id.",
          });
          return;
        }

        const nextPrice = Number(goldenHourPrice);
        if (Number.isNaN(nextPrice) || nextPrice <= 0) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "Golden Hour price must be greater than zero.",
          });
          return;
        }

        const updatedPinnedProduct = updatePinnedGoldenHour(
          durationSeconds,
          nextPrice,
        );

        if (!updatedPinnedProduct) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "Could not update the pinned deal.",
          });
          return;
        }

        emitTick(io);
        io.emit(CLIENT_EVENTS.SYNC_PRODUCT, updatedPinnedProduct);
        emitLiveState(io);
        startGoldenHourCountdown(io);
      },
    );

    socket.on(STREAM_EVENTS.CHAT_MESSAGE, ({ message }) => {
      const trimmedMessage = String(message ?? "").trim();

      if (!trimmedMessage) {
        socket.emit(CLIENT_EVENTS.ERROR, {
          message: "Comment message cannot be empty.",
        });
        return;
      }

      const comment = {
        id: new mongoose.Types.ObjectId().toString(),
        userId: socket.user?._id ?? null,
        author: socket.user?.name || socket.user?.email || "Guest Viewer",
        message: trimmedMessage.slice(0, 200),
        createdAt: new Date().toISOString(),
      };

      liveSession.comments = [...liveSession.comments, comment].slice(-30);
      io.emit(CLIENT_EVENTS.CHAT_MESSAGE, comment);
      emitLiveState(io);
    });

    socket.on(
      "PLACE_ORDER",
      async ({ productId, selectedOptions = [], quantity, price }) => {
        try {
        if (!liveSession.isActive || !liveSession.pinnedProduct) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "There is no active live session or pinned product.",
          });
          return;
        }

        if (liveSession.pinnedProduct.id !== productId) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "This product is not currently pinned in the live session.",
          });
          return;
        }

        const requestedQuantity = Number(quantity);
        if (Number.isNaN(requestedQuantity) || requestedQuantity <= 0) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "Quantity must be greater than zero.",
          });
          return;
        }

        const clientPrice = Number(price);
        const verifiedDisplayPrice = getDisplayPrice({
          _id: productId,
          originalPrice: liveSession.pinnedProduct.originalPrice,
          price: liveSession.pinnedProduct.originalPrice,
        });

        if (
          Number.isNaN(clientPrice) ||
          clientPrice !== Number(liveSession.pinnedProduct.tempPrice) ||
          clientPrice !== verifiedDisplayPrice
        ) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "The Golden Hour price is no longer valid. Please refresh the live deal.",
          });
          return;
        }

        if (liveSession.pinnedProduct.stock < requestedQuantity) {
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "Not enough stock available.",
          });
          return;
        }

        const product = await Product.findById(productId);
        if (!product) {
          socket.emit(CLIENT_EVENTS.ERROR, { message: "Product not found." });
          return;
        }

        if (Number(product.stock ?? 0) < requestedQuantity) {
          liveSession.pinnedProduct.stock = Number(product.stock ?? 0);
          io.emit(CLIENT_EVENTS.STOCK_UPDATED, {
            productId,
            stock: liveSession.pinnedProduct.stock,
          });
          socket.emit(CLIENT_EVENTS.ERROR, {
            message: "Not enough stock available in database.",
          });
          return;
        }

        liveSession.pinnedProduct.stock -= requestedQuantity;

        const orderRecord = {
          user:
            socket.user?._id && mongoose.Types.ObjectId.isValid(socket.user._id)
              ? new mongoose.Types.ObjectId(socket.user._id)
              : null,
          product: {
            id: product._id,
            name: product.name,
            originalPrice: product.price,
            tempPrice: verifiedDisplayPrice,
            options: liveSession.pinnedProduct.options,
          },
          selectedOptions,
          quantity: requestedQuantity,
          totalPrice: verifiedDisplayPrice * requestedQuantity,
        };

        const savedOrder = await LiveOrder.create(orderRecord);
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: -requestedQuantity },
        });

        liveSession.orders.push({
          id: savedOrder._id.toString(),
          userId: socket.user?._id ?? null,
          productId,
          selectedOptions,
          quantity: requestedQuantity,
          totalPrice: savedOrder.totalPrice,
          createdAt: savedOrder.createdAt,
        });

        io.emit(CLIENT_EVENTS.STOCK_UPDATED, {
          productId,
          stock: liveSession.pinnedProduct.stock,
        });
        io.emit(CLIENT_EVENTS.SYNC_PRODUCT, liveSession.pinnedProduct);
        emitLiveState(io);

        io.emit(CLIENT_EVENTS.NEW_ORDER_ALERT, {
          orderId: savedOrder._id.toString(),
          productName: savedOrder.product.name,
          quantity: savedOrder.quantity,
          totalPrice: savedOrder.totalPrice,
          userId: socket.user?._id ?? null,
        });

        socket.emit("ORDER_PLACED", {
          success: true,
          orderId: savedOrder._id.toString(),
        });
      } catch (error) {
        socket.emit(CLIENT_EVENTS.ERROR, { message: error.message });
      }
      },
    );

    socket.on("disconnect", () => {
      if (broadcasterSocketId === socket.id) {
        broadcasterSocketId = null;
        endLiveSession(io);
      }

      if (audienceSocketIds.delete(socket.id)) {
        liveSession.viewerCount = audienceSocketIds.size;
        io.emit(CLIENT_EVENTS.PEER_LEFT, {
          socketId: socket.id,
        });
      }

      emitLiveState(io);
    });
  });
}

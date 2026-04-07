import mongoose from "mongoose";
import Order from "../models/OrderProduct.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import { ORDER_STATUSES } from "../constants/orderStatus.js";

class OrderService {
  async applyOrderStatusUpdate(order, payload) {
    const nextStatus = payload.status;
    const note = payload.note?.trim() || "";

    order.status = nextStatus;
    order.currentTimelineNote = note;

    if (nextStatus === ORDER_STATUSES.SHIPPING) {
      order.trackingCode = payload.trackingCode?.trim() || order.trackingCode;
      order.carrierName = payload.carrierName?.trim() || order.carrierName;
    }

    if (nextStatus === ORDER_STATUSES.DELIVERED) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    if (nextStatus === ORDER_STATUSES.CANCELLED) {
      order.isDelivered = false;
    }

    order.statusHistory.push({
      status: nextStatus,
      timestamp: new Date(),
      note,
    });

    await order.save();
    return order;
  }

  async createOrder(payload) {
    try {
      const {
        orderItems,
        shippingAddress,
        paymentMethod = "COD",
        shippingPrice = 0,
        taxPrice = 0,
        user = null,
      } = payload;

      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return { status: "ERR", message: "Order items are required" };
      }

      if (
        !shippingAddress?.fullName ||
        !shippingAddress?.email ||
        !shippingAddress?.address ||
        !shippingAddress?.city ||
        !shippingAddress?.phone
      ) {
        return { status: "ERR", message: "Shipping information is required" };
      }

      const normalizedItems = [];
      let itemsPrice = 0;

      for (const item of orderItems) {
        if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
          return { status: "ERR", message: "Invalid product id in order items" };
        }

        const product = await Product.findById(item.product);
        if (!product) {
          return { status: "ERR", message: "Product not found" };
        }

        const amount = Number(item.amount) || 0;
        if (amount <= 0) {
          return { status: "ERR", message: "Invalid order item quantity" };
        }

        const availableStock = Number(product.countInStock ?? product.stock ?? 0);

        if (availableStock < amount) {
          return {
            status: "ERR",
            message: `Product ${product.name} does not have enough stock`,
          };
        }

        normalizedItems.push({
          name: product.name,
          amount,
          image: product.image,
          price: product.price,
          scale: item.scale || "1:64",
          product: product._id,
        });

        itemsPrice += product.price * amount;
      }

      const totalPrice = itemsPrice + Number(shippingPrice) + Number(taxPrice);
      const createdAt = new Date();

      const createdOrder = await Order.create({
        orderItems: normalizedItems,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          email: String(shippingAddress.email).trim().toLowerCase(),
          address: shippingAddress.address,
          city: shippingAddress.city,
          phone: shippingAddress.phone,
        },
        paymentMethod,
        itemsPrice,
        shippingPrice: Number(shippingPrice) || 0,
        taxPrice: Number(taxPrice) || 0,
        totalPrice,
        status: ORDER_STATUSES.PENDING,
        statusHistory: [
          {
            status: ORDER_STATUSES.PENDING,
            timestamp: createdAt,
            note: "Đơn hàng được tạo và đang chờ admin xác nhận.",
          },
        ],
        currentTimelineNote: "Đơn hàng được tạo và đang chờ admin xác nhận.",
        user:
          user && mongoose.Types.ObjectId.isValid(user)
            ? new mongoose.Types.ObjectId(user)
            : null,
      });

      for (const item of normalizedItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.amount },
        });
      }

      return {
        status: "OK",
        message: "CREATE ORDER SUCCESS",
        data: createdOrder,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async trackOrder(orderId, email) {
    try {
      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return { status: "ERR", message: "Invalid order id" };
      }

      if (!email || typeof email !== "string") {
        return { status: "ERR", message: "Email is required" };
      }

      const normalizedEmail = email.trim().toLowerCase();
      const order = await Order.findOne({
        _id: orderId,
        "shippingAddress.email": normalizedEmail,
      }).lean();

      if (!order) {
        return {
          status: "ERR",
          message: "Order not found for the provided email",
        };
      }

      return {
        status: "OK",
        message: "GET ORDER TRACKING SUCCESS",
        data: order,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async updateOrderStatus(orderId, payload) {
    try {
      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return { status: "ERR", message: "Invalid order id" };
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return { status: "ERR", message: "Order not found" };
      }

      await this.applyOrderStatusUpdate(order, payload);

      return {
        status: "OK",
        message: "UPDATE ORDER STATUS SUCCESS",
        data: order,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async updateManyOrderStatuses(orderIds, payload) {
    try {
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return { status: "ERR", message: "Order ids are required" };
      }

      const normalizedIds = [...new Set(orderIds)].filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );

      if (normalizedIds.length === 0) {
        return { status: "ERR", message: "No valid order ids provided" };
      }

      const orders = await Order.find({
        _id: { $in: normalizedIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });

      if (orders.length === 0) {
        return { status: "ERR", message: "Orders not found" };
      }

      const updatedOrders = [];

      for (const order of orders) {
        const updatedOrder = await this.applyOrderStatusUpdate(order, payload);
        updatedOrders.push(updatedOrder);
      }

      const updatedIdSet = new Set(
        updatedOrders.map((order) => order._id.toString()),
      );
      const failedOrderIds = normalizedIds.filter((id) => !updatedIdSet.has(id));

      return {
        status: "OK",
        message: "BULK UPDATE ORDER STATUS SUCCESS",
        data: {
          updatedOrders,
          failedOrderIds,
        },
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getAdminOrders(filters = {}) {
    try {
      const query = {};

      if (filters.status && filters.status !== "ALL") {
        query.status = filters.status;
      }

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .select(
          "_id shippingAddress status totalPrice createdAt updatedAt trackingCode carrierName",
        )
        .lean();

      return {
        status: "OK",
        message: "GET ORDERS SUCCESS",
        data: orders,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getAdminOrderDetail(orderId) {
    try {
      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return { status: "ERR", message: "Invalid order id" };
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return { status: "ERR", message: "Order not found" };
      }

      return {
        status: "OK",
        message: "GET ORDER DETAIL SUCCESS",
        data: order,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getOrderDetailForViewer(userPayload, orderId) {
    try {
      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return { status: "ERR", message: "Invalid order id" };
      }

      const userId =
        userPayload?.id ||
        userPayload?.payload?.id ||
        userPayload?._id ||
        userPayload?.payload?._id ||
        null;
      let userEmail = (
        userPayload?.email ||
        userPayload?.payload?.email ||
        ""
      )
        .toString()
        .trim()
        .toLowerCase();
      const userRole = (
        userPayload?.role ||
        userPayload?.payload?.role ||
        ""
      )
        .toString()
        .trim();

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return { status: "ERR", message: "Order not found", code: 404 };
      }

      if (!userEmail && userId && mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId).select("email").lean();
        userEmail = user?.email?.toString().trim().toLowerCase() || "";
      }

      if (userRole === "admin") {
        return {
          status: "OK",
          message: "GET ORDER DETAIL SUCCESS",
          data: order,
        };
      }

      const canAccessByUserId =
        userId &&
        mongoose.Types.ObjectId.isValid(userId) &&
        order.user &&
        order.user.toString() === userId.toString();
      const canAccessByEmail =
        !!userEmail &&
        order.shippingAddress?.email?.toString().trim().toLowerCase() === userEmail;

      if (!canAccessByUserId && !canAccessByEmail) {
        return {
          status: "ERR",
          message: "You do not have permission to view this order",
          code: 403,
        };
      }

      return {
        status: "OK",
        message: "GET ORDER DETAIL SUCCESS",
        data: order,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getMyOrders(userPayload) {
    try {
      const userId =
        userPayload?.id ||
        userPayload?.payload?.id ||
        userPayload?._id ||
        userPayload?.payload?._id ||
        null;
      let email = (
        userPayload?.email ||
        userPayload?.payload?.email ||
        ""
      )
        .toString()
        .trim()
        .toLowerCase();

      if (!email && userId && mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId).select("email").lean();
        email = user?.email?.toString().trim().toLowerCase() || "";
      }

      const query = [];

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        query.push({ user: new mongoose.Types.ObjectId(userId) });
      }

      if (email) {
        query.push({ "shippingAddress.email": email });
      }

      if (query.length === 0) {
        return { status: "ERR", message: "User information is required" };
      }

      const orders = await Order.find({ $or: query })
        .sort({ createdAt: -1 })
        .lean();

      return {
        status: "OK",
        message: "GET MY ORDERS SUCCESS",
        data: orders,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }
}

export default new OrderService();

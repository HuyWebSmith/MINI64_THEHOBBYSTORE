import Cart from "../models/CartModel.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";

class OrderService {
  async createCodOrder(userId, shippingAddress) {
    try {
      const cart = await Cart.findOne({ user: userId }).populate("items.product");

      if (!cart || cart.items.length === 0) {
        return {
          status: "ERR",
          message: "CART IS EMPTY",
        };
      }

      const normalizedItems = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = item.product;

        if (!product) {
          return {
            status: "ERR",
            message: "PRODUCT NOT FOUND IN CART",
          };
        }

        if (product.stock < item.quantity) {
          return {
            status: "ERR",
            message: `${product.name} chi con ${product.stock} san pham trong kho`,
          };
        }

        normalizedItems.push({
          product: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: item.quantity,
        });

        subtotal += product.price * item.quantity;
      }

      for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: -item.quantity },
        });
      }

      const shippingFee = 0;
      const order = await Order.create({
        user: userId,
        items: normalizedItems,
        shippingAddress,
        paymentMethod: "COD",
        subtotal,
        shippingFee,
        totalPrice: subtotal + shippingFee,
      });

      cart.items = [];
      await cart.save();

      const createdOrder = await Order.findById(order._id).populate(
        "items.product",
        "name image price stock",
      );

      return {
        status: "OK",
        message: "ORDER CREATED",
        data: createdOrder,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async getMyOrders(userId) {
    try {
      const orders = await Order.find({ user: userId })
        .populate("items.product", "name image price")
        .sort({ createdAt: -1 });

      return {
        status: "OK",
        message: "SUCCESS",
        data: orders,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async getAllOrders() {
    try {
      const orders = await Order.find()
        .populate("user", "name email phone role")
        .populate("items.product", "name image price stock")
        .sort({ createdAt: -1 });

      return {
        status: "OK",
        message: "SUCCESS",
        data: orders,
        total: orders.length,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async updateOrderStatus(orderId, orderStatus) {
    try {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "shipping",
        "completed",
        "cancelled",
      ];

      if (!allowedStatuses.includes(orderStatus)) {
        return {
          status: "ERR",
          message: "INVALID ORDER STATUS",
        };
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus },
        { returnDocument: "after" },
      )
        .populate("user", "name email phone role")
        .populate("items.product", "name image price stock");

      if (!order) {
        return {
          status: "ERR",
          message: "ORDER NOT FOUND",
        };
      }

      return {
        status: "OK",
        message: "ORDER STATUS UPDATED",
        data: order,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }
}

export default new OrderService();

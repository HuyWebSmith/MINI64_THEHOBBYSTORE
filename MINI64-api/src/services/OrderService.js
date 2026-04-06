import mongoose from "mongoose";
import Order from "../models/OrderProduct.js";
import Product from "../models/ProductModel.js";

class OrderService {
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

      const createdOrder = await Order.create({
        orderItems: normalizedItems,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          address: shippingAddress.address,
          city: shippingAddress.city,
          phone: shippingAddress.phone,
        },
        paymentMethod,
        itemsPrice,
        shippingPrice: Number(shippingPrice) || 0,
        taxPrice: Number(taxPrice) || 0,
        totalPrice,
        status: "Pending",
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
}

export default new OrderService();

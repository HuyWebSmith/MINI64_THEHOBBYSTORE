import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";

class CartService {
  async getMyCart(userId) {
    try {
      let cart = await Cart.findOne({ user: userId })
        .populate("items.product")
        .populate("items.liveSession", "title status");

      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [],
        });

        cart = await Cart.findById(cart._id)
          .populate("items.product")
          .populate("items.liveSession", "title status");
      }

      return {
        status: "OK",
        message: "SUCCESS",
        data: cart,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async addToCart(userId, data) {
    try {
      const { productId, quantity = 1, liveSessionId = null } = data;
      const product = await Product.findById(productId);

      if (!product) {
        return {
          status: "ERR",
          message: "PRODUCT NOT FOUND",
        };
      }

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [],
        });
      }

      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === productId &&
          (item.liveSession?.toString() || null) === liveSessionId,
      );

      if (existingItem) {
        existingItem.quantity += Number(quantity) || 1;
      } else {
        cart.items.push({
          product: product._id,
          name: product.name,
          image: product.image,
          priceAtAdd: product.price,
          quantity: Number(quantity) || 1,
          liveSession: liveSessionId,
        });
      }

      await cart.save();

      return this.getMyCart(userId);
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async updateCartItem(userId, itemId, quantity) {
    try {
      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return {
          status: "ERR",
          message: "CART NOT FOUND",
        };
      }

      const item = cart.items.id(itemId);

      if (!item) {
        return {
          status: "ERR",
          message: "CART ITEM NOT FOUND",
        };
      }

      if (Number(quantity) <= 0) {
        item.deleteOne();
      } else {
        item.quantity = Number(quantity);
      }

      await cart.save();

      return this.getMyCart(userId);
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async deleteCartItem(userId, itemId) {
    try {
      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return {
          status: "ERR",
          message: "CART NOT FOUND",
        };
      }

      const item = cart.items.id(itemId);

      if (!item) {
        return {
          status: "ERR",
          message: "CART ITEM NOT FOUND",
        };
      }

      item.deleteOne();
      await cart.save();

      return this.getMyCart(userId);
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }
}

export default new CartService();

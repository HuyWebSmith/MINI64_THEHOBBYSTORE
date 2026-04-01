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
      const normalizedQuantity = Math.max(1, Number(quantity) || 1);

      if (!product) {
        return {
          status: "ERR",
          message: "PRODUCT NOT FOUND",
        };
      }

      if (product.stock <= 0) {
        return {
          status: "ERR",
          message: "PRODUCT IS OUT OF STOCK",
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
        const nextQuantity = existingItem.quantity + normalizedQuantity;

        if (nextQuantity > product.stock) {
          return {
            status: "ERR",
            message: `${product.name} chi con ${product.stock} san pham trong kho`,
          };
        }

        existingItem.quantity = nextQuantity;
      } else {
        if (normalizedQuantity > product.stock) {
          return {
            status: "ERR",
            message: `${product.name} chi con ${product.stock} san pham trong kho`,
          };
        }

        cart.items.push({
          product: product._id,
          name: product.name,
          image: product.image,
          priceAtAdd: product.price,
          quantity: normalizedQuantity,
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

      const normalizedQuantity = Number(quantity);

      if (normalizedQuantity <= 0) {
        item.deleteOne();
      } else {
        const product = await Product.findById(item.product);

        if (!product) {
          return {
            status: "ERR",
            message: "PRODUCT NOT FOUND",
          };
        }

        if (normalizedQuantity > product.stock) {
          return {
            status: "ERR",
            message: `${product.name} chi con ${product.stock} san pham trong kho`,
          };
        }

        item.quantity = normalizedQuantity;
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

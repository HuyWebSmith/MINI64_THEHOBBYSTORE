import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";
import bcrypt from "bcrypt";
import JWTService from "../services/JWTService.js";

class UserService {
  async getAllUsers() {
    try {
      const users = await User.find()
        .select("-password -refresh_token")
        .sort({ createdAt: -1 });

      return {
        status: "OK",
        message: "SUCCESS",
        data: users,
        total: users.length,
      };
    } catch (e) {
      return {
        status: "ERR",
        message: e.message,
      };
    }
  }

  async createUser(newUser) {
    const { name, email, password, confirmPassword, phone } = newUser;
    try {
      if (password !== confirmPassword) {
        return {
          status: "ERR",
          message: "Password and Confirm Password are not the same",
        };
      }
      const checkUser = await User.findOne({
        email: email,
      });
      if (checkUser !== null) {
        return {
          status: "ERR",
          message: "Email already exists",
        };
      }

      const hash = await bcrypt.hash(password, 10);

      const createdUser = await User.create({
        name,
        email,
        password: hash,

        phone,
      });
      if (createdUser) {
        return {
          status: "OK",
          message: "SUCCESS",
          data: createdUser,
        };
      }
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async loginUser(user) {
    const { email, password } = user;
    try {
      const checkUser = await User.findOne({
        email: email,
      });
      if (checkUser === null) {
        return {
          status: "ERR",
          message: "Email does not exist",
        };
      }

      const comparePassword = bcrypt.compareSync(password, checkUser.password);
      if (!comparePassword) {
        return {
          status: "ERR",
          message: "Email or Password is invalid",
        };
      }
      //  const { password: pass, confirmPassword, ...userData } = checkUser._doc;
      const access_token = await JWTService.generalAccessToken({
        id: checkUser.id,
        isAdmin: checkUser.isAdmin,
      });
      const refresh_token = await JWTService.generalRefreshToken({
        id: checkUser.id,
        isAdmin: checkUser.isAdmin,
      });
      return {
        status: "OK",
        message: "SUCCESS",
        access_token,
        refresh_token,
      };
    } catch (e) {
      return {
        status: "ERR",
        message: e.message,
      };
    }
  }

  async updateUser(id, data) {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });

      if (!checkUser) {
        return {
          status: "ERR",
          message: "User not found",
        };
      }
      const updateUser = await User.findByIdAndUpdate(id, data, {
        returnDocument: "after",
      });

      return {
        status: "OK",
        message: "SUCCESS",
        data: updateUser,
      };
    } catch (e) {
      return {
        status: "ERR",
        message: e.message,
      };
    }
  }
  async deleteUser(id) {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });
      if (!checkUser) {
        return {
          status: "ERR",
          message: "User not found",
        };
      }

      await User.findByIdAndDelete(id);

      return {
        status: "OK",
        message: "DELETE USER SUCCESS",
      };
    } catch (error) {
      throw error;
    }
  }

  resolveUserId(userPayload) {
    return userPayload?.id || userPayload?.payload?.id || null;
  }

  async getProfile(userPayload) {
    try {
      const userId = this.resolveUserId(userPayload);
      if (!userId) {
        return { status: "ERR", message: "Unauthorized" };
      }

      const user = await User.findById(userId)
        .select("-password -refresh_token")
        .lean();

      if (!user) {
        return { status: "ERR", message: "User not found" };
      }

      return {
        status: "OK",
        message: "GET PROFILE SUCCESS",
        data: user,
      };
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async updateProfile(userPayload, data) {
    try {
      const userId = this.resolveUserId(userPayload);
      if (!userId) {
        return { status: "ERR", message: "Unauthorized" };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { status: "ERR", message: "User not found" };
      }

      if (typeof data.name === "string" && data.name.trim()) {
        user.name = data.name.trim();
      }

      if (typeof data.phone === "string") {
        user.phone = data.phone.trim();
      }

      if (typeof data.address === "string") {
        user.address = data.address.trim();
      }

      await user.save();

      const sanitizedUser = await User.findById(userId)
        .select("-password -refresh_token")
        .lean();

      return {
        status: "OK",
        message: "UPDATE PROFILE SUCCESS",
        data: sanitizedUser,
      };
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async getWishlist(userPayload) {
    try {
      const userId = this.resolveUserId(userPayload);
      if (!userId) {
        return { status: "ERR", message: "Unauthorized" };
      }

      const user = await User.findById(userId).populate("wishlist.product");
      if (!user) {
        return { status: "ERR", message: "User not found" };
      }

      return {
        status: "OK",
        message: "GET WISHLIST SUCCESS",
        data: user.wishlist,
      };
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async toggleWishlist(userPayload, productId) {
    try {
      const userId = this.resolveUserId(userPayload);
      if (!userId) {
        return { status: "ERR", message: "Unauthorized" };
      }

      if (!productId) {
        return { status: "ERR", message: "productId is required" };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { status: "ERR", message: "User not found" };
      }

      const product = await Product.findById(productId).select("_id");
      if (!product) {
        return { status: "ERR", message: "Product not found" };
      }

      const existingIndex = user.wishlist.findIndex(
        (item) => item.product?.toString() === productId,
      );

      if (existingIndex >= 0) {
        user.wishlist.splice(existingIndex, 1);
      } else {
        user.wishlist.push({
          product: productId,
          notifyOnSale: false,
        });
      }

      await user.save();
      await user.populate("wishlist.product");

      return {
        status: "OK",
        message: "TOGGLE WISHLIST SUCCESS",
        data: user.wishlist,
      };
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async updateWishlistNotify(userPayload, productId, notifyOnSale) {
    const userId = this.resolveUserId(userPayload);
    if (!userId) {
      return { status: "ERR", message: "Unauthorized" };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { status: "ERR", message: "User not found" };
    }

    const wishlistItem = user.wishlist.find(
      (item) => item.product?.toString() === productId,
    );

    if (!wishlistItem) {
      return { status: "ERR", message: "Wishlist item not found" };
    }

    wishlistItem.notifyOnSale = !!notifyOnSale;
    await user.save();
    await user.populate("wishlist.product");

    return {
      status: "OK",
      message: "SUCCESS",
      data: user.wishlist,
    };
  }
}
export default new UserService();

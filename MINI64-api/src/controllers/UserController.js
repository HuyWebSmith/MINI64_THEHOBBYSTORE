import UserService from "../services/UserService.js";
import { StatusCodes } from "http-status-codes";
class UserController {
  async getProfile(req, res) {
    try {
      const response = await UserService.getProfile(req.user);
      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (e) {
      console.error(e);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Lỗi server, thử lại sau",
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const response = await UserService.updateProfile(req.user, req.body);
      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (e) {
      console.error(e);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Lỗi server, thử lại sau",
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const response = await UserService.getAllUsers();
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      console.error(e);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Lỗi server, thử lại sau",
      });
    }
  }

  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const data = req.body;
      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "The useId is required",
        });
      }

      const response = await UserService.updateUser(userId, data);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        message: "Lỗi server, thử lại sau",
      });
    }
  }
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "The useId is required",
        });
      }
      const response = await UserService.deleteUser(userId);

      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: e,
      });
    }
  }

  async getWishlist(req, res) {
    try {
      const response = await UserService.getWishlist(req.user);
      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: e.message,
      });
    }
  }

  async toggleWishlist(req, res) {
    try {
      const response = await UserService.toggleWishlist(
        req.user,
        req.params.productId || req.body.productId,
      );
      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: e.message,
      });
    }
  }

  async updateWishlistNotify(req, res) {
    try {
      const response = await UserService.updateWishlistNotify(
        req.user,
        req.params.productId,
        req.body.notifyOnSale,
      );
      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: e.message,
      });
    }
  }
}

export default new UserController();

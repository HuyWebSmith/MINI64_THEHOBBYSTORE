import UserService from "../services/UserService.js";
import { StatusCodes } from "http-status-codes";
class UserController {
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
      const userId = req.user?.payload?.id;
      const response = await UserService.getWishlist(userId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: e.message,
      });
    }
  }

  async toggleWishlist(req, res) {
    try {
      const userId = req.user?.payload?.id;
      const { productId } = req.body;

      if (!productId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "PRODUCT ID IS REQUIRED",
        });
      }

      const response = await UserService.toggleWishlist(userId, productId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: e.message,
      });
    }
  }
}

export default new UserController();

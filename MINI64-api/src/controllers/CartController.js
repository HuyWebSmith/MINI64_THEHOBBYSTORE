import { StatusCodes } from "http-status-codes";
import CartService from "../services/CartService.js";

class CartController {
  async getMyCart(req, res) {
    try {
      const userId = req.user?.payload?.id;
      const response = await CartService.getMyCart(userId);
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async addToCart(req, res) {
    try {
      const userId = req.user?.payload?.id;
      const { productId } = req.body;

      if (!productId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "PRODUCT ID IS REQUIRED",
        });
      }

      const response = await CartService.addToCart(userId, req.body);
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async updateCartItem(req, res) {
    try {
      const userId = req.user?.payload?.id;
      const response = await CartService.updateCartItem(
        userId,
        req.params.itemId,
        req.body.quantity,
      );
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async deleteCartItem(req, res) {
    try {
      const userId = req.user?.payload?.id;
      const response = await CartService.deleteCartItem(userId, req.params.itemId);
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }
}

export default new CartController();

import { StatusCodes } from "http-status-codes";
import OrderService from "../services/OrderService.js";

class OrderController {
  async createCodOrder(req, res) {
    try {
      const userId = req.user?.payload?.id;
      const { fullName, phone, address, note = "" } = req.body;

      if (!fullName || !phone || !address) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "FULL NAME, PHONE AND ADDRESS ARE REQUIRED",
        });
      }

      const response = await OrderService.createCodOrder(userId, {
        fullName,
        phone,
        address,
        note,
      });

      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async getMyOrders(req, res) {
    try {
      const userId = req.user?.payload?.id;
      const response = await OrderService.getMyOrders(userId);
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async getAllOrders(req, res) {
    try {
      const response = await OrderService.getAllOrders();
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { orderStatus } = req.body;

      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "ORDER ID IS REQUIRED",
        });
      }

      if (!orderStatus) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "ORDER STATUS IS REQUIRED",
        });
      }

      const response = await OrderService.updateOrderStatus(id, orderStatus);
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }
}

export default new OrderController();

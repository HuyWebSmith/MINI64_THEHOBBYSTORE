import OrderService from "../services/OrderService.js";
import { emitOrderStatusUpdated } from "../sockets/orderStatusSocket.js";

class OrderController {
  async createOrder(req, res) {
    try {
      const response = await OrderService.createOrder(req.body);
      const statusCode = response.status === "OK" ? 200 : 400;
      return res.status(statusCode).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }

  async trackOrder(req, res) {
    try {
      const { orderId, email } = req.query;
      const response = await OrderService.trackOrder(orderId, email);
      const statusCode = response.status === "OK" ? 200 : 404;
      return res.status(statusCode).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const response = await OrderService.updateOrderStatus(
        req.params.id,
        req.body,
      );
      const statusCode = response.status === "OK" ? 200 : 400;
      if (response.status === "OK") {
        emitOrderStatusUpdated(response.data);
      }
      return res.status(statusCode).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }

  async updateManyOrderStatuses(req, res) {
    try {
      const response = await OrderService.updateManyOrderStatuses(
        req.body.orderIds,
        req.body,
      );
      const statusCode = response.status === "OK" ? 200 : 400;

      if (response.status === "OK") {
        for (const order of response.data?.updatedOrders ?? []) {
          emitOrderStatusUpdated(order);
        }
      }

      return res.status(statusCode).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }

  async getAdminOrders(req, res) {
    try {
      const response = await OrderService.getAdminOrders(req.query);
      const statusCode = response.status === "OK" ? 200 : 400;
      return res.status(statusCode).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }

  async getAdminOrderDetail(req, res) {
    try {
      const response = await OrderService.getOrderDetailForViewer(
        req.user,
        req.params.id,
      );
      const statusCode =
        response.status === "OK" ? 200 : response.code || 404;
      return res.status(statusCode).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }

  async getMyOrders(req, res) {
    try {
      const response = await OrderService.getMyOrders(req.user);
      const statusCode = response.status === "OK" ? 200 : 400;
      return res.status(statusCode).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: error.message });
    }
  }
}

export default new OrderController();

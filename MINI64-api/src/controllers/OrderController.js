import OrderService from "../services/OrderService.js";

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
}

export default new OrderController();

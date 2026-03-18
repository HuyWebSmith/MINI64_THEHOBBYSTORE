const User = require("../models/UserModel");
const UserService = require("../services/UserService");
class UserController {
  async createUser(req, res) {
    try {
      const { name, email, password, confirmPassword, phone } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isCheckEmail = emailRegex.test(email);
      if (!name || !email || !password || !confirmPassword || !phone) {
        return res.status(400).json({
          status: "ERR",
          message: "All fields are required",
        });
      }
      if (!isCheckEmail) {
        return res.status(400).json({
          status: "ERR",
          message: "Email is invalid",
        });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: "ERR",
          message: "Password and confirmPassword do not match",
        });
      }

      const response = await UserService.createUser(req.body);
      return res.status(200).json(response);
    } catch (e) {
      return res.status(404).json({
        message: e,
      });
    }
  }
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isCheckEmail = emailRegex.test(email);
      if (!email || !password) {
        return res.status(400).json({
          status: "ERR",
          message: "All fields are required",
        });
      }
      if (!isCheckEmail) {
        return res.status(400).json({
          status: "ERR",
          message: "Email is invalid",
        });
      }

      const response = await UserService.loginUser(req.body);

      return res.status(200).json(response);
    } catch (e) {
      return res.status(404).json({
        message: e,
      });
    }
  }
  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const data = req.body;
      if (!userId) {
        return res.status(404).json({
          status: "ERR",
          message: "The useId is required",
        });
      }

      const response = await UserService.updateUser(userId, data);
      return res.status(200).json(response);
    } catch (e) {
      return res.status(404).json({
        message: e,
      });
    }
  }
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(404).json({
          status: "OK",
          message: "The useId is required",
        });
      }

      const response = await UserService.deleteUser(userId);
      return res.status(200).json(response);
    } catch (e) {
      return res.status(404).json({
        message: e,
      });
    }
  }
}
module.exports = new UserController();

import AuthService from "../services/AuthService.js";
import { StatusCodes } from "http-status-codes";

class AuthController {
  async createUser(req, res) {
    try {
      const { name, email, password, confirmPassword, phone } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || !email || !password || !confirmPassword || !phone) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "All fields are required",
        });
      }
      if (!emailRegex.test(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "Email is invalid",
        });
      }
      if (password !== confirmPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "Password and confirmPassword do not match",
        });
      }

      const response = await AuthService.createUser(req.body);
      if (response.status === "ERR") {
        return res.status(StatusCodes.BAD_REQUEST).json(response);
      }

      return res.status(StatusCodes.CREATED).json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: e.message || "Internal Server Error",
      });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "Email and password are required",
        });
      }
      if (!emailRegex.test(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "Email is invalid",
        });
      }

      const response = await AuthService.loginUser(req.body);
      if (response.status === "ERR") {
        return res.status(StatusCodes.UNAUTHORIZED).json(response);
      }

      const { access_token, refresh_token, data } = response;

      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 giờ
      });

      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      return res.status(StatusCodes.OK).json({
        status: "OK",
        message: "Login successfully",
        data,
        access_token,
      });
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: e.message,
      });
    }
  }

  async logoutUser(req, res) {
    try {
      const refresh_token = req.cookies.refresh_token;

      if (refresh_token) {
        await AuthService.logoutUser(refresh_token);
      }

      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return res.status(StatusCodes.OK).json({
        status: "OK",
        message: "Logged out successfully",
      });
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: e.message,
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const token = req.cookies.refresh_token;

      if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "ERR",
          message: "No refresh token provided",
        });
      }

      const response = await AuthService.refreshToken(token);

      if (response.status === "ERR") {
        return res.status(StatusCodes.UNAUTHORIZED).json(response);
      }

      const { access_token } = response;

      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });

      return res.status(StatusCodes.OK).json({
        status: "OK",
        message: "Token refreshed successfully",
        access_token,
      });
    } catch (e) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "ERR",
        message: "Invalid or expired refresh token",
      });
    }
  }

  async lockUser(req, res) {
    try {
      const { id } = req.params;
      const { isBlocked } = req.body;

      if (!id) {
        return res.status(400).json({
          status: "ERR",
          message: "ID người dùng là bắt buộc",
        });
      }

      if (typeof isBlocked !== "boolean") {
        return res.status(400).json({
          status: "ERR",
          message: "Trạng thái isBlocked phải là true hoặc false",
        });
      }

      const response = await AuthService.lockUser(id, isBlocked);

      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: e.message || "Lỗi máy chủ nội bộ",
      });
    }
  }
}

export default new AuthController();

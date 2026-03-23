import UserService from "../services/UserService.js";
import { StatusCodes } from "http-status-codes";
class UserController {
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
}

export default new UserController();

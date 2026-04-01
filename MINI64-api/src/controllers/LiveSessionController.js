import { StatusCodes } from "http-status-codes";
import LiveSessionService from "../services/LiveSessionService.js";

class LiveSessionController {
  async createLiveSession(req, res) {
    try {
      const { title } = req.body;
      const hostUserId = req.user?.payload?.id;

      if (!title) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "TITLE IS REQUIRED",
        });
      }

      if (!hostUserId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "ERR",
          message: "HOST USER IS REQUIRED",
        });
      }

      const response = await LiveSessionService.createLiveSession(
        req.body,
        hostUserId,
      );

      if (response.status === "ERR") {
        return res.status(StatusCodes.BAD_REQUEST).json(response);
      }

      return res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async getAllLiveSessions(req, res) {
    try {
      const response = await LiveSessionService.getAllLiveSessions();
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async getCurrentLiveSession(req, res) {
    try {
      const response = await LiveSessionService.getCurrentLiveSession();
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async getPublicLiveFeed(req, res) {
    try {
      const response = await LiveSessionService.getPublicLiveFeed();
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async startLiveSession(req, res) {
    try {
      const response = await LiveSessionService.startLiveSession(req.params.id);

      if (response.status === "ERR") {
        return res.status(StatusCodes.BAD_REQUEST).json(response);
      }

      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async endLiveSession(req, res) {
    try {
      const response = await LiveSessionService.endLiveSession(req.params.id);

      if (response.status === "ERR") {
        return res.status(StatusCodes.BAD_REQUEST).json(response);
      }

      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async pinProduct(req, res) {
    try {
      const response = await LiveSessionService.pinProduct(
        req.params.id,
        req.body.productId,
      );

      if (response.status === "ERR") {
        return res.status(StatusCodes.BAD_REQUEST).json(response);
      }

      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async addProductToSession(req, res) {
    try {
      const response = await LiveSessionService.addProductToSession(
        req.params.id,
        req.body.productId,
      );

      if (response.status === "ERR") {
        return res.status(StatusCodes.BAD_REQUEST).json(response);
      }

      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }

  async removeProductFromSession(req, res) {
    try {
      const response = await LiveSessionService.removeProductFromSession(
        req.params.id,
        req.body.productId,
      );

      if (response.status === "ERR") {
        return res.status(StatusCodes.BAD_REQUEST).json(response);
      }

      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: error.message,
      });
    }
  }
}

export default new LiveSessionController();

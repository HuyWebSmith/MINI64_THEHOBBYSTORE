import { StatusCodes } from "http-status-codes";
import ChatService from "../services/ChatService.js";

class ChatController {
  async createSession(req, res) {
    try {
      const response = await ChatService.getOrCreateConversation({
        userPayload: req.user,
        guestName: req.body?.guestName,
        guestSessionId: req.body?.guestSessionId,
      });

      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (error) {
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: "Chat session creation failed.",
      });
    }
  }

  async getAdminConversations(req, res) {
    try {
      const response = await ChatService.getAdminConversations();
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: "Could not load chat conversations.",
      });
    }
  }

  async getConversationDetail(req, res) {
    try {
      const response = await ChatService.getConversationDetail({
        conversationId: req.params.conversationId,
        userPayload: req.user,
        guestSessionId: req.query.guestSessionId,
      });

      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (error) {
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: "Could not load conversation detail.",
      });
    }
  }

  async markSeen(req, res) {
    try {
      const role =
        ChatService.resolveUserRole(req.user) === "admin" ? "admin" : "customer";

      const response = await ChatService.markConversationSeen({
        conversationId: req.params.conversationId,
        viewerRole: role,
        userPayload: req.user,
        guestSessionId: req.body?.guestSessionId || req.query?.guestSessionId,
      });

      return res
        .status(response.status === "OK" ? StatusCodes.OK : StatusCodes.BAD_REQUEST)
        .json(response);
    } catch (error) {
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "ERR",
        message: "Could not update seen status.",
      });
    }
  }
}

export default new ChatController();

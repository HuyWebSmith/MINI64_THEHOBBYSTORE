import CategoryService from "../services/CategoryService.js";
import { StatusCodes } from "http-status-codes";

class CategoryController {
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "Category name is required",
        });
      }
      const response = await CategoryService.createCategory(req.body);
      return res.status(StatusCodes.CREATED).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async updateCategory(req, res) {
    try {
      const categoryId = req.params.id;
      if (!categoryId) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ status: "ERR", message: "ID is required" });
      }
      const response = await CategoryService.updateCategory(
        categoryId,
        req.body,
      );
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async deleteCategory(req, res) {
    try {
      const categoryId = req.params.id;
      const response = await CategoryService.deleteCategory(categoryId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async getDetailCategory(req, res) {
    try {
      const categoryId = req.params.id;
      const response = await CategoryService.getDetailCategory(categoryId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async getAllCategory(req, res) {
    try {
      const response = await CategoryService.getAllCategory();
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }
}

export default new CategoryController();

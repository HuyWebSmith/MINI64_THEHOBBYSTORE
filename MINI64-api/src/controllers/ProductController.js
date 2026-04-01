import ProductService from "../services/ProductService.js";
import { StatusCodes } from "http-status-codes";

class ProductController {
  async createProduct(req, res) {
    try {
      const {
        name,
        image,
        model3dUrl,
        price,
        stock,
        rating,
        description,
        category,
        brand,
      } = req.body;
      if (
        !name ||
        !image ||
        !price ||
        stock === undefined ||
        !rating ||
        !description ||
        !category ||
        !brand
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "ERR",
          message: "All fields are required",
        });
      }
      const response = await ProductService.createProduct(req.body);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const productId = req.params.id;
      if (!productId) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ status: "ERR", message: "ID is required" });
      }
      const response = await ProductService.updateProduct(productId, req.body);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const productId = req.params.id;
      const response = await ProductService.deleteProduct(productId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async getDetailProduct(req, res) {
    try {
      const productId = req.params.id;
      const response = await ProductService.getDetailProduct(productId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async getAllProduct(req, res) {
    try {
      const { limit, page, sort, filter } = req.query;
      const response = await ProductService.getAllProduct(
        Number(limit) || 12,
        Number(page) || 0,
        sort,
        filter,
      );
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async startGenerate3D(req, res) {
    try {
      const productId = req.params.id;
      const response = await ProductService.startGenerate3D(productId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async syncGenerate3D(req, res) {
    try {
      const productId = req.params.id;
      const response = await ProductService.syncGenerate3D(productId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async get3DStatus(req, res) {
    try {
      const productId = req.params.id;
      const response = await ProductService.get3DStatus(productId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }

  async uploadProductImageToCloudinary(req, res) {
    try {
      const productId = req.params.id;
      const response = await ProductService.uploadProductImageToCloudinary(productId);
      return res.status(StatusCodes.OK).json(response);
    } catch (e) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: e.message });
    }
  }
}

export default new ProductController();

import BrandService from "../services/BrandService.js";

class BrandController {
  async createBrand(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({
          status: "ERR",
          message: "The name is required",
        });
      }
      const response = await BrandService.createBrand(req.body);
      return res.status(200).json(response);
    } catch (e) {
      return res.status(500).json({ status: "ERR", message: e.message });
    }
  }

  async updateBrand(req, res) {
    try {
      const brandId = req.params.id;
      const data = req.body;
      if (!brandId) {
        return res.status(400).json({
          status: "ERR",
          message: "The brandId is required",
        });
      }
      const response = await BrandService.updateBrand(brandId, data);
      return res.status(200).json(response);
    } catch (e) {
      return res.status(500).json({ status: "ERR", message: e.message });
    }
  }

  async deleteBrand(req, res) {
    try {
      const brandId = req.params.id;
      if (!brandId) {
        return res.status(400).json({
          status: "ERR",
          message: "The brandId is required",
        });
      }
      const response = await BrandService.deleteBrand(brandId);
      return res.status(200).json(response);
    } catch (e) {
      return res.status(500).json({ status: "ERR", message: e.message });
    }
  }

  async getDetailBrand(req, res) {
    try {
      const brandId = req.params.id;
      if (!brandId) {
        return res.status(400).json({
          status: "ERR",
          message: "The brandId is required",
        });
      }
      const response = await BrandService.getDetailBrand(brandId);
      return res.status(200).json(response);
    } catch (e) {
      return res.status(500).json({ status: "ERR", message: e.message });
    }
  }

  async getAllBrand(req, res) {
    try {
      const { limit, page, sort, filter } = req.query;
      const response = await BrandService.getAllBrand(
        Number(limit) || 8,
        Number(page) || 0,
        sort,
        filter,
      );
      return res.status(200).json(response);
    } catch (e) {
      return res.status(500).json({ status: "ERR", message: e.message });
    }
  }
}

export default new BrandController();

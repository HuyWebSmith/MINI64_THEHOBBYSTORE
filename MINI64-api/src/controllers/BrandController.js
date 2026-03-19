const BrandService = require("../services/BrandService");

class BrandController {
  async createBrand(req, res) {
    try {
      const { name, logo, descriptions } = req.body;
      if (!name || !logo || !descriptions) {
        return res.status(400).json({
          status: "ERR",
          message: "name, logo, descriptions are required",
        });
      }

      const newBrand = await BrandService.createBrand(req.body);
      return res.status(201).json({
        status: "OK",
        message: "CREATE BRAND SUCCESS",
        data: newBrand,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Lỗi server, thử lại sau",
      });
    }
  }
}
module.exports = new BrandController();

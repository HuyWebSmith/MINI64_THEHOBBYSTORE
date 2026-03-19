const ProductService = require("../services/ProductService");

class ProductController {
  async createProduct(req, res) {
    try {
      const {
        name,
        image,
        price,
        description,
        stock,
        rating,
        descriptions,
        category,
        brand,
      } = req.body;
      if (
        !name ||
        !image ||
        !price ||
        !!description ||
        !stock ||
        !rating ||
        !descriptions ||
        !category ||
        !brand
      ) {
        return res.status(400).json({
          status: "ERR",
          message: "All fields are required",
        });
      }
      const product = await ProductService.createProduct(req.body);
      return res.status(201).json({
        status: "OK",
        message: "CREATE PRODUCT SUCCESS",
        data: product,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Lỗi server, thử lại sau",
      });
    }
  }
}
module.exports = new ProductController();

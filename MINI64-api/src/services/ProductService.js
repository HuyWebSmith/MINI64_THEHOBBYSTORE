const ProductModel = require("../models/ProductModel");
class ProductService {
  async createProduct(newProduct) {
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
    } = newProduct;
    const createProduct = await ProductModel.create({
      name,
      image,
      price,
      description,
      stock,
      rating,
      descriptions,
      category,
      brand,
    });
    if (createProduct) {
      return {
        status: "OK",
        message: "SUCCESS",
        data: createProduct,
      };
    }
    try {
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }
}
module.exports = ProductService();

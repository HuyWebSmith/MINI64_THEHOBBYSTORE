import Product from "../models/ProductModel.js";

class ProductService {
  async createProduct(newProduct) {
    try {
      const checkProduct = await Product.findOne({ name: newProduct.name });
      if (checkProduct) {
        return { status: "ERR", message: "Product name already exists" };
      }
      const createdProduct = await Product.create(newProduct);
      return {
        status: "OK",
        message: "SUCCESS",
        data: createdProduct,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async updateProduct(id, data) {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(id, data, {
        returnDocument: "after",
      });
      if (!updatedProduct) {
        return { status: "ERR", message: "Product not found" };
      }
      return {
        status: "OK",
        message: "SUCCESS",
        data: updatedProduct,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async deleteProduct(id) {
    try {
      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) {
        return { status: "ERR", message: "Product not found" };
      }
      return {
        status: "OK",
        message: "DELETE SUCCESS",
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getDetailProduct(id) {
    try {
      const product = await Product.findById(id)
        .populate("category")
        .populate("brand");
      if (!product) {
        return { status: "ERR", message: "Product not found" };
      }
      return {
        status: "OK",
        message: "SUCCESS",
        data: product,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getAllProduct(limit, page, sort, filter) {
    try {
      const totalProduct = await Product.countDocuments();
      let query = Product.find().populate("category").populate("brand");

      if (filter) {
        const label = filter[0];
        query = query.find({ [label]: { $regex: filter[1], $options: "i" } });
      }

      if (sort) {
        const objectSort = {};
        objectSort[sort[1]] = sort[0];
        query = query.sort(objectSort);
      }

      const allProduct = await query.limit(limit).skip(page * limit);

      return {
        status: "OK",
        message: "SUCCESS",
        data: allProduct,
        total: totalProduct,
        pageCurrent: Number(page + 1),
        totalPage: Math.ceil(totalProduct / limit),
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }
}

export default new ProductService();

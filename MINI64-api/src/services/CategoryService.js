import Category from "../models/CategoryModel.js";

class CategoryService {
  async createCategory(newCategory) {
    try {
      const { name, description, image } = newCategory;
      const checkCategory = await Category.findOne({ name });
      if (checkCategory) {
        return {
          status: "ERR",
          message: "CATEGORY NAME ALREADY EXISTS",
        };
      }
      const createdCategory = await Category.create({
        name,
        description,
        image,
      });
      return {
        status: "OK",
        message: "SUCCESS",
        data: createdCategory,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async updateCategory(id, data) {
    try {
      const updatedCategory = await Category.findByIdAndUpdate(id, data, {
        returnDocument: "after",
      });
      if (!updatedCategory) {
        return {
          status: "ERR",
          message: "CATEGORY NOT FOUND",
        };
      }
      return {
        status: "OK",
        message: "SUCCESS",
        data: updatedCategory,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async deleteCategory(id) {
    try {
      const deletedCategory = await Category.findByIdAndDelete(id);
      if (!deletedCategory) {
        return {
          status: "ERR",
          message: "CATEGORY NOT FOUND",
        };
      }
      return {
        status: "OK",
        message: "DELETE SUCCESS",
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getDetailCategory(id) {
    try {
      const category = await Category.findById(id);
      if (!category) {
        return {
          status: "ERR",
          message: "CATEGORY NOT FOUND",
        };
      }
      return {
        status: "OK",
        message: "SUCCESS",
        data: category,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getAllCategory() {
    try {
      const allCategory = await Category.find().sort({ createdAt: -1 });
      return {
        status: "OK",
        message: "SUCCESS",
        data: allCategory,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }
}

export default new CategoryService();

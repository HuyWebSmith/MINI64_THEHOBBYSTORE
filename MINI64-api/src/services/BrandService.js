import Brand from "../models/BrandModel.js";

class BrandService {
  async createBrand(newBrand) {
    try {
      const { name, logo, description } = newBrand;
      const checkNameBrand = await Brand.findOne({ name });
      if (checkNameBrand) {
        return {
          status: "ERR",
          message: "BRAND ALREADY EXISTS",
        };
      }
      const createdBrand = await Brand.create({ name, logo, description });
      return {
        status: "OK",
        message: "CREATE BRAND SUCCESS",
        data: createdBrand,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async updateBrand(id, data) {
    try {
      const updatedBrand = await Brand.findByIdAndUpdate(id, data, {
        returnDocument: "after",
        runValidators: true,
      });
      if (!updatedBrand) {
        return {
          status: "ERR",
          message: "BRAND NOT FOUND",
        };
      }
      return {
        status: "OK",
        message: "UPDATE SUCCESS",
        data: updatedBrand,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async deleteBrand(id) {
    try {
      const deletedBrand = await Brand.findByIdAndDelete(id);
      if (!deletedBrand) {
        return {
          status: "ERR",
          message: "BRAND NOT FOUND",
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

  async getDetailBrand(id) {
    try {
      const brand = await Brand.findById(id);
      if (!brand) {
        return {
          status: "ERR",
          message: "BRAND NOT FOUND",
        };
      }
      return {
        status: "OK",
        message: "SUCCESS",
        data: brand,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async getAllBrand(limit, page, sort, filter) {
    try {
      const totalBrand = await Brand.countDocuments();
      let query = Brand.find();

      if (filter) {
        const label = filter[0];
        query = query.find({ [label]: { $regex: filter[1], $options: "i" } });
      }

      if (sort) {
        const objectSort = {};
        objectSort[sort[1]] = sort[0];
        query = query.sort(objectSort);
      }

      if (limit) query = query.limit(limit);
      if (page) query = query.skip(page * limit);

      const allBrand = await query;

      return {
        status: "OK",
        message: "SUCCESS",
        data: allBrand,
        total: totalBrand,
        pageCurrent: Number(page + 1),
        totalPage: Math.ceil(totalBrand / limit),
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }
}

export default new BrandService();

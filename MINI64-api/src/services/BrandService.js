const Brand = require("../models/BrandModel");

class BrandService {
  async createBrand(newBrand) {
    try {
      const { name, logo, description } = newBrand;
      const checkNameBrand = Brand.findOne({
        name: name,
      });
      if (checkNameBrand !== null) {
        return {
          status: "ERR",
          message: "BRAND ALREADY EXITS",
        };
      }
      const createBrand = await Brand.create({ name, logo, description });
      return {
        status: "SUCCESS",
        message: "CREATE BRAND SUCCESS",
        data: createBrand,
      };
    } catch (error) {
      console.log(error);
      return {
        status: "ERR",
        message: "CREATE BRAND ERROR",
      };
    }
  }

  async updateBrand(id, data) {
    try {
      const updatedBrand = await Brand.findByIdAndUpdate(id, data, {
        new: true,
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
        data: updateBrand,
      };
    } catch (error) {
      console.log(error);

      return {
        message: "UPDATE ERROR",
      };
    }
  }
}
module.exports = BrandService();

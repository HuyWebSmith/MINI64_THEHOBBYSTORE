import Product from "../models/ProductModel.js";
import CloudinaryService from "./CloudinaryService.js";
import Tripo3DService from "./Tripo3DService.js";

const isPublicRemoteUrl = (value) => {
  try {
    const parsed = new URL(value);
    const isHttp = ["http:", "https:"].includes(parsed.protocol);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    return isHttp && !isLocalHost;
  } catch {
    return false;
  }
};

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
      if (data.model3dUrl) {
        data.model3dStatus = "ready";
        data.model3dError = "";
        data.model3dCompletedAt = new Date();
      } else if (Object.prototype.hasOwnProperty.call(data, "model3dUrl")) {
        data.model3dStatus = "idle";
        data.model3dJobId = "";
        data.model3dError = "";
        data.model3dRequestedAt = null;
        data.model3dCompletedAt = null;
      }

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

  async startGenerate3D(id) {
    try {
      const product = await Product.findById(id);

      if (!product) {
        return { status: "ERR", message: "Product not found" };
      }

      if (!product.image) {
        return { status: "ERR", message: "PRODUCT IMAGE IS REQUIRED" };
      }

      if (!isPublicRemoteUrl(product.image)) {
        const uploadResponse = await CloudinaryService.uploadImageFromUrl(product.image, {
          fileName: product.name,
        });

        if (uploadResponse.status !== "OK") {
          product.model3dStatus = "failed";
          product.model3dError = uploadResponse.message;
          await product.save();
          return uploadResponse;
        }

        product.image = uploadResponse.data.secureUrl;
        await product.save();
      }

      if (product.model3dStatus === "processing") {
        return { status: "ERR", message: "3D GENERATION IS ALREADY PROCESSING" };
      }

      const response = await Tripo3DService.createImageToModelTask(product);

      if (response.status !== "OK") {
        product.model3dStatus = "failed";
        product.model3dError = response.message;
        await product.save();
        return response;
      }

      product.model3dStatus = "processing";
      product.model3dJobId = response.data.taskId;
      product.model3dProvider = "tripo3d";
      product.model3dError = "";
      product.model3dRequestedAt = new Date();
      product.model3dCompletedAt = null;
      await product.save();

      return {
        status: "OK",
        message: "3D GENERATION STARTED",
        data: product,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async syncGenerate3D(id) {
    try {
      const product = await Product.findById(id);

      if (!product) {
        return { status: "ERR", message: "Product not found" };
      }

      if (!product.model3dJobId) {
        return { status: "ERR", message: "3D JOB ID NOT FOUND" };
      }

      const response = await Tripo3DService.getTaskStatus(product.model3dJobId);

      if (response.status !== "OK") {
        product.model3dStatus = "failed";
        product.model3dError = response.message;
        await product.save();
        return response;
      }

      const { localStatus, modelUrl, providerStatus } = response.data;

      product.model3dStatus = localStatus;
      product.model3dError =
        localStatus === "failed"
          ? `TRIPO TASK FAILED: ${providerStatus || "unknown"}`
          : "";

      if (localStatus === "ready" && modelUrl) {
        product.model3dUrl = modelUrl;
        product.model3dCompletedAt = new Date();
      }

      await product.save();

      return {
        status: "OK",
        message:
          localStatus === "ready"
            ? "3D MODEL IS READY"
            : "3D GENERATION IS STILL PROCESSING",
        data: product,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }

  async get3DStatus(id) {
    try {
      const product = await Product.findById(id).select(
        "name model3dUrl model3dStatus model3dProvider model3dJobId model3dError model3dRequestedAt model3dCompletedAt",
      );

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

  async uploadProductImageToCloudinary(id) {
    try {
      const product = await Product.findById(id);

      if (!product) {
        return { status: "ERR", message: "Product not found" };
      }

      if (!product.image) {
        return { status: "ERR", message: "PRODUCT IMAGE IS REQUIRED" };
      }

      const response = await CloudinaryService.uploadImageFromUrl(product.image, {
        fileName: product.name,
      });

      if (response.status !== "OK") {
        return response;
      }

      product.image = response.data.secureUrl;
      await product.save();

      return {
        status: "OK",
        message: "UPLOAD IMAGE TO CLOUDINARY SUCCESS",
        data: product,
      };
    } catch (error) {
      return { status: "ERR", message: error.message };
    }
  }
}

export default new ProductService();

import LiveSession from "../models/LiveSessionModel.js";
import Product from "../models/ProductModel.js";

class LiveSessionService {
  async createLiveSession(data, hostUserId) {
    try {
      const {
        title,
        description = "",
        products = [],
        streamProvider = "100ms",
        hostRoomLink = "",
        viewerRoomLink = "",
      } = data;

      const createdLiveSession = await LiveSession.create({
        title,
        description,
        products,
        streamProvider,
        hostRoomLink,
        viewerRoomLink,
        hostUser: hostUserId,
      });

      const liveSession = await this.getLiveSessionById(createdLiveSession._id);

      return {
        status: "OK",
        message: "CREATE LIVE SESSION SUCCESS",
        data: liveSession.data,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async getLiveSessionById(id) {
    try {
      const liveSession = await LiveSession.findById(id)
        .populate("products")
        .populate("featuredProduct")
        .populate("hostUser", "name email");

      if (!liveSession) {
        return {
          status: "ERR",
          message: "LIVE SESSION NOT FOUND",
        };
      }

      return {
        status: "OK",
        message: "SUCCESS",
        data: liveSession,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async getAllLiveSessions() {
    try {
      const liveSessions = await LiveSession.find()
        .populate("products")
        .populate("featuredProduct")
        .populate("hostUser", "name email")
        .sort({ createdAt: -1 });

      return {
        status: "OK",
        message: "SUCCESS",
        data: liveSessions,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async getCurrentLiveSession() {
    try {
      const liveSession = await LiveSession.findOne({ status: "live" })
        .populate("products")
        .populate("featuredProduct")
        .populate("hostUser", "name email")
        .sort({ startedAt: -1, createdAt: -1 });

      return {
        status: "OK",
        message: "SUCCESS",
        data: liveSession,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async getPublicLiveFeed() {
    try {
      const [currentLive, recentEvents] = await Promise.all([
        LiveSession.findOne({ status: "live" })
          .populate("products")
          .populate("featuredProduct")
          .populate("hostUser", "name email")
          .sort({ startedAt: -1, createdAt: -1 }),
        LiveSession.find({ status: "ended" })
          .populate("products")
          .populate("featuredProduct")
          .populate("hostUser", "name email")
          .sort({ endedAt: -1, startedAt: -1, createdAt: -1 })
          .limit(8),
      ]);

      return {
        status: "OK",
        message: "SUCCESS",
        data: {
          currentLive,
          recentEvents,
        },
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async startLiveSession(id) {
    try {
      await LiveSession.updateMany(
        { status: "live", _id: { $ne: id } },
        { status: "ended", endedAt: new Date() },
      );

      const updatedLiveSession = await LiveSession.findByIdAndUpdate(
        id,
        {
          status: "live",
          startedAt: new Date(),
          endedAt: null,
        },
        { new: true },
      )
        .populate("products")
        .populate("featuredProduct")
        .populate("hostUser", "name email");

      if (!updatedLiveSession) {
        return {
          status: "ERR",
          message: "LIVE SESSION NOT FOUND",
        };
      }

      return {
        status: "OK",
        message: "LIVE SESSION STARTED",
        data: updatedLiveSession,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async endLiveSession(id) {
    try {
      const updatedLiveSession = await LiveSession.findByIdAndUpdate(
        id,
        {
          status: "ended",
          endedAt: new Date(),
        },
        { new: true },
      )
        .populate("products")
        .populate("featuredProduct")
        .populate("hostUser", "name email");

      if (!updatedLiveSession) {
        return {
          status: "ERR",
          message: "LIVE SESSION NOT FOUND",
        };
      }

      return {
        status: "OK",
        message: "LIVE SESSION ENDED",
        data: updatedLiveSession,
      };
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async pinProduct(id, productId) {
    try {
      const liveSession = await LiveSession.findById(id);

      if (!liveSession) {
        return {
          status: "ERR",
          message: "LIVE SESSION NOT FOUND",
        };
      }

      if (productId) {
        const productExists = await Product.findById(productId);

        if (!productExists) {
          return {
            status: "ERR",
            message: "PRODUCT NOT FOUND",
          };
        }

        const hasProduct = liveSession.products.some(
          (product) => product.toString() === productId,
        );

        if (!hasProduct) {
          liveSession.products.push(productId);
        }
      }

      liveSession.featuredProduct = productId || null;
      await liveSession.save();

      return this.getLiveSessionById(id);
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async addProductToSession(id, productId) {
    try {
      if (!productId) {
        return {
          status: "ERR",
          message: "PRODUCT ID IS REQUIRED",
        };
      }

      const [liveSession, productExists] = await Promise.all([
        LiveSession.findById(id),
        Product.findById(productId),
      ]);

      if (!liveSession) {
        return {
          status: "ERR",
          message: "LIVE SESSION NOT FOUND",
        };
      }

      if (!productExists) {
        return {
          status: "ERR",
          message: "PRODUCT NOT FOUND",
        };
      }

      const hasProduct = liveSession.products.some(
        (product) => product.toString() === productId,
      );

      if (!hasProduct) {
        liveSession.products.push(productId);
        await liveSession.save();
      }

      return this.getLiveSessionById(id);
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }

  async removeProductFromSession(id, productId) {
    try {
      if (!productId) {
        return {
          status: "ERR",
          message: "PRODUCT ID IS REQUIRED",
        };
      }

      const liveSession = await LiveSession.findById(id);

      if (!liveSession) {
        return {
          status: "ERR",
          message: "LIVE SESSION NOT FOUND",
        };
      }

      liveSession.products = liveSession.products.filter(
        (product) => product.toString() !== productId,
      );

      if (liveSession.featuredProduct?.toString() === productId) {
        liveSession.featuredProduct = null;
      }

      await liveSession.save();

      return this.getLiveSessionById(id);
    } catch (error) {
      return {
        status: "ERR",
        message: error.message,
      };
    }
  }
}

export default new LiveSessionService();

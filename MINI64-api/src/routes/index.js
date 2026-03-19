const UserRouter = require("../routes/UserRouter");
const ProductRouter = require("../routes/ProductRouter");
const BrandRouter = require("../routes/BrandRouter");
const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/brand", BrandRouter);
};

module.exports = routes;

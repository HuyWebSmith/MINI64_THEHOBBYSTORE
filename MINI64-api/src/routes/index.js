import UserRouter from "../routes/UserRouter.js";
import AuthRouter from "../routes/authRouter.js";
import ProductRouter from "../routes/ProductRouter.js";
import BrandRouter from "../routes/BrandRouter.js";
import CategoryRouter from "../routes/categoryRouter.js";
import UpdateRouter from "../routes/UploadRoutes.js";
const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/auth", AuthRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/brand", BrandRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/upload", UpdateRouter);
};

export default routes;

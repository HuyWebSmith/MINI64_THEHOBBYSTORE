import UserRouter from "../routes/UserRouter.js";
import AuthRouter from "../routes/authRouter.js";
import ProductRouter from "../routes/ProductRouter.js";
import BrandRouter from "../routes/BrandRouter.js";
import CategoryRouter from "../routes/categoryRouter.js";
import UpdateRouter from "../routes/UploadRoutes.js";
import OrderRouter from "../routes/OrderRouter.js";
import ReviewRouter from "../routes/ReviewRouter.js";

const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/users", UserRouter);
  app.use("/api/auth", AuthRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/brand", BrandRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/upload", UpdateRouter);
  app.use("/api/order", OrderRouter);
  app.use("/api/orders", OrderRouter);
  app.use("/api/reviews", ReviewRouter);
};

export default routes;

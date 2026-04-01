import UserRouter from "../routes/UserRouter.js";
import AuthRouter from "../routes/authRouter.js";
import ProductRouter from "../routes/ProductRouter.js";
import BrandRouter from "../routes/BrandRouter.js";
import CategoryRouter from "../routes/categoryRouter.js";
import LiveSessionRouter from "../routes/LiveSessionRouter.js";
import CartRouter from "../routes/CartRouter.js";
import OrderRouter from "../routes/OrderRouter.js";
const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/auth", AuthRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/brand", BrandRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/live-session", LiveSessionRouter);
  app.use("/api/cart", CartRouter);
  app.use("/api/order", OrderRouter);
};

export default routes;

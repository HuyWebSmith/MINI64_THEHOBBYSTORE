import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { Server } from "socket.io";
import routes from "./src/routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { initLiveCommerceSocket } from "./src/sockets/liveCommerceSocket.js";
import { initOrderStatusSocket } from "./src/sockets/orderStatusSocket.js";
import { initAdminOrdersSocket } from "./src/sockets/adminOrdersSocket.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.APP_PORT || 3001;
const hostname = process.env.APP_HOST;
const allowedOrigin =
  process.env.CLIENT_URL ||
  "http://localhost:5173" ||
  "http://10.10.17.242:5173";

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
routes(app);
initLiveCommerceSocket(io);
initOrderStatusSocket(io);
initAdminOrdersSocket(io);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connect DB success!"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

httpServer.listen(port, hostname, () => {
  console.log(`App running at http://${hostname}:${port}`);
});

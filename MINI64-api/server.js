import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./src/routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const app = express();
const port = process.env.APP_PORT || 3001;
const hostname = process.env.APP_HOST;
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
routes(app);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connect DB success!"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, hostname, () => {
  console.log(`App running at http://${hostname}:${port}`);
});

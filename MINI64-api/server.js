const express = require("express");
const dotenv = require("dotenv");
const { default: mongoose } = require("mongoose");
const routes = require("./src/routes");
dotenv.config();
const port = process.env.APP_PORT || 3001;
const hostname = process.env.APP_HOST;
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
routes(app);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connect DB success!");
  })
  .catch((err) => {
    console.log(err);
  });
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, hostname, () => {
  console.log(`App listening on port http://${hostname}:${port}`);
});

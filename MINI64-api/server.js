const express = require("express");
const app = express();

const port = APP_PORT;
const hostname = APP_HOST;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, hostname, () => {
  console.log(`App listening on port http://${hostname}:${port}`);
});

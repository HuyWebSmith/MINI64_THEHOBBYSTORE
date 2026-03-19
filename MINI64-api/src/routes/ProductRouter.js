const express = require("express");
const productController = require("../controllers/ProductController");
const router = express.Router();

router.post("/create-product", productController.createProduct);
module.exports = router;

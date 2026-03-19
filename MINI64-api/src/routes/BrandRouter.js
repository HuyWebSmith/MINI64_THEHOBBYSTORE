const express = require("express");
const router = express.Router();
const BrandController = require("../controllers/BrandController");

router.post("/create-brand", BrandController.createBrand);
router.put("/update-brand/:id");
module.exports = router;

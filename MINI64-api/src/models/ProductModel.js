const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
    image: {
      type: String,
      require: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: String,

    stock: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      require: true,
    },
    descriptions: {
      type: String,
      require: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
  },
  {
    timestamps: true,
  },
);
const Product = mongoose.model("Product", productSchema);

module.exports = Product;

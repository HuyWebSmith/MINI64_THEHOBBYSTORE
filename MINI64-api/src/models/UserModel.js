const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    confirmPassword: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      require: true,
    },
    phone: {
      type: String,
      require: true,
    },
    access_token: {
      type: String,
      require: true,
    },
    refresh_token: {
      type: String,
      require: true,
    },
  },
  { timestamp: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;

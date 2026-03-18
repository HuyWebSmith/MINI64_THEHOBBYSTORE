const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const JWTService = require("../services/JWTService");

class UserService {
  async createUser(newUser) {
    const { name, email, password, confirmPassword, phone } = newUser;
    try {
      if (password !== confirmPassword) {
        return {
          status: "ERR",
          message: "Password and Confirm Password are not the same",
        };
      }
      const checkUser = await User.findOne({
        email: email,
      });
      if (checkUser !== null) {
        return {
          status: "ERR",
          message: "Email already exists",
        };
      }

      const hash = bcrypt.hash(password, 10);

      const createdUser = await User.create({
        name,
        email,
        password: hash,

        phone,
      });
      if (createdUser) {
        return {
          status: "OK",
          message: "SUCCESS",
          data: createdUser,
        };
      }
    } catch (e) {
      reject(e);
    }
  }

  async loginUser(user) {
    const { email, password } = user;
    try {
      const checkUser = await User.findOne({
        email: email,
      });
      if (checkUser === null) {
        return {
          status: "ERR",
          message: "Email does not exist",
        };
      }

      const comparePassword = bcrypt.compareSync(password, checkUser.password);
      if (!comparePassword) {
        return {
          status: "ERR",
          message: "Email or Password is invalid",
        };
      }
      //  const { password: pass, confirmPassword, ...userData } = checkUser._doc;
      const access_token = await JWTService.generalAccessToken({
        id: checkUser.id,
        isAdmin: checkUser.isAdmin,
      });
      const refresh_token = await JWTService.generalRefreshToken({
        id: checkUser.id,
        isAdmin: checkUser.isAdmin,
      });
      return {
        status: "OK",
        message: "SUCCESS",
        access_token,
        refresh_token,
      };
    } catch (e) {
      return {
        status: "ERR",
        message: e.message,
      };
    }
  }

  async updateUser(id, data) {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });

      if (!checkUser) {
        return {
          status: "ERR",
          message: "User not found",
        };
      }
      const updateUser = await User.findByIdAndUpdate(id, data, { new: true });
      console.log("updateUser", updateUser);

      return {
        status: "OK",
        message: "SUCCESS",
        data: updateUser,
      };
    } catch (e) {
      reject(e);
    }
  }
  async;
}
module.exports = new UserService();

import User from "../models/UserModel.js";
import bcrypt from "bcrypt";
import JWTService from "../services/JWTService.js";

class AuthService {
  async createUser(newUser) {
    const { name, email, password, confirmPassword, phone } = newUser;
    try {
      if (password !== confirmPassword) {
        return {
          status: "ERR",
          message: "Password and Confirm Password are not the same",
        };
      }
      const checkUser = await User.findOne({ email });
      if (checkUser !== null) {
        return {
          status: "ERR",
          message: "Email already exists",
        };
      }

      const hash = await bcrypt.hash(password, 10);

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
      return { status: "ERR", message: e.message };
    }
  }

  async loginUser(user) {
    const { email, password } = user;
    try {
      const checkUser = await User.findOne({ email });
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

      const access_token = await JWTService.generalAccessToken({
        id: checkUser.id,
        role: checkUser.role,
      });

      const refresh_token = await JWTService.generalRefreshToken({
        id: checkUser.id,
        role: checkUser.role,
      });

      // Lưu refresh_token vào database
      await User.findByIdAndUpdate(
        checkUser.id,
        { refresh_token },
        { new: true },
      );

      const { password: pass, refresh_token: rt, ...userData } = checkUser._doc;

      return {
        status: "OK",
        message: "SUCCESS",
        data: userData,
        access_token,
        refresh_token,
      };
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async logoutUser(token) {
    try {
      // Tìm user đang giữ token này và xóa nó đi
      await User.findOneAndUpdate(
        { refresh_token: token },
        { refresh_token: "" },
      );
      return {
        status: "OK",
        message: "Logout success",
      };
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async refreshToken(token) {
    try {
      // Kiểm tra xem token này có còn tồn tại trong DB không
      const user = await User.findOne({ refresh_token: token });
      if (!user) {
        return {
          status: "ERR",
          message: "Token is not in database",
        };
      }

      const access_token = await JWTService.generalAccessToken({
        id: user.id,
        role: user.role,
      });

      return {
        status: "OK",
        message: "SUCCESS",
        access_token,
      };
    } catch (e) {
      return { status: "ERR", message: e.message };
    }
  }

  async lockUser(id, isLock) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { isBlocked: isLock },
        { new: true },
      );

      if (!updatedUser) {
        return {
          status: "ERR",
          message: "Người dùng không tồn tại",
        };
      }
      if (updatedUser.role === "admin") {
        return res.status(400).json({
          status: "ERR",
          message: "Không thể khóa tài khoản có quyền Quản trị viên (Admin)!",
        });
      }
      return {
        status: "OK",
        message: isLock
          ? "Đã khóa tài khoản thành công"
          : "Đã mở khóa tài khoản thành công",
        data: updatedUser,
      };
    } catch (error) {
      console.error("Lỗi lockUser:", error);
      return {
        status: "ERR",
        message: "Có lỗi xảy ra khi khóa người dùng",
      };
    }
  }
}

export default new AuthService();

import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

export const authMiddleware = (req, res, next) => {
  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies.access_token;

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
    });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }
    console.log("User decoded:", user);
    req.user = user;
    next();
  });
};

export const adminAuthMiddleware = (req, res, next) => {
  const userRole = (req.user?.role || req.user?.payload?.role)
    ?.toString()
    .trim();
  if (userRole !== "admin") {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "Admin only",
    });
  }
  next();
};

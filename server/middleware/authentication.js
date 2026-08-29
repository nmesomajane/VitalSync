
import { verifyToken } from '../utilis/jwt.js';
import UserRepository from '../repository/userRepository.js';
import AppError from '../utilis/appError.js';
import asyncHandler from '../utilis/asyncHandler.js';
import jwt from "jsonwebtoken";




export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("========== JWT DEBUG ==========");
    console.log("Authorization header exists:", !!authHeader);
    console.log("Bearer token exists:", !!token);
    console.log("Token length:", token?.length);
    console.log("Token parts:", token?.split(".").length);
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);
    console.log("================================");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("✅ JWT VERIFIED SUCCESSFULLY");
    console.log("Decoded user ID:", decoded.id);

    if (decoded.type === "hardware_device") {
      req.device = {
        deviceId: decoded.deviceId,
        isDevice: true,
      };

      console.log(
        "Hardware device authenticated:",
        decoded.deviceId
      );

      return next();
    }

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;

    console.log("✅ User authenticated:", user.id);

    next();

  } catch (err) {
    console.error("========== JWT AUTH ERROR ==========");
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.error(
      "JWT_SECRET length:",
      process.env.JWT_SECRET?.length
    );
    console.error("====================================");

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
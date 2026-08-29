
import { verifyToken } from '../utilis/jwt.js';
import UserRepository from '../repository/userRepository.js';
import AppError from '../utilis/appError.js';
import asyncHandler from '../utilis/asyncHandler.js';


export const authenticate = async (req, res, next) => {
  console.log("\n========== AUTH MIDDLEWARE START ==========");

  try {
    // 1. Check whether Authorization header exists
    const authHeader = req.headers.authorization;

    console.log("1️⃣ Authorization header:", authHeader ? "EXISTS" : "MISSING");

    if (!authHeader) {
      console.log("❌ STOP: Authorization header is missing");
      console.log("==========================================\n");

      return res.status(401).json({
        message: "No token provided",
      });
    }

   
    console.log(
      "2️⃣ Bearer format:",
      authHeader.startsWith("Bearer ") ? "VALID" : "INVALID"
    );

    if (!authHeader.startsWith("Bearer ")) {
      console.log("❌ STOP: Authorization header is not Bearer format");
      console.log("Header received:", authHeader.substring(0, 30) + "...");
      console.log("==========================================\n");

      return res.status(401).json({
        message: "No token provided",
      });
    }

   
    const token = authHeader.split(" ")[1];

    console.log("3️⃣ Token extracted:", !!token);
    console.log("Token length:", token?.length);
    console.log(
      "Token parts:",
      token ? token.split(".").length : "NO TOKEN"
    );

    if (!token) {
      console.log("❌ STOP: Token could not be extracted");
      console.log("==========================================\n");

      return res.status(401).json({
        message: "No token provided",
      });
    }

   
    console.log(
      "4️⃣ JWT_SECRET exists:",
      !!process.env.JWT_SECRET
    );

    console.log(
      "JWT_SECRET length:",
      process.env.JWT_SECRET?.length
    );

    if (!process.env.JWT_SECRET) {
      console.error("❌ STOP: JWT_SECRET is missing!");
      console.log("==========================================\n");

      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    // 5. Verify token
    console.log("5️⃣ Attempting jwt.verify()...");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("✅ 6️⃣ JWT VERIFIED SUCCESSFULLY");
    console.log("Decoded token:", decoded);
    console.log("Decoded user ID:", decoded.id);

    if (decoded.type === "hardware_device") {
      console.log("7️⃣ Hardware device token detected");
      console.log("Device ID:", decoded.deviceId);

      req.device = {
        deviceId: decoded.deviceId,
        isDevice: true,
      };

      console.log("✅ Hardware authentication successful");
      console.log("========== AUTH MIDDLEWARE END ==========\n");

      return next();
    }

    
    console.log("7️⃣ Normal user token detected");

    console.log(
      "Looking up user with ID:",
      decoded.id
    );

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      console.log("❌ User not found for token ID:", decoded.id);
      console.log("==========================================\n");

      return res.status(401).json({
        message: "User not found",
      });
    }

   
    req.user = user;

    console.log("✅ 8️⃣ User authenticated:", user.email);
    console.log("========== AUTH MIDDLEWARE END ==========\n");

    next();

  } catch (err) {

    
    console.error("\n========== ❌ JWT AUTH ERROR ==========");

    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);

    console.error(
      "JWT_SECRET exists:",
      !!process.env.JWT_SECRET
    );

    console.error(
      "JWT_SECRET length:",
      process.env.JWT_SECRET?.length
    );

    console.error("========================================\n");

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
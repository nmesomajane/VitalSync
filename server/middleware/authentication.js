
import { verifyToken } from '../utilis/jwt.js';
import UserRepository from '../repository/userRepository.js';
import AppError from '../utilis/appError.js';
import asyncHandler from '../utilis/asyncHandler.js';


export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    if (decoded.type === "hardware_device") {
    
      req.device = { deviceId: decoded.deviceId, isDevice: true };
      console.log("Hardware device authenticated:", decoded.deviceId);
      return next();
  
    }

    // normal user token flow
    const user = await userRepository.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
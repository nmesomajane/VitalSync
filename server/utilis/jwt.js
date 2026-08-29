
import jwt from 'jsonwebtoken';

import {sequelize,connectDB} from '../database/connection.js';
import dotenv from "dotenv";
dotenv.config();

// Generate JWT token for a user
export const generateToken = (userId) => {
  console.log("\n========== JWT GENERATION ==========");
  console.log("User ID:", userId);
  console.log(
    "JWT_SECRET exists:",
    !!process.env.JWT_SECRET
  );
  console.log(
    "JWT_SECRET length:",
    process.env.JWT_SECRET?.length
  );
  console.log(
    "JWT_EXPIRES_IN:",
    process.env.JWT_EXPIRES_IN || "7d"
  );

  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  console.log("✅ JWT generated");
  console.log("Token length:", token.length);
  console.log("Token parts:", token.split(".").length);
  console.log("====================================\n");

  return token;
};


export const verifyToken = (token) => {
  try {
   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
   
    return decoded;
    
  } catch (error) {

    return null;
  }
};
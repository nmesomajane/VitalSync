
import jwt from 'jsonwebtoken';

import {sequelize,connectDB} from '../database/connection.js';
import dotenv from "dotenv";
dotenv.config();

// Generate JWT token for a user
export const generateToken = (userId) => {
  
  return jwt.sign(
    { id: userId },
   

    process.env.JWT_SECRET,


    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }

  );
};


export const verifyToken = (token) => {
  try {
   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
   
    return decoded;
    
  } catch (error) {

    return null;
  }
};
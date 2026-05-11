
import { verifyToken } from '../utilis/jwt.js';
import UserRepository from '../repository/userRepository.js';
import AppError from '../utilis/appError.js';
import asyncHandler from '../utilis/asyncHandler.js';

// Middleware to check if user is authenticated
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new AppError('You are not logged in. Please log in to access this resource', 401);
  }

  
  const decoded = verifyToken(token);
  console.log("Decoded token:", decoded); 
  if (!decoded) {
    throw new AppError('Invalid or expired token. Please log in again', 401);
  }

  
  const user = await UserRepository.findById(decoded.id);
  console.log("Looking for user with id:", decoded.id);
  console.log("User found:", user);  
  
  if (!user) {
    throw new AppError('The user belonging to this token no longer exists', 401);
  }

  
  req.user = user;
  next();
});
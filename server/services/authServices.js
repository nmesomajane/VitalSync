import UserRepository from "../repository/userRepository.js";
import bcrypt from "bcryptjs";

import { generateToken } from "../utilis/jwt.js";
import AppError from "../utilis/appError.js";

// Service handles business logic for authentication
class AuthService {
  // Register a new user
 async signup(userData) {
  const { name, email, password, age, gender } = userData;

  // 1. check if email already registered
  const existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

 
  const hashedPassword = await bcrypt.hash(password, 12);

 
  const user = await UserRepository.create({
    name,
    email,
    password: hashedPassword,
    age,
    gender,
  });

  console.log("Saved user id:", user.id);


  if (!user || !user.id) {
    throw new AppError("Failed to create user", 500);
    // catch silent failures explicitly
  }


  const token = generateToken(user.id);


  return { user, token };
}

  // Login existing user
  async login(email, password) {1
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
      },
      token,
    };
  }

  // Get user profile
  async getProfile(userId) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Return user data
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      createdAt: user.created_at,
    };
  }
}

export default new AuthService();

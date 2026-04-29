import bcrypt from "bcryptjs";
import UserRepository from "../repository/userRepository.js";
import { generateToken } from "../utilis/jwt.js";
import AppError from "../utilis/appError.js";

// Service handles business logic for authentication
class AuthService {
  // Register a new user
  async signup(userData) {
    const { name, email, password, age, gender } = userData;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError("Invalid email or password", 400);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log("Password being hashed:", password);
    console.log("Generated hash:", passwordHash);

    // Create user in database
    const user = await UserRepository.create({
      email,
      password_hash: passwordHash, // ← Use the database column name
      name,
      age,
      gender,
    });
    console.log("User created:", user); // ← See what's actually returned
    console.log("Password hash in DB:", user.password_hash);

    //Generate JWT token
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

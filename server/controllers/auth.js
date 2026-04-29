import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

import {sequelize,connectDB} from '../database/connection.js';
import authService from '../services/authServices.js';

import asyncHandler from '../utilis/asyncHandler.js';
import AppError from '../utilis/appError.js';
import userRepsitory from '../repository/userRepository.js';

dotenv.config();


export const signUp =  asyncHandler(async (req, res) => {
const { name, email, password, age, gender } = req.body;
 
  const { user, token } = await authService.signup({
    name,
    email,
    password,
    age,
    gender,
  });

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});


export const signIn = asyncHandler(async (req, res) => {
   const { email, password } = req.body;

  const { user, token } = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

// Logout user (simple version)
export const signOut = async (req, res, next) => {
  try {
  
    res.clearCookie('token');
    
    // Send success response
    res.status(200).json({ 
      message: 'Logged out successfully',
      success: true 
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Something went wrong during logout',
      error: error.message 
    });
  }
};


//user profile
export const getProfile = asyncHandler(async (req, res) => {

const userId = req.user.id;
// Get user profile
const user = await authService.getProfile(userId);
res.status(200).json({
status: 'success',
data: { user }
});
});
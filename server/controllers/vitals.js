import express from 'express';
import {sequelize,connectDB} from '../database/connection.js';

import vitalsService from '../services/vitalService.js';
import asyncHandler from '../utilis/asyncHandler.js';


export const recordVital = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { heartRate, spO2, bodyTemperature, respiratoryRate, roomHumidity, ecgData } = req.body;

  const io = req.app.get("io");
  
  if (!heartRate && !spO2 && !bodyTemperature && !respiratoryRate && !roomHumidity) {
    return res.status(400).json({ success: false, message: "At least one vital reading is required" });
  }

  const result = await vitalsService.recordVital({
    userId, heartRate, spO2, bodyTemperature,
    respiratoryRate, roomHumidity, ecgData,
    io,
  
  });

  res.status(201).json({
    success: true,
    message: "Vital reading recorded successfully",
    data: result,
  });
});

export const getLatestVitals = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
 

  const vitals = await vitalsService.getLatestVitals(userId);


  if (!vitals) {
    return res.status(404).json({
      success: false,
      message: "No vitals recorded yet"
    });
   
  }

  res.status(200).json({
    success: true,
    data: vitals,
  });
});
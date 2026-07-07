import express from 'express';
import {sequelize,connectDB} from '../database/connection.js';

import vitalsService from '../services/vitalService.js';
import asyncHandler from '../utilis/asyncHandler.js';


export const recordVital = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { heartRate, spO2, bodyTemperature, respiratoryRate, roomHumidity, ecgData, tinyMLClassification } = req.body;

  const io = req.app.get("io");
  
  if (!heartRate && !spO2 && !bodyTemperature && !respiratoryRate && !roomHumidity) {
    return res.status(400).json({ success: false, message: "At least one vital reading is required" });
  }

  const result = await vitalsService.recordVital({
    userId, heartRate, spO2, bodyTemperature,
    respiratoryRate, roomHumidity, ecgData,  tinyMLClassification,
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

export const getVitalsHistory = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const days = parseInt(req.query.days) || 30;
 

  const history = await vitalsService.getVitalsHistory(userId, days);

  res.status(200).json({
    success: true,
    data: history,
  });
});

export const getLatestECG = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;

  const ecg = await vitalsService.getLatestECG(userId);

  if (!ecg) {
    return res.status(404).json({
      success: false,
      message: "No ECG data recorded yet. Ensure the hardware is connected.",
    });
  }

  res.status(200).json({
    success: true,
    data: ecg,
  });
});
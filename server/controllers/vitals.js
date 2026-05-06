import express from 'express';
import {sequelize,connectDB} from '../database/connection.js';

import vitalsService from '../services/vitalService.js';
import asyncHandler from '../utilis/asyncHandler.js';
// only import what this file actually uses

export const recordVital = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  // req.user is attached by your authenticate middleware
  // it contains the decoded JWT payload — { id: userId }
  // we rename id to userId immediately for clarity

  const { heartRate, spO2, bodyTemperature, respiratoryRate, roomHumidity } = req.body;
  // destructure each vital individually instead of generic type/value
  // this is more explicit and easier to validate
  // hardware should send all readings in one POST

  // validate — make sure at least one vital was sent
  if (!heartRate && !spO2 && !bodyTemperature && !respiratoryRate && !roomHumidity) {
    return res.status(400).json({
      success: false,
      message: "At least one vital reading is required"
    });
  }

  const vital = await vitalsService.recordVital({
    userId,
    heartRate,
    spO2,
    bodyTemperature,
    respiratoryRate,
    roomHumidity,
  });
  // passes all readings to the service in one object
  // service handles saving + threshold checking

  res.status(201).json({
    success: true,
    message: "Vital reading recorded successfully",
    data: vital,
  });
});

export const getLatestVitals = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  // same pattern — get userId from the verified JWT

  const vitals = await vitalsService.getLatestVitals(userId);
  // service fetches the most recent row for this user

  if (!vitals) {
    return res.status(404).json({
      success: false,
      message: "No vitals recorded yet"
    });
    // handle the case where a brand new user has no readings
    // without this the app receives null and crashes
  }

  res.status(200).json({
    success: true,
    data: vitals,
  });
});
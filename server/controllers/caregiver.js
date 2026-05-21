import caregiverService from "../services/caregiverService.js";
import asyncHandler from "../utilis/asyncHandler.js";

// GET /api/v1/caregivers — list all caregivers
export const getCaregivers = asyncHandler(async (req, res) => {
  const { id: patientId } = req.user;
  const caregivers = await caregiverService.getCaregivers(patientId);

  res.status(200).json({
    success: true,
    count: caregivers.length,
    data: caregivers,
  });
});

// POST /api/v1/caregivers — add a new caregiver
export const addCaregiver = asyncHandler(async (req, res) => {
  const { id: patientId } = req.user;
  const { name, email, phoneNumber, relationship } = req.body;

  const caregiver = await caregiverService.addCaregiver(patientId, {
    name, email, phoneNumber, relationship,
  });

  res.status(201).json({
    success: true,
    message: "Caregiver added successfully",
    data: caregiver,
  });
});

// DELETE /api/v1/caregivers/:id — remove a caregiver
export const removeCaregiver = asyncHandler(async (req, res) => {
  const { id: patientId } = req.user;
  const { id: caregiverId } = req.params;
 

  const result = await caregiverService.removeCaregiver(caregiverId, patientId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// PATCH /api/v1/caregivers/:id/toggle — mute or unmute a caregiver
export const toggleCaregiver = asyncHandler(async (req, res) => {
  const { id: patientId } = req.user;
  const { id: caregiverId } = req.params;

  const caregiver = await caregiverService.toggleCaregiver(caregiverId, patientId);

  res.status(200).json({
    success: true,
    message: `Caregiver ${caregiver.isActive ? "activated" : "muted"}`,
    data: caregiver,
  });
});

// POST /api/v1/caregivers/:id/share — generate a share link for one caregiver
export const generateShareLink = asyncHandler(async (req, res) => {
  const { id: patientId } = req.user;
  const { id: caregiverId } = req.params;

  const shareData = await caregiverService.generateShareLink(caregiverId, patientId);

  res.status(200).json({
    success: true,
    message: "Share link generated — expires in 7 days",
    data: shareData,
  });
});

// GET /api/v1/share/:token — public caregiver view (NO auth required)
export const getSharedVitals = asyncHandler(async (req, res) => {
  const { token } = req.params;


  const data = await caregiverService.getSharedVitals(token);

  res.status(200).json({
    success: true,
    data,
  });
});
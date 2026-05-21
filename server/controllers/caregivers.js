import asyncHandler from "../utilis/asyncHandler";
import AppError from "../utilis/appError";
import caregiverRepository from "../repository/caregiverRepository";

// Add a caregiver for a user
export const addCaregiver = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { name, email, phone } = req.body;  
  const caregiver = await caregiverRepository.addCaregiver(userId, { name, email, phone });
    res.status(201).json({
    success: true,
    message: "Caregiver added successfully",
    data: caregiver,
  });
}
);

// Get all caregivers for a user
export const getCaregivers = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
    const caregivers = await caregiverRepository.getCaregiversByUserId(userId);
    res.status(200).json({
    success: true,
    data: caregivers,
  });
}
);

// Remove a caregiver
export const removeCaregiver = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
    const { caregiverId } = req.params;
    const caregiver = await caregiverRepository.removeCaregiver(caregiverId, userId);
    if (!caregiver) {
    return res.status(404).json({
      success: false,
        message: "Caregiver not found",
    });
    }
        res.status(200).json({
    success: true,
    message: "Caregiver removed successfully",
    data: caregiver,
  });
}
);


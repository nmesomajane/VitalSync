import asyncHandler from "../utilis/asyncHandler.js";
import medicationService from "../services/medicationService.js";

export const addMedication = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const medication = await medicationService.addMedication(userId, req.body);

  res.status(201).json({
    success: true,
    message: "Medication added successfully",
    data: medication,
  });
});

export const getMedications = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const medications = await medicationService.getMedications(userId);

  res.status(200).json({
    success: true,
    count: medications.length,
    data: medications,
  });
});

export const updateMedication = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { id: medicationId } = req.params;
  const medication = await medicationService.updateMedication(
    medicationId, userId, req.body
  );

  res.status(200).json({
    success: true,
    message: "Medication updated successfully",
    data: medication,
  });
});

export const deleteMedication = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { id: medicationId } = req.params;
  const result = await medicationService.deleteMedication(medicationId, userId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const toggleReminder = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { id: medicationId } = req.params;
  const medication = await medicationService.toggleReminder(medicationId, userId);

  res.status(200).json({
    success: true,
    message: `Reminder ${medication.reminderEnabled ? "enabled" : "disabled"}`,
    data: medication,
  });
});
import asyncHandler from "../utilis/asyncHandler.js";
import medicationService from "../services/medicationService.js";


export const addMedication = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const medicationData = req.body;
    const medication = await medicationService.addMedication(userId, medicationData);
    res.status(201).json({
        success: true,
        message: "Medication added successfully",
        data: medication,
    });
}
);

export const getMedications = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
    const medications = await medicationService.getMedications(userId);
    res.status(200).json({
        success: true,
        count: medications.length,

        data: medications,
    });
}
);

export const updateMedication = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { id: medicationId } = req.params;
    const updateData = req.body;
    const medication = await medicationService.updateMedication(medicationId, userId, updateData);
    res.status(200).json({
        success: true,
        message: "Medication updated successfully",
        data: medication,
    });
}
);

export const deleteMedication = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { id: medicationId } = req.params;
    await medicationService.deleteMedication(medicationId, userId);
    res.status(200).json({
        success: true,
        message: "Medication deleted successfully",
    });
}
);



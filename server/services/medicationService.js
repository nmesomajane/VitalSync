import medicationRepository from "../repository/medicationRepository.js";
import AppError from "../utilis/appError.js";

class MedicationService {

  async addMedication(userId, medicationData) {
    const { name, dosage, frequency } = medicationData; 
    if (!name || !dosage || !frequency) {
      throw new AppError("Name, dosage, and frequency are required", 400);
    }
    const medication = await medicationRepository.createMedication({
      userId,
      name,
        dosage,
        frequency,
        startDate: medicationData.startDate || new Date(),
        endDate: medicationData.endDate || null,
        notes: medicationData.notes || null,
    });
    return medication;
  }

    async getMedications(userId) {
        const medications = await medicationRepository.findMedicationsByUserId(userId);
        return medications;
    }

    async updateMedication(medicationId, userId, updateData) {
        const medication = await medicationRepository.updateMedication(medicationId, userId, updateData);
        if (!medication) {
            throw new AppError("Medication not found", 404);
        }
        return medication;
    }

    async deleteMedication(medicationId, userId) {
        const medication = await medicationRepository.deleteMedication(medicationId, userId);
        if (!medication) {
            throw new AppError("Medication not found", 404);
        }
        return medication;
    }
}

export default new MedicationService();
import Medication from "../models/medication.js";
import { Op } from "sequelize";

class MedicationRepository {

  async createMedication(medicationData) {
    return await Medication.create(medicationData);
  }

  async findMedicationsByUserId(userId) {
    return await Medication.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findActiveMedications(userId) {
    return await Medication.findAll({
      where: {
        userId,
        isActive: true,
        reminderEnabled: true,
       
        startDate: { [Op.lte]: new Date() },
        
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: new Date() } },
        
        ],
      },
    });
  }

  async findAllActiveForCron() {
    
    return await Medication.findAll({
      where: {
        isActive: true,
        reminderEnabled: true,
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: new Date() } },
        ],
      },
    });
  }

  async findMedicationById(id, userId) {
    return await Medication.findOne({ where: { id, userId } });
  }

  async updateMedication(id, userId, updateData) {
    const med = await Medication.findOne({ where: { id, userId } });
    if (!med) return null;
    await med.update(updateData);
    return med;
  }

  async deleteMedication(id, userId) {
    const med = await Medication.findOne({ where: { id, userId } });
    if (!med) return null;
    await med.destroy();
    return true;
   
  }
}

export default new MedicationRepository();
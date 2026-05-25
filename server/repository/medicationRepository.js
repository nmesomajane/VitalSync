import medication from "../models/medication.js";

class MedicationRepository {
    async createMedication(medicationData) {
        return await medication.create(medicationData);
    }
    async findMedicationsByUserId(userId) {
        return await medication.findAll({ where: { userId } });
    }
    async findMedicationById(id, userId) {
        return await medication.findOne({ where: { id, userId } });
    }
    async updateMedication(id, userId, updateData) {
        const med = await medication.findOne({ where: { id, userId } });
        if (!med) return null;
        await med.update(updateData);
        return med;
    }
    async deleteMedication(id, userId) {
        const med = await medication.findOne({ where: { id, userId } });
        if (!med) return null;
        await med.destroy();
        return med;
    }

}

export default new MedicationRepository();
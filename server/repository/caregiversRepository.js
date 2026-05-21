import Caregiver from "../models/Caregiver.js";

class CaregiverRepository {
    async addCaregiver(userId, caregiverData) {
        const caregiver = await Caregiver.create({
            userId,
            ...caregiverData,
        });
        return caregiver;
    }

    async getCaregiversByUserId(userId) {

        const caregivers = await Caregiver.findAll({
            where: { userId },
        });
        return caregivers;
    }

    async removeCaregiver(caregiverId, userId) {
        const caregiver = await Caregiver.findOne({
            where: { id: caregiverId, userId },
        });
        if (!caregiver) return null;
        await caregiver.destroy();
        return caregiver;
    }
}

export default new CaregiverRepository();
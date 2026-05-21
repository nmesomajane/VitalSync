import Caregiver from "../models/caregiver.js";

class CaregiverRepository {

  async create(caregiverData) {
   
    const caregiver = await Caregiver.create(caregiverData);
    return caregiver;
  }

  async findAllByPatientId(patientId) {
  
    const caregivers = await Caregiver.findAll({
      where: { patientId },
    
      order: [["createdAt", "ASC"]],
  
    });
    return caregivers;
  }

  async findById(id, patientId) {
 
    const caregiver = await Caregiver.findOne({
      where: { id, patientId },
    });
    return caregiver;
  }

  async findByShareToken(token) {
   
    const caregiver = await Caregiver.findOne({
      where: { shareToken: token },
    });
    return caregiver;
  }

  async findActiveByPatientId(patientId) {
   
    const caregivers = await Caregiver.findAll({
      where: { patientId, isActive: true },
    });
    return caregivers;
  }

  async updateShareToken(id, shareToken, tokenExpiresAt) {
    
    const caregiver = await Caregiver.findByPk(id);
    if (!caregiver) return null;
    await caregiver.update({ shareToken, tokenExpiresAt });
    return caregiver;
  }

  async delete(id, patientId) {
   
    const caregiver = await Caregiver.findOne({ where: { id, patientId } });
    if (!caregiver) return false;
    await caregiver.destroy();

    return true;
  }

  async toggleActive(id, patientId) {
   
    const caregiver = await Caregiver.findOne({ where: { id, patientId } });
    if (!caregiver) return null;
    await caregiver.update({ isActive: !caregiver.isActive });

    return caregiver;
  }
}

export default new CaregiverRepository();
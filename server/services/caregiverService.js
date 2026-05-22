import jwt from "jsonwebtoken";
import caregiverRepository from "../repository/caregiverRepository.js";
import vitalsRepository from "../repository/vitalRepository.js";
import AppError from "../utilis/appError.js";

class CaregiverService {

  async addCaregiver(patientId, caregiverData) {
    const { name, email, phoneNumber, relationship } = caregiverData;

    //  validate phone number format
   
    if (!phoneNumber.startsWith("+")) {
      throw new AppError(
        "Phone number must be in international format e.g. +2348012345678",
        400
      );
    }

    //  check caregiver limit — max 5 per patient
    const existing = await caregiverRepository.findAllByPatientId(patientId);
    if (existing.length >= 5) {
      throw new AppError(
        "Maximum of 5 caregivers allowed. Remove one before adding another.",
        400
      );
    }

    //  check for duplicate phone number
    
    const duplicate = existing.find(c => c.phoneNumber === phoneNumber);
    if (duplicate) {
      throw new AppError(
        "A caregiver with this phone number already exists",
        400
      );
    }

    //  save to database
    const caregiver = await caregiverRepository.create({
      patientId,
      name,
      email,
      phoneNumber,
      relationship,
    });

    return caregiver;
  }

  async getCaregivers(patientId) {
    const caregivers = await caregiverRepository.findAllByPatientId(patientId);
    return caregivers;
  }

  async removeCaregiver(caregiverId, patientId) {
    const deleted = await caregiverRepository.delete(caregiverId, patientId);
    if (!deleted) {
      throw new AppError("Caregiver not found", 404);
    }
    return { message: "Caregiver removed successfully" };
  }

  async toggleCaregiver(caregiverId, patientId) {
    const caregiver = await caregiverRepository.toggleActive(caregiverId, patientId);
    if (!caregiver) {
      throw new AppError("Caregiver not found", 404);
    }
    return caregiver;
  }

  async generateShareLink(caregiverId, patientId) {
  
    const caregiver = await caregiverRepository.findById(caregiverId, patientId);
    if (!caregiver) throw new AppError("Caregiver not found", 404);

    // generates a JWT specifically for caregiver access
   
    const shareToken = jwt.sign(
      {
        patientId,
        caregiverId,
        type: "caregiver_share",
        
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
     
    );

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);
   

    await caregiverRepository.updateShareToken(
      caregiverId, shareToken, tokenExpiresAt
    );

    return {
      shareUrl: `${process.env.CLIENT_URL}/share/${shareToken}`,
      
      expiresAt: tokenExpiresAt,
      token: shareToken,
    };
  }

  async getSharedVitals(token) {


    // verify the token is valid and not expired
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AppError("Share link is invalid or has expired", 401);
    }

    // confirm it's a share token not a user JWT
    if (decoded.type !== "caregiver_share") {
      throw new AppError("Invalid share link", 401);
      
    }

    //  confirm the caregiver still exists
   
    const caregiver = await caregiverRepository.findByShareToken(token);
    if (!caregiver) {
      throw new AppError("This share link has been revoked", 401);
    }

    //  fetch the patient's latest vitals
    const vitals = await vitalsRepository.findLatestByUserId(decoded.patientId);

    return {
      patient: {
      
        name: "VitalSync Patient",
 
      },
      vitals,
      caregiver: {
        name: caregiver.name,
        relationship: caregiver.relationship,
      },
      accessExpiresAt: caregiver.tokenExpiresAt,
    };
  }
}

export default new CaregiverService();
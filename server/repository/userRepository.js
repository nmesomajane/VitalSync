import User from "../models/user.js";
import Caregiver from "../models/caregiver.js";

class UserRepository {

  async findByEmail(email) {
    const user = await User.findOne({ where: { email } });
    
    return user;
    
  }

  async findById(id) {
    console.log("findById called with:", id);


    const user = await User.findOne({ where: { id: id } });
    

    console.log("findById result:", user ? user.id : "null");
    return user;
  }

  async findByGoogleId(googleId) {
    const user = await User.findOne({ where: { googleId } });
    return user;
  }

  async create(userData) {
    console.log("Creating user with data:", userData);
    const user = await User.create(userData);
    console.log("User created, id:", user.id);
    return user;
  }

  async updateById(id, updateData) {
    const user = await User.findOne({ where: { id: id } });
    if (!user) return null;
    await user.update(updateData);
    return user;
  }
async findCaregivers(patientId) {
 
  const { default: Caregiver } = await import("../models/caregiver.js");

  const caregivers = await Caregiver.findAll({
    where: {
      patientId,
      isActive: true,
    },
  });

  console.log(`userRepository.findCaregivers: found ${caregivers.length} for patient ${patientId}`);
  return caregivers;
}
}

export default new UserRepository();
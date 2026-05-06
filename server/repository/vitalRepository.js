import Vitals from "../models/vital.js";
import { sequelize } from "../database/connection.js";

class VitalsRepository {

  async create(vitalsData) {
    // saves one reading to the database
   
    const vital = await Vitals.create(vitalsData);
    return vital;
  }

  async findLatestByUserId(userId) {
    // fetches the single most recent reading for a user
    const vital = await Vitals.findOne({
      where: { userId },

      order: [["createdAt", "DESC"]],
      // DESC = most recent first
    
    });
    return vital;
  }

  async findHistoryByUserId(userId, days = 30) {
    // fetches all readings within the last 30 days
  

    const since = new Date();
    since.setDate(since.getDate() - days);
    // calculate the date 30 days ago

    const vitals = await Vitals.findAll({
      where: {
        userId,
        createdAt: {
          [sequelize.Sequelize.Op.gte]: since,
     
        },
      },
      order: [["createdAt", "ASC"]],
  
    });
    return vitals;
  }

  async findAnomaliesByUserId(userId) {
    // fetches only readings that had anomalies
 
    const anomalies = await Vitals.findAll({
      where: { userId, hasAnomaly: true },
      order: [["createdAt", "DESC"]],
    });
    return anomalies;
  }

}

export default new VitalsRepository();
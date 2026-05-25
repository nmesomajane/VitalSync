import Vitals from "../models/vital.js";
import { sequelize } from "../database/connection.js";
import { QueryTypes, Op } from "sequelize";

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

  
async findDailyAverages(userId, days = 30) {
  try {
    const results = await sequelize.query(
      `
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        ROUND(AVG("heartRate")::numeric, 1)        AS "avgHeartRate",
        ROUND(AVG("spO2")::numeric, 1)             AS "avgSpO2",
        ROUND(AVG("bodyTemperature")::numeric, 1)  AS "avgBodyTemperature",
        ROUND(AVG("respiratoryRate")::numeric, 1)  AS "avgRespiratoryRate",
        ROUND(AVG("roomHumidity")::numeric, 1)     AS "avgRoomHumidity",
        COUNT(*)::integer                          AS "totalReadings",
        SUM(CASE WHEN "hasAnomaly" = true THEN 1 ELSE 0 END)::integer AS "anomalyCount"
      FROM "Vitals"
      WHERE "userId" = :userId
      AND "createdAt" >= NOW() - INTERVAL '1 day' * :days
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
      `,
      {
        replacements: { userId, days: parseInt(days) },
        type: QueryTypes.SELECT,
      }
    );
    return results;

  } catch (error) {
    console.error("findDailyAverages SQL error:", {
      message: error.message,
      original: error.original?.message,
      //  this is the actual PostgreSQL error text
      sql: error.sql,
      //  the exact query that was sent
    });
    throw error;
  }
}

  async findRawReadings(userId, days = 7) {
    

    const since = new Date();
    since.setDate(since.getDate() - days);

    const vitals = await Vitals.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: since },
      },
      order: [["createdAt", "ASC"]],
      attributes: [
        
        "id", "heartRate", "spO2", "bodyTemperature",
        "respiratoryRate", "roomHumidity", "hasAnomaly", "createdAt"
      ],
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
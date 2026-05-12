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
 

    const results = await sequelize.query(
      `
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        -- truncates each timestamp to midnight of that day
        -- '2024-05-01 08:32:00' becomes '2024-05-01 00:00:00'
        -- this is what allows GROUP BY to bundle same-day rows

        ROUND(AVG("heartRate")::numeric, 1)        AS "avgHeartRate",
        ROUND(AVG("spO2")::numeric, 1)             AS "avgSpO2",
        ROUND(AVG("bodyTemperature")::numeric, 1)  AS "avgBodyTemperature",
        ROUND(AVG("respiratoryRate")::numeric, 1)  AS "avgRespiratoryRate",
        ROUND(AVG("roomHumidity")::numeric, 1)     AS "avgRoomHumidity",
        -- ROUND(...::numeric, 1) gives one decimal place
        -- ::numeric casts the float to numeric type
        -- PostgreSQL requires this for ROUND to work on floats

        COUNT(*)::integer AS "totalReadings",
        -- how many readings were taken that day
        -- ::integer converts bigint to regular integer

        SUM(CASE WHEN "hasAnomaly" = true THEN 1 ELSE 0 END)::integer AS "anomalyCount"
        -- CASE WHEN acts like an if statement inside SQL
        -- counts only the rows where hasAnomaly is true
        -- gives you "3 anomalies on May 1st" for the history screen

      FROM "Vitals"

      WHERE "userId" = :userId
      -- :userId is a named parameter — sequelize replaces it
      -- with the actual value safely, preventing SQL injection

      AND "createdAt" >= NOW() - INTERVAL :interval
      -- NOW() = current timestamp in PostgreSQL
      -- INTERVAL '30 days' = subtract 30 days from now
      -- combined: only rows from the last 30 days

      GROUP BY DATE_TRUNC('day', "createdAt")
      -- bundles all rows with the same truncated day together
      -- without this, AVG() would average ALL days into one number

      ORDER BY day ASC
      -- ASC = oldest day first, newest last
      -- correct order for a left-to-right timeline chart
      `,
      {
        replacements: {
          userId,
          interval: `'${days} days'`,
          // sequelize replaces :userId and :interval
          // with these values safely
        },
        type: QueryTypes.SELECT,
        // tells sequelize this is a SELECT query
        // returns an array of plain objects — no Sequelize model wrapping
      }
    );

    return results;
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
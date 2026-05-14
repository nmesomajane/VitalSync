import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Threshold = sequelize.define("Threshold", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
   
    references: { model: "Users", key: "id" },
    onDelete: "CASCADE",
  },

  heartRateMin: { type: DataTypes.FLOAT, defaultValue: 60 },
  heartRateMax: { type: DataTypes.FLOAT, defaultValue: 100 },
 

  spO2Min: { type: DataTypes.FLOAT, defaultValue: 94 },
  spO2Max: { type: DataTypes.FLOAT, defaultValue: 100 },

  bodyTemperatureMin: { type: DataTypes.FLOAT, defaultValue: 36.1 },
  bodyTemperatureMax: { type: DataTypes.FLOAT, defaultValue: 37.5 },
 

  respiratoryRateMin: { type: DataTypes.FLOAT, defaultValue: 12 },
  respiratoryRateMax: { type: DataTypes.FLOAT, defaultValue: 20 },
 

  roomHumidityMin: { type: DataTypes.FLOAT, defaultValue: 30 },
  roomHumidityMax: { type: DataTypes.FLOAT, defaultValue: 70 },
 

}, { timestamps: true });

export default Threshold;
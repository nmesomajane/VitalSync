import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Vitals = sequelize.define("Vitals", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    
  },
  heartRate: {
    type: DataTypes.FLOAT,
    
    allowNull: true,
  },
  bodyTemperature: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  spO2: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  respiratoryRate: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  roomHumidity: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  ecgData: {
    type: DataTypes.JSONB,
    
    allowNull: true,
  },
  hasAnomaly: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
anomalydetails: {
  type: DataTypes.JSONB,
  allowNull: true,
},
// in models/vitals.js — add these fields
tinyMLClassification: {
  type: DataTypes.ENUM(
    "normal_sinus",
    "atrial_fibrillation",
    "ventricular_premature_contraction",
    "bradycardia",
    "tachycardia"
  ),
  allowNull: true,
  // null when hardware not sending ML results yet
},


}, { timestamps: true });

export default Vitals;
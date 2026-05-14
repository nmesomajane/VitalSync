import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Alert = sequelize.define("Alert", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "Users", key: "id" },
    onDelete: "CASCADE",
    
  },

  type: {
    type: DataTypes.ENUM(
      "threshold_breach",
   
      "sos",
     
      "device_disconnected"
    
    ),
    allowNull: false,
  },

  severity: {
    type: DataTypes.ENUM("low", "medium", "high", "critical"),
    allowNull: false,
    
  },

  metric: {
    type: DataTypes.STRING,
    allowNull: true,
    // which vital triggered the alert
  
  },

  value: {
    type: DataTypes.FLOAT,
    allowNull: true,
    // the actual reading that triggered the alert
    
  },

  threshold: {
    type: DataTypes.FLOAT,
    allowNull: true,
    // the limit that was crossed
  
  },

  message: {
    type: DataTypes.STRING,
    allowNull: false,
    // human readable description
   
  },

  vitalsSnapshot: {
    type: DataTypes.JSONB,
    allowNull: true,
    // stores ALL vitals at the moment of the alert
  
  },

  acknowledged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    
  },

  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    // timestamp when user acknowledged
 
  },

  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    // tracks whether FCM push was successfully sent
  
  },

  smsSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    // tracks whether Twilio SMS was successfully sent

  },

}, { timestamps: true });

export default Alert;
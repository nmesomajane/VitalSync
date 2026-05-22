import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Caregiver = sequelize.define("Caregiver", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "Users", key: "id" },
    onDelete: "CASCADE",
    
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
   
  },

  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
    
  },

  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  
  },

  relationship: {
    type: DataTypes.STRING,
    allowNull: true,
    
  },

  shareToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    unique: true,

  },

  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    
  },

}, { timestamps: true });

export default Caregiver;
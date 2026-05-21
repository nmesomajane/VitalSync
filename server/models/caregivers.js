import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const Caregiver = sequelize.define("Caregiver", {
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
    
    name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
        isEmail: true,
    },
    },
    phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, { timestamps: true });

export default Caregiver;

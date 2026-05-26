import { sequelize } from "../database/connection.js";
import { DataTypes } from "sequelize";

const Medication = sequelize.define(
  "Medication",
  {
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
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM(
        "once_daily",
        "twice_daily",
        "three_times_daily",
        "weekly",
        "as_needed",
      ),
      allowNull: false,
    },
    scheduledTimes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    reminderEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  { timestamps: true },
);

export default Medication;

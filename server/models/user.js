import { DataTypes } from "sequelize";
import { sequelize } from "../database/connection.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // null for Google OAuth users — they have no password
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true, // null for email/password users
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      // used by Twilio to send SMS
    },

    fcmToken: {
      type: DataTypes.STRING,
      allowNull: true,
      // used for push notifications via Firebase Cloud Messaging
    },
  },
  {
    timestamps: true,
  },
);

export default User;

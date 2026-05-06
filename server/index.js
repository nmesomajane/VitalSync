import express from "express";
import bodyParser from 'body-parser';
import cors from 'cors';
import googleRoutes from './routes/google.js'
import passport from './auth/google.js'
import session from "express-session";
import {connectDB,sequelize} from "./database/connection.js"
import User from './models/user.js'
import authRoutes from './routes/auth.js'
import vitalsRoutes from './routes/vitals.js'
import AppError from "./utilis/appError.js";
import errorHandler from "./middleware/errorHandler.js";






import dotenv from "dotenv";
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {


  await connectDB();


  await sequelize.sync({ alter: true });
  
  console.log("Database tables synced");

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use("/api/v1/auth", googleRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/vitals", vitalsRoutes);
  // Error handling middleware
  app.use(errorHandler);


  app.get("/", (req, res) => {
    res.send("VitalSync API is running");
  });

  app.listen(PORT, () => {
    console.log(`VitalSync server running on port ${PORT}`);
  });
};

startServer();

export default app;
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import bodyParser from 'body-parser';
import cors from 'cors';
import googleRoutes from './routes/google.js'
import passport from './auth/google.js'
import session from "express-session";
import {connectDB,sequelize} from "./database/connection.js"
import User from './models/user.js'
import authRoutes from './routes/auth.js'
import vitalsRoutes from './routes/vitals.js'
import alertRoutes from "./routes/alerts.js";
import caregiverRoutes from "./routes/caregiver.js";
import aiRoutes from "./routes/ai.js";
import medicationRoutes from "./routes/medication.js";
import medicationService from "./services/medicationService.js";
import AppError from "./utilis/appError.js";
import Alert from "./models/alert.js";
import Threshold from "./models/threshold.js";
import errorHandler from "./middleware/errorHandler.js";
import { setupSocketIO } from "./socket/socketManager.js";
import dotenv from "dotenv";



dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
   
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: "*",
  // accept requests from any origin during development
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.set("io", io);


setupSocketIO(io);


const startServer = async () => {
  await connectDB();
  await sequelize.sync({ alter: true });
  console.log("Database synced");

 medicationService.startMedicationReminders();

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

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/vitals", vitalsRoutes);
  app.use("/api/v1/alerts", alertRoutes);
  app.use ("/api/v1/caregivers", caregiverRoutes);
  app.use("/api/v1/ai", aiRoutes);
  app.use("/api/v1/medications", medicationRoutes);
  app.get("/", (req, res) => {
    res.send("VitalSync API is running");
  });

  httpServer.listen(process.env.PORT || 3000, () => {
    console.log(`VitalSync server running on port ${process.env.PORT || 3000}`);
  });

};

startServer();
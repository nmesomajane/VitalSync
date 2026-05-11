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
import AppError from "./utilis/appError.js";
import errorHandler from "./middleware/errorHandler.js";
import { setupSocketIO } from "./socket/socketManager.js";
import dotenv from "dotenv";



dotenv.config();

const app = express();
const httpServer = createServer(app);


const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "3000",
    // which clients are allowed to connect via WebSocket or replace with the actual production url
   
    methods: ["GET", "POST"],
  },
});

app.set("io", io);


setupSocketIO(io);


const startServer = async () => {
  await connectDB();
  await sequelize.sync({ alter: true });
  console.log("Database synced");

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

  app.get("/", (req, res) => {
    res.send("VitalSync API is running");
  });

  httpServer.listen(process.env.PORT || 3000, () => {
    console.log(`VitalSync server running on port ${process.env.PORT || 3000}`);
  });

};

startServer();
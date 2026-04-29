import express from "express";
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/google.js'
import passport from './auth/google.js'
import session from "express-session";
import {connectDB,sequelize} from "./database/connection.js"
import User from './models/user.js'




import dotenv from "dotenv";
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
// wrap everything in an async function so we can
// await the database before starting the server
// this guarantees the DB is ready before any request hits

  await connectDB();
  // wait for PostgreSQL connection to succeed

  await sequelize.sync({ alter: true });
  // NOW sync models — sequelize exists, User model exists
  // no circular issue because the order is controlled here
  // alter: true updates tables if your models change
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
  app.use("/api/auth", authRoutes);

  app.get("/", (req, res) => {
    res.send("VitalSync API is running");
  });

  app.listen(PORT, () => {
    console.log(`VitalSync server running on port ${PORT}`);
  });
};

startServer();

export default app;
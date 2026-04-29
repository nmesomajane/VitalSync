import express from "express";
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/google.js'
import passport from './auth/google.js'
import session from "express-session";




import dotenv from "dotenv";
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

// Session - required for passport to work
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // set to true when you deploy with HTTPS
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("VitalSync API is running");
});

app.listen(PORT, () => {
  console.log(`VitalSync server running on port ${PORT}`);
});

export default app;
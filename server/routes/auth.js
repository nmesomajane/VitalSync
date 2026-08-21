import express from "express";
import { signIn, signOut,signUp ,getProfile} from "../controllers/auth.js";

import { authenticate } from "../middleware/authentication.js";
import jwt from "jsonwebtoken";



const router = express.Router();
// POST /api/v1/auth/signup

router.post('/signup',  signUp)
router.post('/signin',  signIn)
router.post('/signout', signOut)


// GET /api/v1/auth/profile
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, signOut);



// POST /api/v1/auth/device-token

router.post("/device-token", async (req, res) => {
  try {
    const { deviceSecret } = req.body;

    if (deviceSecret !== process.env.DEVICE_SECRET) {
      return res.status(401).json({ message: "Invalid device secret" });
    }

    const deviceToken = jwt.sign(
      {
        type: "hardware_device",
        deviceId: "vitalsync_esp32_v1",
        
      },
      process.env.JWT_SECRET

    );

    res.json({
      success: true,
      deviceToken,
      message: "Store this token permanently in ESP32 flash memory"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export  default router
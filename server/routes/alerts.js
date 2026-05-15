import express from "express";
import {
  getAlerts,
  acknowledgeAlert,
  getThresholds,
  updateThresholds,
  triggerSOS,
  updateFCMToken,
} from "../controllers/alerts.js";
import { authenticate } from "../middleware/authentication.js";

const router = express.Router();


router.use(authenticate);


router.get("/",                       getAlerts);
router.put("/:id/acknowledge",        acknowledgeAlert);
router.get("/thresholds",             getThresholds);
router.put("/thresholds",             updateThresholds);
router.post("/sos",                   triggerSOS);
router.post("/fcm-token",             updateFCMToken);

export default router;
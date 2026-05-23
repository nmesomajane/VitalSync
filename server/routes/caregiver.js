import express from "express";
import {
  getCaregivers,
  addCaregiver,
  removeCaregiver,
  toggleCaregiver,
  generateShareLink,
  getSharedVitals,
} from "../controllers/caregiver.js";
import { authenticate } from "../middleware/authentication.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authenticate, getCaregivers);
router.post("/", authenticate, addCaregiver);
router.delete("/:id", authenticate, removeCaregiver);
router.patch("/:id/toggle", authenticate, toggleCaregiver);
router.post("/:id/share", authenticate, generateShareLink);
router.get("/shared/:token", authenticate, getSharedVitals);


export default router;

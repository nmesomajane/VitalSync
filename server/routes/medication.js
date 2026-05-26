import express from "express";
import {
  addMedication,
  getMedications,
  updateMedication,
  deleteMedication,
  toggleReminder,
} from "../controllers/medication.js";
import { authenticate } from "../middleware/authentication.js";

const router = express.Router();

router.use(authenticate);

router.post("/",                      addMedication);
router.get("/",                       getMedications);
router.put("/:id",                    updateMedication);
router.delete("/:id",                 deleteMedication);
router.patch("/:id/toggle-reminder",  toggleReminder);

export default router;
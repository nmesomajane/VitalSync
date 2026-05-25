import express from 'express'
import {addMedication, deleteMedication, getMedications, updateMedication} from '../controllers/medication.js'
import { authenticate } from "../middleware/authentication.js";

const router = express.Router();

router.use(authenticate);

router.post("/", addMedication);
router.get("/", getMedications);
router.put("/:id", updateMedication);
router.delete("/:id", deleteMedication);

export default router;

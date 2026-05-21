import express from "express";
import {
  getCaregivers,
  addCaregiver,
  removeCaregiver,
  toggleCaregiver,
  generateShareLink,
  getSharedVitals,
} from "../controllers/caregivers.js";
import { authenticate } from "../middleware/authentication.js";

const router = express.Router();


router.use(authenticate);


router.get("/",              getCaregivers);
router.post("/",             addCaregiver);
router.delete("/:id",        removeCaregiver);
router.patch("/:id/toggle",  toggleCaregiver);
router.post("/:id/share",    generateShareLink);

export default router;
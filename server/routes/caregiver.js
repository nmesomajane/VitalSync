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
import jwt from "jsonwebtoken";

const router = express.Router();

router.use(authenticate);

router.get("/", authenticate, getCaregivers);
router.post("/", authenticate, addCaregiver);
router.delete("/:id", authenticate, removeCaregiver);
router.patch("/:id/toggle", authenticate, toggleCaregiver);
router.post("/:id/share", authenticate, generateShareLink);
router.get("/shared/:token", authenticate, getSharedVitals);





// POST /api/v1/share/generate-public
// generates a public share token — no caregiver required
router.post("/generate-public", authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user;

    const shareToken = jwt.sign(
      {
        patientId: userId,
        type: "public_share",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    res.status(200).json({
      success: true,
      data: {
        shareUrl: `https://vitalsync.app/share/${shareToken}`,
        token: shareToken,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate share link" });
  }
});


export default router;

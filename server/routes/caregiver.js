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


router.post("/generate-public", authenticate, async (req, res) => {
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
      shareUrl: `${process.env.CLIENT_URL}/share/${shareToken}`,

      token: shareToken,
      expiresAt: expiresAt.toISOString(),
    },
  });
});


export default router;

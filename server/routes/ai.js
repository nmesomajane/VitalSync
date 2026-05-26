import express from "express";
import { getAISuggestions, getVideoSuggestions, updateAIConsent} from "../controllers/ai.js";
import { authenticate } from "../middleware/authentication.js";

const router = express.Router();

router.use(authenticate);


router.post("/suggestions", getAISuggestions);

router.get("/videos", getVideoSuggestions);

router.put("/consent", updateAIConsent);
export default router;
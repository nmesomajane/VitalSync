import express from 'express';
import { recordVital   , getLatestVitals,  getVitalsHistory, getLatestECG} from '../controllers/vitals.js';
import { authenticate } from '../middleware/authentication.js';

const router = express.Router();


router.get('/latest', authenticate, getLatestVitals);
router.post('/reading', authenticate, recordVital);
router.get('/history', authenticate, getVitalsHistory);
router.get("/ecg/latest",  authenticate, getLatestECG);

export default router;
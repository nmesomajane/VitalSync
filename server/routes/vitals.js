import express from 'express';
import { recordVital   , getLatestVitals,  getVitalsHistory} from '../controllers/vitals.js';
import { authenticate } from '../middleware/authentication.js';

const router = express.Router();


router.get('/latest', authenticate, getLatestVitals);
router.post('/reading', authenticate, recordVital);
router.get('/history', authenticate, getVitalsHistory);


export default router;
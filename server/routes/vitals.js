import express from 'express';
import { recordVital   , getLatestVitals} from '../controllers/vitals.js';
import { authenticate } from '../middleware/authentication.js';

const router = express.Router();


router.get('/latest', authenticate, getLatestVitals);
router.post('/reading', authenticate, recordVital);


export default router;
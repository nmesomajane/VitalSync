import {addCaregiver, getCaregivers, removeCaregiver} from '../controllers/caregivers.js';
import express from 'express';

const router = express.Router();

router.post('/', addCaregiver);
router.get('/', getCaregivers);
router.delete('/:caregiverId', removeCaregiver);

export default router;
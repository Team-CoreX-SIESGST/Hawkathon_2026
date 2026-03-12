import express from 'express';
import {
    registerPatient,
    loginPatient,
    updatePatient,
    getPatientMe
} from '../controllers/patientController.js';
import { protectPatient } from '../middleware/roleAuth.js';

const router = express.Router();

router.post('/register', registerPatient);
router.post('/login', loginPatient);
router.put('/update', protectPatient, updatePatient);
router.get('/me', protectPatient, getPatientMe);

export default router;

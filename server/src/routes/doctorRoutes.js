import express from 'express';
import {
    registerDoctor,
    loginDoctor,
    updateDoctor,
    getDoctorMe
} from '../controllers/doctorController.js';
import { protectDoctor } from '../middleware/roleAuth.js';

const router = express.Router();

router.post('/register', registerDoctor);
router.post('/login', loginDoctor);
router.put('/update', protectDoctor, updateDoctor);
router.get('/me', protectDoctor, getDoctorMe);

export default router;

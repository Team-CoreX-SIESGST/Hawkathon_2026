import express from 'express';
import {
    registerPatient,
    loginPatient,
    updatePatient,
    getPatientMe,
    getPatientsNearby
} from '../controllers/patientController.js';
import { getPatientNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { protectPatient } from '../middleware/roleAuth.js';
import upload from '../middleware/upload.js';
import { ocrAbhaCard } from '../controllers/abhaController.js';
import { sendPatientOtp, verifyPatientOtp } from '../controllers/otpController.js';

const router = express.Router();

router.post('/register', registerPatient);
router.post('/login', loginPatient);
router.post('/otp/send', sendPatientOtp);
router.post('/otp/verify', verifyPatientOtp);
router.post('/abha/ocr', upload.single('abhaCard'), ocrAbhaCard);
router.put('/update', protectPatient, updatePatient);
router.get('/me', protectPatient, getPatientMe);
router.get('/nearby', protectPatient, getPatientsNearby);
router.get('/notifications', protectPatient, getPatientNotifications);
router.patch('/notifications/:id/read', protectPatient, markNotificationRead);

export default router;

import express from 'express';
import { getMedicineRecords } from '../controllers/sheetsController.js';

const router = express.Router();

// GET /api/sheets/medicine
router.get('/medicine', getMedicineRecords);

export default router;

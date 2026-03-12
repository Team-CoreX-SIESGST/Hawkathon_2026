import express from 'express';
import { getMedicineRecords } from '../controllers/sheetsController.js';
import { getMedicineInfo } from '../controllers/medicineInfoController.js';

const router = express.Router();

// GET /api/sheets/medicine?lat=X&lng=Y
router.get('/medicine', getMedicineRecords);

// GET /api/sheets/medicine/info?name=X&generic=Y
router.get('/medicine/info', getMedicineInfo);

export default router;

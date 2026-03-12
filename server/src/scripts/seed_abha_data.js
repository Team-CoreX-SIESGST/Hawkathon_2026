import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Patient from '../models/Patient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const nonFlagArg = args.find((arg) => !arg.startsWith('--'));
const dataPathArg = process.env.DATA_PATH || nonFlagArg;

const defaultDataPath = path.resolve(__dirname, '..', 'data', 'abha_dummy_dataset.json');
const dataPath = dataPathArg ? path.resolve(dataPathArg) : defaultDataPath;

const loadData = () => {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw);
};

const seed = async () => {
    await connectDB();

    const { patients = [] } = loadData();

    if (!Array.isArray(patients)) {
        throw new Error('Invalid dataset format. Expected { patients: [] }.');
    }

    const patientOps = patients
        .map((patient) => {
            const healthIdNumber = patient?.abha_profile?.healthIdNumber;
            if (!healthIdNumber) return null;
            return {
                updateOne: {
                    filter: { 'abha_profile.healthIdNumber': healthIdNumber },
                    update: {
                        $set: {
                            'abha_profile.abha_id_card': patient?.abha_profile?.abha_id_card || ''
                        }
                    },
                    upsert: false
                }
            };
        })
        .filter(Boolean);

    if (patientOps.length === 0) {
        console.log('No valid patient records found to update.');
        return;
    }

    const result = await Patient.bulkWrite(patientOps, { ordered: false });

    console.log(`Matched patients: ${result.matchedCount}`);
    console.log(`Modified patients: ${result.modifiedCount}`);
    console.log(`Upserted patients: ${result.upsertedCount}`);
};

seed()
    .catch((error) => {
        console.error('Seed failed:', error.message);
    })
    .finally(async () => {
        await mongoose.connection.close();
    });

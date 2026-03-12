import jwt from 'jsonwebtoken';
import PatientAccount from '../models/PatientAccount.js';
import Patient from '../models/Patient.js';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret_key_123', {
        expiresIn: '30d'
    });
};

const parseLocation = (locationCoordinates, latitude, longitude) => {
    const coords = locationCoordinates || { latitude, longitude };
    if (!coords) return null;
    const lat = Number(coords.latitude);
    const lng = Number(coords.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
};

const toRad = (value) => (value * Math.PI) / 180;
const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

// @desc    Register patient
// @route   POST /api/patient/register
// @access  Public
export const registerPatient = async (req, res) => {
    try {
        const { name, abhaId, phoneNumber, locationCoordinates, latitude, longitude } = req.body;
        const parsedLocation = parseLocation(locationCoordinates, latitude, longitude);

        if (!name || !abhaId || !phoneNumber || !parsedLocation) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existing = await PatientAccount.findOne({ abhaId });
        if (existing) {
            return res.status(400).json({ message: 'Patient already exists' });
        }

        const patient = await PatientAccount.create({
            name,
            abhaId,
            phoneNumber,
            locationCoordinates: parsedLocation
        });

        res.status(201).json({
            _id: patient._id,
            name: patient.name,
            abhaId: patient.abhaId,
            phoneNumber: patient.phoneNumber,
            locationCoordinates: patient.locationCoordinates,
            token: generateToken(patient._id, 'patient')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login patient (ABHA ID only)
// @route   POST /api/patient/login
// @access  Public
export const loginPatient = async (req, res) => {
    try {
        const { abhaId } = req.body;
        if (!abhaId) {
            return res.status(400).json({ message: 'ABHA ID is required' });
        }

        const patientData = await Patient.findOne({
            'abha_profile.healthIdNumber': abhaId
        });

        if (!patientData) {
            return res.status(401).json({ message: 'Invalid ABHA ID' });
        }

        let patientAccount = await PatientAccount.findOne({ abhaId });
        if (!patientAccount) {
            const coords = patientData.locationCoordinates;
            if (!coords?.latitude || !coords?.longitude) {
                return res.status(400).json({ message: 'Patient location not set' });
            }
            patientAccount = await PatientAccount.create({
                name: patientData?.abha_profile?.name || 'Patient',
                abhaId,
                phoneNumber: patientData?.abha_profile?.mobile || 'NA',
                locationCoordinates: coords
            });
        }

        res.json({
            _id: patientAccount._id,
            name: patientAccount.name,
            abhaId: patientAccount.abhaId,
            phoneNumber: patientAccount.phoneNumber,
            locationCoordinates: patientAccount.locationCoordinates,
            token: generateToken(patientAccount._id, 'patient')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update patient profile
// @route   PUT /api/patient/update
// @access  Private
export const updatePatient = async (req, res) => {
    try {
        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber;

        if (req.body.locationCoordinates || req.body.latitude || req.body.longitude) {
            const parsedLocation = parseLocation(
                req.body.locationCoordinates,
                req.body.latitude,
                req.body.longitude
            );
            if (!parsedLocation) {
                return res.status(400).json({ message: 'Invalid locationCoordinates' });
            }
            updates.locationCoordinates = parsedLocation;
        }

        const patient = await PatientAccount.findByIdAndUpdate(req.user._id, updates, {
            new: true
        });

        if (updates.locationCoordinates && patient?.abhaId) {
            await Patient.updateMany(
                {
                    $or: [
                        { 'abha_profile.healthId': patient.abhaId },
                        { 'abha_profile.healthIdNumber': patient.abhaId }
                    ]
                },
                { $set: { locationCoordinates: updates.locationCoordinates } }
            );
        }

        res.json({
            _id: patient._id,
            name: patient.name,
            abhaId: patient.abhaId,
            phoneNumber: patient.phoneNumber,
            locationCoordinates: patient.locationCoordinates
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current patient profile
// @route   GET /api/patient/me
// @access  Private
export const getPatientMe = async (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        abhaId: req.user.abhaId,
        phoneNumber: req.user.phoneNumber,
        locationCoordinates: req.user.locationCoordinates
    });
};

// @desc    Get patients near a coordinate
// @route   GET /api/patient/nearby?latitude=..&longitude=..&radiusKm=..
// @access  Private
export const getPatientsNearby = async (req, res) => {
    try {
        const latitude = Number(req.query.latitude);
        const longitude = Number(req.query.longitude);
        const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : 10;

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return res.status(400).json({ message: 'latitude and longitude are required' });
        }

        const origin = { latitude, longitude };
        const patients = await Patient.find({
            'locationCoordinates.latitude': { $ne: null },
            'locationCoordinates.longitude': { $ne: null }
        }).limit(500);

        const nearby = patients
            .map((patient) => {
                const coords = patient.locationCoordinates;
                if (!coords) return null;
                const distanceKm = haversineKm(origin, coords);
                return { patient, distanceKm };
            })
            .filter((item) => item && item.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .map((item) => ({
                _id: item.patient._id,
                name: item.patient?.abha_profile?.name,
                healthId: item.patient?.abha_profile?.healthId,
                healthIdNumber: item.patient?.abha_profile?.healthIdNumber,
                locationCoordinates: item.patient.locationCoordinates,
                distanceKm: Number(item.distanceKm.toFixed(2))
            }));

        res.json({ count: nearby.length, results: nearby });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

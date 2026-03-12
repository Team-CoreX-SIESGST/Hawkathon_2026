import jwt from 'jsonwebtoken';
import PatientAccount from '../models/PatientAccount.js';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret_key_123', {
        expiresIn: '30d'
    });
};

const parseLocation = (locationCoordinates) => {
    if (!locationCoordinates) return null;
    const { latitude, longitude } = locationCoordinates;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    return { latitude, longitude };
};

// @desc    Register patient
// @route   POST /api/patient/register
// @access  Public
export const registerPatient = async (req, res) => {
    try {
        const { name, abhaId, phoneNumber, locationCoordinates } = req.body;
        const parsedLocation = parseLocation(locationCoordinates);

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

        const patient = await PatientAccount.findOne({ abhaId });
        if (!patient) {
            return res.status(401).json({ message: 'Invalid ABHA ID' });
        }

        res.json({
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

// @desc    Update patient profile
// @route   PUT /api/patient/update
// @access  Private
export const updatePatient = async (req, res) => {
    try {
        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber;

        if (req.body.locationCoordinates) {
            const parsedLocation = parseLocation(req.body.locationCoordinates);
            if (!parsedLocation) {
                return res.status(400).json({ message: 'Invalid locationCoordinates' });
            }
            updates.locationCoordinates = parsedLocation;
        }

        const patient = await PatientAccount.findByIdAndUpdate(req.user._id, updates, {
            new: true
        });

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

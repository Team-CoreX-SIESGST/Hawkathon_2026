import jwt from 'jsonwebtoken';
import DoctorAccount from '../models/DoctorAccount.js';

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

// @desc    Register doctor
// @route   POST /api/doctor/register
// @access  Public
export const registerDoctor = async (req, res) => {
    try {
        const { name, username, password, hospitalName, locationCoordinates } = req.body;
        const parsedLocation = parseLocation(locationCoordinates);

        if (!name || !username || !password || !hospitalName || !parsedLocation) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existing = await DoctorAccount.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Doctor already exists' });
        }

        const doctor = await DoctorAccount.create({
            name,
            username,
            password,
            hospitalName,
            locationCoordinates: parsedLocation
        });

        res.status(201).json({
            _id: doctor._id,
            name: doctor.name,
            username: doctor.username,
            hospitalName: doctor.hospitalName,
            locationCoordinates: doctor.locationCoordinates,
            token: generateToken(doctor._id, 'doctor')
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login doctor
// @route   POST /api/doctor/login
// @access  Public
export const loginDoctor = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const doctor = await DoctorAccount.findOne({ username: username.toLowerCase() });
        if (doctor && (await doctor.matchPassword(password))) {
            return res.json({
                _id: doctor._id,
                name: doctor.name,
                username: doctor.username,
                hospitalName: doctor.hospitalName,
                locationCoordinates: doctor.locationCoordinates,
                token: generateToken(doctor._id, 'doctor')
            });
        }

        res.status(401).json({ message: 'Invalid username or password' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update doctor profile
// @route   PUT /api/doctor/update
// @access  Private
export const updateDoctor = async (req, res) => {
    try {
        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.hospitalName) updates.hospitalName = req.body.hospitalName;

        if (req.body.locationCoordinates) {
            const parsedLocation = parseLocation(req.body.locationCoordinates);
            if (!parsedLocation) {
                return res.status(400).json({ message: 'Invalid locationCoordinates' });
            }
            updates.locationCoordinates = parsedLocation;
        }

        const doctor = await DoctorAccount.findByIdAndUpdate(req.user._id, updates, {
            new: true
        });

        res.json({
            _id: doctor._id,
            name: doctor.name,
            username: doctor.username,
            hospitalName: doctor.hospitalName,
            locationCoordinates: doctor.locationCoordinates
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current doctor profile
// @route   GET /api/doctor/me
// @access  Private
export const getDoctorMe = async (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        hospitalName: req.user.hospitalName,
        locationCoordinates: req.user.locationCoordinates
    });
};

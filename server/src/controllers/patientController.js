import Patient from '../models/Patient.js';
import { signToken } from '../utils/jwt.js';

const generateToken = (id, role) => {
    return signToken({ id, role }, { expiresIn: '30d' });
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

        const existing = await Patient.findOne({
            'abha_profile.healthIdNumber': abhaId
        });
        if (existing) {
            return res.status(400).json({ message: 'Patient already exists' });
        }

        const patient = await Patient.create({
            abha_profile: {
                healthIdNumber: abhaId,
                name,
                mobile: phoneNumber
            },
            locationCoordinates: parsedLocation
        });

        res.status(201).json({
            _id: patient._id,
            name: patient?.abha_profile?.name,
            abhaId: patient?.abha_profile?.healthIdNumber,
            phoneNumber: patient?.abha_profile?.mobile,
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

        const patient = await Patient.findOne({
            'abha_profile.healthIdNumber': abhaId
        });

        if (!patient) {
            return res.status(401).json({ message: 'Invalid ABHA ID' });
        }
console.log('foiwehofhewo')
        res.json({
            _id: patient._id,
            name: patient?.abha_profile?.name,
            abhaId: patient?.abha_profile?.healthIdNumber,
            phoneNumber: patient?.abha_profile?.mobile,
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
        if (req.body.name) updates['abha_profile.name'] = req.body.name;
        if (req.body.phoneNumber) updates['abha_profile.mobile'] = req.body.phoneNumber;

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

        const patient = await Patient.findByIdAndUpdate(req.user._id, updates, {
            new: true
        });

        res.json({
            _id: patient._id,
            name: patient?.abha_profile?.name,
            abhaId: patient?.abha_profile?.healthIdNumber,
            phoneNumber: patient?.abha_profile?.mobile,
            locationCoordinates: patient.locationCoordinates
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current patient profile (rich view for mobile app)
// @route   GET /api/patient/me
// @access  Private
export const getPatientMe = async (req, res) => {
    try {
        const patient = req.user;
        const abha = patient?.abha_profile || {};
        const health = patient?.health_records || {};
        const address = patient?.address || {};
        const insurance = patient?.insurance || {};
        const asha = patient?.ashaWorker || {};

        const consultations = Array.isArray(patient?.consultations)
            ? patient.consultations
            : [];
        const recent = consultations.length > 0 ? consultations[0] : null;

        const fullAddressParts = [
            address.addressLine,
            address.village,
            address.subDistrict,
            address.district,
            address.state,
            address.pincode,
            address.country
        ].filter(Boolean);

        res.json({
            _id: patient._id,
            // Basic identifiers
            name: abha.firstName || abha.name || patient.name,
            abhaId: abha.healthIdNumber,
            healthId: abha.healthId,
            phoneNumber: abha.mobile,
            // Raw ABHA profile for richer client use
            abha_profile: abha,
            // Flattened health record fields used by the mobile app
            bloodGroup: health.bloodGroup || null,
            bmi: typeof health.bmi === 'number' ? health.bmi : null,
            allergies: Array.isArray(health.allergies)
                ? health.allergies.join(', ')
                : health.allergies || null,
            condition: Array.isArray(health.chronicConditions)
                ? health.chronicConditions.join(', ')
                : health.chronicConditions || null,
            // Insurance / policy
            policyNumber: insurance.policyNumber || null,
            // Local support / ASHA worker
            supportName: asha.name || null,
            supportRole: asha.village
                ? `ASHA Worker, ${asha.village}`
                : asha.name
                ? 'ASHA Worker'
                : null,
            // Human readable address line
            address: fullAddressParts.length ? fullAddressParts.join(', ') : null,
            // Recent consultation summary used by the profile screen
            recentConsultation: recent
                ? {
                      doctor: recent.doctorName,
                      specialty: recent.facility,
                      status: 'Completed',
                      diagnosis: Array.isArray(recent.diagnosis)
                          ? recent.diagnosis.join(', ')
                          : recent.diagnosis,
                      followUp: recent.followUpDate
                  }
                : null,
            // Location (used for nearby search)
            locationCoordinates: patient.locationCoordinates
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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

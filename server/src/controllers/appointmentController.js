import Appointment from '../models/Appointment.js';
import DoctorAccount from '../models/DoctorAccount.js';
import Notification from '../models/Notification.js';
import { analyzeUrgency, structureQuery } from '../utils/gemini.js';

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (Patient)
export const createAppointment = async (req, res) => {
    try {
        const {
            doctorId,
            problem,
            symptoms,
            description,
            preferredDate,
            preferredTime,
            appointmentType
        } = req.body;

        if (!doctorId || !problem || !preferredDate || !preferredTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const doctor = await DoctorAccount.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const aiResult = await analyzeUrgency({ symptoms, description, problem });

        const appointment = await Appointment.create({
            patient: req.user._id,
            doctor: doctor._id,
            appointmentType: appointmentType === 'VIDEO_CALL' ? 'VIDEO_CALL' : 'OFFLINE',
            problem,
            symptoms,
            description,
            preferredDate,
            preferredTime,
            urgencyScore: Number(aiResult?.urgencyScore || 0),
            aiSummary: aiResult?.summary || '',
            structuredQuery: aiResult?.structuredQuery || ''
        });

        if (appointment.appointmentType === 'VIDEO_CALL') {
            appointment.videoLink = `https://meet.jit.si/appointment-${appointment._id}`;
            await appointment.save();
        }

        await Notification.create({
            doctor: doctor._id,
            patient: req.user._id,
            appointment: appointment._id,
            message: `New ${appointment.appointmentType} appointment request from patient.`
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my appointments
// @route   GET /api/appointments/my
// @access  Private (Patient)
export const getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user._id })
            .populate('doctor', 'name username hospitalName locationCoordinates')
            .sort({ createdAt: -1 });

        res.json({ count: appointments.length, results: appointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (Patient)
export const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = 'CANCELLED';
        await appointment.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Use AI to structure complaint and urgency
// @route   POST /api/appointments/ai/structure
// @access  Private (Patient)
export const structureAppointment = async (req, res) => {
    try {
        const { problem, symptoms, description } = req.body;
        const ai = await structureQuery({ problem, symptoms, description });
        res.json({
            structuredQuery: ai?.structuredQuery || '',
            summary: ai?.summary || '',
            urgencyScore: Number(ai?.urgencyScore || 0)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

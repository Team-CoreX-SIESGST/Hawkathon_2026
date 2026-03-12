import Appointment from '../models/Appointment.js';
import DoctorAccount from '../models/DoctorAccount.js';

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (Patient)
export const createAppointment = async (req, res) => {
    try {
        const { doctorId, problem, symptoms, preferredDate, preferredTime } = req.body;

        if (!doctorId || !problem || !preferredDate || !preferredTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const doctor = await DoctorAccount.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const appointment = await Appointment.create({
            patient: req.user._id,
            doctor: doctor._id,
            problem,
            symptoms,
            preferredDate,
            preferredTime
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

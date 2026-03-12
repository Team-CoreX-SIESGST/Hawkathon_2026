import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PatientAccount',
            required: true
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DoctorAccount',
            required: true
        },
        problem: { type: String, required: true, trim: true },
        symptoms: { type: String, trim: true },
        preferredDate: { type: String, required: true, trim: true },
        preferredTime: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ['BOOKED', 'CANCELLED', 'COMPLETED'],
            default: 'BOOKED'
        }
    },
    { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

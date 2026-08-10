require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Appointment = require('./models/Appointment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully');
    })
    .catch((err) => {
        console.error('MongoDB Connection Error:', err.message);
    });

// Admin Authentication
const adminAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (authHeader === `Bearer ${process.env.ADMIN_SECRET}`) {
        next();
    } else {
        res.status(401).json({
            message: 'Unauthorized: Invalid Admin Token'
        });
    }
};

// Create Appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const {
            patientName,
            phone,
            email,
            preferredDate,
            preferredTime,
            concern
        } = req.body;

        if (
            !patientName ||
            !phone ||
            !preferredDate ||
            !preferredTime ||
            !concern
        ) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const dateObj = new Date(preferredDate);

        // Sunday check
        if (dateObj.getDay() === 0) {
            return res.status(400).json({
                message: 'Appointments cannot be scheduled on Sundays.'
            });
        }

        const newAppointment = new Appointment({
            patientName,
            phone,
            email,
            preferredDate,
            preferredTime,
            concern
        });

        await newAppointment.save();

        res.status(201).json({
            message: 'Appointment requested successfully',
            appointment: newAppointment
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Get all appointments - Admin
app.get('/api/appointments', adminAuth, async (req, res) => {
    try {
        const appointments = await Appointment
            .find({})
            .sort({ createdAt: -1 });

        res.status(200).json(appointments);

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Update appointment status - Admin
app.patch('/api/appointments/:id', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;

        const updated = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        res.status(200).json(updated);

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Delete appointment - Admin
app.delete('/api/appointments/:id', adminAuth, async (req, res) => {
    try {
        const deleted = await Appointment.findByIdAndDelete(
            req.params.id
        );

        if (!deleted) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            message: 'Appointment deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
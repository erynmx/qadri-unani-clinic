require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // NEW: Required for secure authentication
const Appointment = require('./models/Appointment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Allowing credentials and dynamic origin for better security between your specific Render links
app.use(cors({
    origin: '*', // In production, replace '*' with your specific frontend URLs
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.error('MongoDB Connection Error:', err));

// --- SECURE JWT AUTHENTICATION MIDDLEWARE ---
const adminAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
        req.user = user;
        next();
    });
};

// --- API ROUTES ---

// 1. Admin Login (NEW)
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check against secure environment variables
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'password123';

    if (username === validUsername && password === validPassword) {
        // Generate token valid for 12 hours
        const token = jwt.sign(
            { role: 'admin' }, 
            process.env.JWT_SECRET || 'fallback_secret_for_dev', 
            { expiresIn: '12h' }
        );
        res.status(200).json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// 2. Create a new appointment (Public POST)
app.post('/api/appointments', async (req, res) => {
    try {
        const { patientName, phone, email, preferredDate, preferredTime, concern } = req.body;
        
        if (!patientName || !phone || !preferredDate || !preferredTime || !concern) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const dateObj = new Date(preferredDate);
        if (dateObj.getDay() === 0) {
            return res.status(400).json({ message: 'Appointments cannot be scheduled on Sundays.' });
        }

        const newAppointment = new Appointment({
            patientName, phone, email, preferredDate, preferredTime, concern
        });

        await newAppointment.save();
        res.status(201).json({ message: 'Appointment requested successfully', appointment: newAppointment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 3. Get all appointments (Admin GET - Protected)
app.get('/api/appointments', adminAuth, async (req, res) => {
    try {
        const appointments = await Appointment.find({}).sort({ createdAt: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 4. Update appointment status (Admin PATCH - Protected)
app.patch('/api/appointments/:id', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!updated) return res.status(404).json({ message: 'Appointment not found' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 5. Delete appointment (Admin DELETE - Protected)
app.delete('/api/appointments/:id', adminAuth, async (req, res) => {
    try {
        const deleted = await Appointment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Appointment not found' });
        res.status(200).json({ message: 'Appointment Deleted Successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

const mongoose = require('mongoose');
const User = require('./models/User');

async function testStats() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seaal');
        
        const admin = await User.findOne({ email: 'admin@seaal.dz' });
        if (!admin) {
            console.log("Admin not found");
            return;
        }

        const token = generateToken(admin._id);
        console.log("Token:", token);

        // Fetch stats locally
        const res = await fetch('http://localhost:5000/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Stats Response:", data);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

testStats();

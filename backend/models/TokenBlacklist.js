const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // Supprime automatiquement les documents après 30 jours (la durée de vie du JWT)
    }
});

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

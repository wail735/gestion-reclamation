const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        trim: true
    },
    prenom: {
        type: String,
        required: [true, 'Le prénom est obligatoire'],
        trim: true
    },
    email: {
        type: String,
        required: [true, "L'adresse email est obligatoire"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Veuillez fournir un email valide"]
    },
    motDePasse: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire'],
        minlength: 6,
        select: false
    },
    adresse: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema, 'users'); // forcer la collection "users"

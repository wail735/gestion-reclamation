const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    type: {
        type: String,
        required: [true, 'Le type de réclamation est obligatoire'],
        enum: ['Retard d\'intervention', 'Fuite d\'eau', 'Problème de compteur', 'Facturation', 'Coupure d\'eau', 'Autre']
    },
    description: {
        type: String,
        required: [true, 'La description est obligatoire']
    },
    adresse: {
        type: String
    },
    statut: {
        type: String,
        enum: ['Nouveau', 'En cours', 'Résolu', 'Rejeté', 'En attente IA'],
        default: 'Nouveau'
    },
    reponseAdmin: {
        type: String
    },
    piecesJointes: [{
        type: String // URLs of attached files (if any)
    }],
    dateTraitement: {
        type: Date
    },
    clientRead: {
        type: Boolean,
        default: false
    },
    clientModified: {
        type: Boolean,
        default: false
    },
    aiConfidence: {
        type: Number
    },

}, {
    timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);

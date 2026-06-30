const Complaint = require('../models/Complaint');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getIo } = require('../socket');

// Normalize AI category to match Mongoose enum values
// The label encoder may return variants without accents (e.g., 'Probleme de compteur')
const CATEGORY_MAP = {
    "Coupure d'eau":           "Coupure d'eau",
    "Fuite d'eau":             "Fuite d'eau",
    'Facturation':             'Facturation',
    "Retard d'intervention":   "Retard d'intervention",
    'Probleme de compteur':    'Problème de compteur',
    'Problème de compteur':    'Problème de compteur',
    'Autre':                   'Autre',
};

const normalizeAICategory = (category) => {
    if (!category) return 'Autre';
    return CATEGORY_MAP[category] || CATEGORY_MAP[category.trim()] || 'Autre';
};

const asyncHandler = require('express-async-handler');

// @desc    Get all complaints (Admin only)
// @route   GET /api/complaints
// @access  Private/Admin
const getAllComplaints = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        let query = {};

        if (req.query.statut && req.query.statut !== 'Tous statuts') {
            query.statut = req.query.statut;
        }

        if (req.query.type && req.query.type !== 'Tous types') {
            query.type = req.query.type;
        }

        if (req.query.search) {
            const searchTerm = req.query.search.trim();
            
            const matchedUsers = await User.find({
                $or: [
                    { nom: { $regex: searchTerm, $options: 'i' } },
                    { prenom: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } }
                ]
            }).select('_id');
            const matchedUserIds = matchedUsers.map(u => u._id);

            query.$or = [
                { description: { $regex: searchTerm, $options: 'i' } },
                { adresse: { $regex: searchTerm, $options: 'i' } },
                { type: { $regex: searchTerm, $options: 'i' } },
                { client: { $in: matchedUserIds } }
            ];

            // Search by complaint ID
            if (searchTerm.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({ _id: searchTerm });
            } else if (searchTerm.length >= 6) {
                // Search by last 6 chars of ID
                query.$or.push({ _id: { $regex: searchTerm + '$', $options: 'i' } });
            }
        }

        let sortConfig = { createdAt: -1 };
        const sortKey = req.query.sortKey;
        const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
        
        // Client sort requires post-populate sorting
        if (sortKey && sortKey !== 'client') {
            sortConfig = { [sortKey]: sortDir };
        }

        const total = await Complaint.countDocuments(query);
        
        let complaintsQuery = Complaint.find(query)
            .populate('client', 'nom prenom email phone')
            .sort(sortConfig);

        if (req.query.page) {
             complaintsQuery = complaintsQuery.skip(startIndex).limit(limit);
        }
        
        let complaints = await complaintsQuery;

        // Post-populate sort by client name
        if (sortKey === 'client') {
            complaints = complaints.sort((a, b) => {
                const nameA = `${a.client?.nom || ''} ${a.client?.prenom || ''}`.toLowerCase();
                const nameB = `${b.client?.nom || ''} ${b.client?.prenom || ''}`.toLowerCase();
                return sortDir === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            });
        }

        res.json({
            data: complaints,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
});

// @desc    Get user's complaints
// @route   GET /api/complaints/mycomplaints
// @access  Private
const getMyComplaints = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        let query = { client: req.user._id };

        if (req.query.statut && req.query.statut !== 'Tous statuts') {
            query.statut = req.query.statut;
        }

        if (req.query.type && req.query.type !== 'Tous types') {
            query.type = req.query.type;
        }

        if (req.query.search) {
            query.$or = [
                { description: { $regex: req.query.search, $options: 'i' } },
                { adresse: { $regex: req.query.search, $options: 'i' } }
            ];
            if (req.query.search.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({ _id: req.query.search });
            }
        }

        let sortConfig = { createdAt: -1 };
        if (req.query.sortKey) {
            sortConfig = { [req.query.sortKey]: req.query.sortDir === 'asc' ? 1 : -1 };
        }

        const total = await Complaint.countDocuments(query);

        let complaintsQuery = Complaint.find(query).sort(sortConfig);
        
        if (req.query.page) {
             complaintsQuery = complaintsQuery.skip(startIndex).limit(limit);
        }

        const complaints = await complaintsQuery;

        res.json({
            data: complaints,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
});

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = asyncHandler(async (req, res) => {
        let { type, description, adresse } = req.body;

        if (!description) {
            return res.status(400).json({ message: 'Veuillez fournir une description' });
        }

        let aiConfidence = null;
        let statut = 'Nouveau';

        // Call FastAPI service if type is missing
        if (!type || type === 'undefined' || type.trim() === '') {
            try {
                const aiRes = await fetch('http://127.0.0.1:8000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description })
                });
                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    type = normalizeAICategory(aiData.category);
                    aiConfidence = aiData.probability;
                } else {
                    console.error('AI Service error status:', aiRes.status);
                    type = 'Autre';
                    statut = 'En attente IA'; // Fallback
                }
            } catch (aiErr) {
                console.error('AI Service fetch error:', aiErr.message);
                type = 'Autre';
                statut = 'En attente IA'; // Fallback
            }
        }

        let piecesJointesUrl = [];
        if (req.files && req.files.length > 0) {
            piecesJointesUrl = req.files.map(file => `/uploads/${file.filename}`);
        } else if (req.body.piecesJointes) {
            // Fallback pour compatibilité si envoyé en JSON
            piecesJointesUrl = Array.isArray(req.body.piecesJointes) ? req.body.piecesJointes : [req.body.piecesJointes];
        }

        const complaint = new Complaint({
            client: req.user._id,
            type,
            statut,
            description,
            adresse: adresse || req.user.adresse,
            piecesJointes: piecesJointesUrl,
            aiConfidence: aiConfidence
        });

        const createdComplaint = await complaint.save();

        // Emit socket event to admins
        try {
            getIo().to('admins').emit('new_complaint', {
                message: 'Nouvelle réclamation reçue',
                complaintId: createdComplaint._id,
                type: createdComplaint.type,
                clientId: createdComplaint.client
            });
        } catch (socketErr) {
            console.error('Socket.io emit error:', socketErr);
        }

        res.status(201).json(createdComplaint);
});

// @desc    Update complaint status (Process complaint)
// @route   PUT /api/complaints/:id/process
// @access  Private/Admin
const processComplaint = asyncHandler(async (req, res) => {
        const { statut, reponseAdmin, type } = req.body;

        // Build update object
        const updateFields = { clientRead: false };

        if (statut)       updateFields.statut       = statut;
        if (type)         updateFields.type          = type;
        if (reponseAdmin) {
            updateFields.reponseAdmin   = reponseAdmin;
            updateFields.dateTraitement = new Date();
        }

        const updatedComplaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).populate('client', 'email nom');

        if (!updatedComplaint) {
            return res.status(404).json({ message: 'Réclamation non trouvée' });
        }

        try {
            if (updatedComplaint.client && updatedComplaint.client.email) {
                await sendEmail({
                    email: updatedComplaint.client.email,
                    subject: 'Mise à jour de votre réclamation - Wakalati SEAAL',
                    template: 'complaint_update',
                    context: {
                        nom: updatedComplaint.client.nom,
                        id: updatedComplaint._id.toString().substring(18).toUpperCase(),
                        statut: updatedComplaint.statut,
                        reponseAdmin: updatedComplaint.reponseAdmin || 'Aucune réponse'
                    }
                });
            }
        } catch (err) {
            console.error("Erreur envoi email:", err.message);
        }

        res.json(updatedComplaint);
});


// @desc    Get a single complaint by ID (client sees only their own)
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = asyncHandler(async (req, res) => {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Réclamation non trouvée' });
        }

        // Sécurité : le client ne peut consulter que ses propres réclamations
        if (complaint.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        res.json(complaint);
});

// @desc    Mark a complaint as read by the client
// @route   PUT /api/complaints/:id/read
// @access  Private
const markComplaintAsRead = asyncHandler(async (req, res) => {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Réclamation non trouvée' });
        }

        // Vérification du propriétaire ou admin
        if (req.user.role === 'admin') {
            complaint.clientModified = false;
        } else {
            if (complaint.client.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Accès non autorisé' });
            }
            complaint.clientRead = true;
        }

        await complaint.save();

        res.json({ message: 'Réclamation marquée comme lue' });
});

// @desc    Update complaint details (Client only)
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = asyncHandler(async (req, res) => {
        const { type, description, adresse } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Réclamation non trouvée' });
        }

        // Vérifier si le client est bien le propriétaire
        if (complaint.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Vérifier si le statut permet la modification (seulement 'Nouveau')
        if (complaint.statut !== 'Nouveau') {
            return res.status(400).json({ message: 'Vous ne pouvez modifier que les réclamations nouvelles (non traitées)' });
        }

        if (adresse) complaint.adresse = adresse;

        if (description) {
            // Re-run AI categorization if description is new
            if (description !== complaint.description) {
                complaint.description = description;
                try {
                    const aiRes = await fetch('http://127.0.0.1:8000/predict', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ description })
                    });
                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        complaint.type = normalizeAICategory(aiData.category);
                        complaint.aiConfidence = aiData.probability;
                    }
                } catch (aiErr) {
                    console.error('AI Service fetch error on update:', aiErr.message);
                }
            }
        } else if (type) {
            complaint.type = type;
        }
        
        if (req.files && req.files.length > 0) {
            complaint.piecesJointes = req.files.map(file => `/uploads/${file.filename}`);
        } else if (req.body.piecesJointes) {
            complaint.piecesJointes = Array.isArray(req.body.piecesJointes) ? req.body.piecesJointes : [req.body.piecesJointes];
        }

        complaint.clientModified = true;

        const updatedComplaint = await complaint.save();
        res.json(updatedComplaint);
});

// @desc    Get similar complaints via AI
// @route   GET /api/complaints/:id/similar
// @access  Private/Admin
const getSimilarComplaints = asyncHandler(async (req, res) => {
        const sourceComplaint = await Complaint.findById(req.params.id);
        if (!sourceComplaint) {
            return res.status(404).json({ message: 'Réclamation introuvable' });
        }

        // Get recent complaints (last 30 days) excluding the source
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const candidates = await Complaint.find({
            _id: { $ne: req.params.id },
            createdAt: { $gte: thirtyDaysAgo }
        }).populate('client', 'nom prenom').limit(100);

        if (candidates.length === 0) {
            return res.json({ similar: [] });
        }

        const aiRes = await fetch('http://127.0.0.1:8000/similar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: sourceComplaint.description,
                candidates: candidates.map(c => ({ id: c._id.toString(), description: c.description })),
                threshold: 0.75
            })
        });

        if (!aiRes.ok) {
            return res.status(502).json({ message: 'Erreur du service IA' });
        }
        const aiData = await aiRes.json();

        // Enrich results with DB info including client name
        const enriched = aiData.similar.map(s => {
            const found = candidates.find(c => c._id.toString() === s.id);
            const clientName = found?.client
                ? `${found.client.nom} ${found.client.prenom}`.trim()
                : null;
            return { ...s, statut: found?.statut, type: found?.type, createdAt: found?.createdAt, clientName };
        });

        res.json({ similar: enriched });
});

// @desc    Retrain AI model using current complaints in DB
// @route   POST /api/complaints/retrain-ai
// @access  Private/Admin
const retrainAI = asyncHandler(async (req, res) => {
    // 1. Fetch all complaints from the database
    const complaints = await Complaint.find({}).select('description type');
    
    // 2. Filter complaints that have both description and type
    const trainingData = complaints
        .filter(c => c.description && c.type && c.type !== 'En attente IA')
        .map(c => ({
            description: c.description,
            category: c.type
        }));

    if (trainingData.length < 5) {
        return res.status(400).json({ message: "Pas assez de données pour ré-entraîner l'IA (minimum 5)." });
    }

    // 3. Send to Python FastAPI service
    try {
        const aiRes = await fetch('http://127.0.0.1:8000/retrain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: trainingData })
        });

        if (aiRes.ok) {
            const aiData = await aiRes.json();
            res.json({ message: "Modèle IA ré-entraîné avec succès", details: aiData });
        } else {
            const errorText = await aiRes.text();
            res.status(aiRes.status).json({ message: "Erreur lors du ré-entraînement de l'IA", details: errorText });
        }
    } catch (error) {
        console.error('AI Service retrain error:', error);
        res.status(500).json({ message: "Service IA injoignable pour le ré-entraînement" });
    }
});

module.exports = {
    getAllComplaints,
    getMyComplaints,
    createComplaint,
    processComplaint,
    getComplaintById,
    markComplaintAsRead,
    updateComplaint,
    getSimilarComplaints,
    retrainAI
};

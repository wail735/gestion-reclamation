const User = require('../models/User');
const bcrypt = require('bcrypt');

const asyncHandler = require('express-async-handler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
        const users = await User.find({}).select('-motDePasse').sort({ createdAt: -1 });
        res.json(users);
});

// @desc    Create user (admin action)
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
        const { nom, prenom, email, motDePasse, role, phone, adresse } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(motDePasse || 'Password123!', salt);

        const user = await User.create({
            nom,
            prenom,
            email,
            motDePasse: hashedPassword,
            role: role || 'user',
            phone: phone || '',
            adresse: adresse || '',
            isOwner: false,
            isActive: true // on ajoute ça si on veut gérer l'activation
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role
            });
        }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);

        if (user) {
            // Super Admin Protection: Nobody can modify the Super Admin via the dashboard
            if (user.email === 'admin@seaal.dz') {
                return res.status(403).json({ message: 'Action non autorisée : Le compte Super Administrateur ne peut pas être modifié.' });
            }

            // Admins can only modify role and status of other users
            if (req.body.role) {
                user.role = req.body.role;
            }

            if (req.body.isActive !== undefined) {
                user.isActive = req.body.isActive;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                nom: updatedUser.nom,
                prenom: updatedUser.prenom,
                email: updatedUser.email,
                role: updatedUser.role,
                isActive: updatedUser.isActive
            });
        } else {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Veuillez remplir tous les champs' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
        }

        // Get user with password field
        const user = await User.findById(req.user._id).select('+motDePasse');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.motDePasse);
        if (!isMatch) {
            return res.status(401).json({ message: 'Le mot de passe actuel est incorrect' });
        }

        // Hash new password and save
        const salt = await bcrypt.genSalt(10);
        user.motDePasse = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Mot de passe mis à jour avec succès' });
});

// @desc    Update own profile (self-service)
// @route   PUT /api/users/profile
// @access  Private
const updateMyProfile = asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        user.nom = req.body.nom || user.nom;
        user.prenom = req.body.prenom || user.prenom;
        user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
        user.adresse = req.body.adresse !== undefined ? req.body.adresse : user.adresse;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            nom: updatedUser.nom,
            prenom: updatedUser.prenom,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            adresse: updatedUser.adresse
        });
});

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    changePassword,
    updateMyProfile
};

const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const TokenBlacklist = require('../models/TokenBlacklist');

const asyncHandler = require('express-async-handler');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
        const { nom, prenom, email, motDePasse, confirmMotDePasse, adresse, phone } = req.body;

        // Basic validation
        if (!nom || !prenom || !email || !motDePasse) {
            return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
        }

        if (motDePasse !== confirmMotDePasse) {
            return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Un compte existe déjà avec cette adresse e-mail' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(motDePasse, salt);

        // Create user
        const user = await User.create({
            nom,
            prenom,
            email,
            motDePasse: hashedPassword,
            adresse: adresse || '',
            phone: phone || '',
            role: 'user'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
        const { email, motDePasse } = req.body;

        if (!email || !motDePasse) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        // Find user, explicitly select motDePasse
        const user = await User.findOne({ email }).select('+motDePasse');

        if (!user || !(await bcrypt.compare(motDePasse, user.motDePasse))) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Check if account is active
        if (user.isActive === false) {
            return res.status(403).json({ message: 'Votre compte a été désactivé. Veuillez contacter l\'administration.' });
        }

        res.json({
            _id: user._id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            adresse: user.adresse,
            token: generateToken(user._id)
        });
});

// @desc    Get all users (admin only in the future)
// @route   GET /api/auth/users
// @access  Public (to be secured later)
exports.getUsers = asyncHandler(async (req, res) => {
        const users = await User.find({});
        res.json(users);
});

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cette adresse email' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation de votre mot de passe.\n\nVeuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe :\n\n${resetUrl}\n\nCe lien expirera dans 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Réinitialisation de mot de passe - Wakalati SEAAL',
                template: 'reset_password',
                context: {
                    resetUrl
                }
            });
            res.json({ message: 'Email envoyé' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
        }
});

// @desc    Reset Password
// @route   POST /api/auth/resetpassword/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token invalide ou expiré' });
        }

        const salt = await bcrypt.genSalt(10);
        user.motDePasse = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({
            message: 'Mot de passe réinitialisé avec succès',
            token: generateToken(user._id)
        });
});

// @desc    Logout user / Blacklist token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    
    if (token) {
        await TokenBlacklist.create({ token });
    }
    
    res.json({ message: 'Déconnexion réussie' });
});

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

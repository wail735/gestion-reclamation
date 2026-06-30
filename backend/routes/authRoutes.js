const express = require('express');
const router = express.Router();
const { register, login, getUsers, forgotPassword, resetPassword, logout } = require('../controllers/authController');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limite chaque IP à 10 requêtes par 'window' (ici, par 15 minutes)
    message: { message: "Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard." }
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/users', getUsers);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.post('/resetpassword/:token', authLimiter, resetPassword);
router.post('/logout', protect, logout);

module.exports = router;

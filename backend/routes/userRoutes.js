const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    createUser,
    updateUser,
    changePassword,
    updateMyProfile
} = require('../controllers/userController');

router.route('/')
    .get(protect, admin, getAllUsers)
    .post(protect, admin, createUser);

// Must be before /:id to avoid treating these as id params
router.route('/change-password')
    .put(protect, changePassword);

router.route('/profile')
    .put(protect, updateMyProfile);

router.route('/:id')
    .put(protect, admin, updateUser);

module.exports = router;

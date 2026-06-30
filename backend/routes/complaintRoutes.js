const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validate, complaintSchema } = require('../middleware/validation');
const {
    getAllComplaints,
    getMyComplaints,
    createComplaint,
    processComplaint,
    getComplaintById,
    markComplaintAsRead,
    updateComplaint,
    getSimilarComplaints,
    retrainAI
} = require('../controllers/complaintController');

// Routes spécifiques en premier (avant les routes paramétrées)
router.route('/').get(protect, admin, getAllComplaints);
router.route('/').post(protect, upload.array('piecesJointes', 5), validate(complaintSchema), createComplaint);
router.route('/mycomplaints').get(protect, getMyComplaints);
router.route('/retrain-ai').post(protect, admin, retrainAI);

// Routes paramétrées ensuite
router.route('/:id/process').put(protect, admin, processComplaint);
router.route('/:id/read').put(protect, markComplaintAsRead);
router.route('/:id/similar').get(protect, admin, getSimilarComplaints);
router.route('/:id')
    .get(protect, getComplaintById)
    .put(protect, upload.array('piecesJointes', 5), updateComplaint);

module.exports = router;

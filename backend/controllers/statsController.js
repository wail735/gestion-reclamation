const Complaint = require('../models/Complaint');
const User = require('../models/User');

const asyncHandler = require('express-async-handler');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
        const totalComplaints = await Complaint.countDocuments();
        const openComplaints = await Complaint.countDocuments({ statut: { $in: ['Nouveau', 'En cours'] } });
        const resolvedComplaints = await Complaint.countDocuments({ statut: 'Résolu' });
        
        const resolutionRate = totalComplaints === 0 ? 0 : Math.round((resolvedComplaints / totalComplaints) * 100);
        const totalUsers = await User.countDocuments({ role: 'user' });

        const recentActivities = await Complaint.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('client', 'nom prenom');

        // Normalize type names to ensure only the main 5 + Autre appear
        const normalizeType = (type) => {
            if (!type) return 'Autre';
            const lowerType = type.toLowerCase().trim();
            if (lowerType.includes('retard')) return "Retard d'intervention";
            if (lowerType.includes('fuite')) return "Fuite d'eau";
            if (lowerType.includes('compteur')) return "Problème de compteur";
            if (lowerType.includes('factur')) return "Facturation";
            if (lowerType.includes('coupure')) return "Coupure d'eau";
            return "Autre";
        };

        const mappedActivities = recentActivities.map(comp => ({
            id: comp._id.toString(),
            user: comp.client ? `${comp.client.nom} ${comp.client.prenom}` : 'Inconnu',
            date: comp.createdAt,
            type: normalizeType(comp.type),
            statut: comp.statut
        }));

        // Calculer le temps moyen de réponse
        const processedComplaints = await Complaint.find({ dateTraitement: { $exists: true } });
        let avgResponseTime = "0h";
        
        if (processedComplaints.length > 0) {
            const totalDiff = processedComplaints.reduce((acc, comp) => {
                const diff = new Date(comp.dateTraitement) - new Date(comp.createdAt);
                return acc + diff;
            }, 0);
            
            const avgDiffMs = totalDiff / processedComplaints.length;
            const avgDiffHours = Math.round(avgDiffMs / (1000 * 60 * 60));
            
            if (avgDiffHours < 1) {
                avgResponseTime = "< 1h";
            } else if (avgDiffHours > 24) {
                const days = Math.floor(avgDiffHours / 24);
                avgResponseTime = `${days}j`;
            } else {
                avgResponseTime = `${avgDiffHours}h`;
            }
        } else {
            avgResponseTime = "N/A";
        }



        const typeAggregation = await Complaint.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        const typeMap = {};
        typeAggregation.forEach(item => {
            const norm = normalizeType(item._id);
            typeMap[norm] = (typeMap[norm] || 0) + item.count;
        });

        const complaintsByType = Object.keys(typeMap).map(key => ({
            name: key,
            value: typeMap[key]
        })).sort((a, b) => b.value - a.value);

        // Complaints by Month
        const complaintsByMonthAgg = await Complaint.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);
        
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        const complaintsByMonth = complaintsByMonthAgg.map(item => ({
            label: monthNames[item._id.month - 1],
            year: item._id.year,
            month: item._id.month,
            count: item.count
        }));

        // User Registrations by Day (All time) - Only clients/users
        const usersDayAgg = await User.aggregate([
            { $match: { role: 'user' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        const usersByDay = usersDayAgg.map(item => ({ date: item._id, count: item.count }));

        // Get all clients for the list view (match aggregation)
        const allUsersList = await User.find({ role: 'user' }, 'nom prenom email createdAt role').sort({ createdAt: -1 });

        res.json({
            totalUsers,
            openComplaints,
            resolutionRate,
            avgResponseTime,
            recentActivities: mappedActivities,
            complaintsByType,
            complaintsByMonth,
            usersByDay,
            allUsers: allUsersList
        });
});

module.exports = {
    getDashboardStats
};

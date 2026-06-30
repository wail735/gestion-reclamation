const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/seaal_db';

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

const run = async () => {
    try {
        await mongoose.connect(uri);
        console.log(`Connected to ${uri}`);
        
        const complaints = await Complaint.find();
        let updatedCount = 0;
        
        for (let c of complaints) {
            const normType = normalizeType(c.type);
            if (c.type !== normType) {
                console.log(`Updating type from "${c.type}" to "${normType}"`);
                await Complaint.updateOne({ _id: c._id }, { $set: { type: normType } }, { runValidators: false });
                updatedCount++;
            }
        }
        
        console.log(`Updated ${updatedCount} complaints.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();

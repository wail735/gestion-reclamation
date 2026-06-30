const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Complaint = require('./models/Complaint');

async function seedComplaints() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seaal');
        console.log('✅ Connecté à MongoDB');

        // Find the client user
        const client = await User.findOne({ email: 'client@seaal.dz' });
        if (!client) {
            console.log('⚠️  Utilisateur client@seaal.dz non trouvé. Lancez d\'abord create-client.js');
            return;
        }

        // Delete existing complaints
        await Complaint.deleteMany({});

        // Create some dummy complaints
        const dummyComplaints = [
            {
                client: client._id,
                type: 'Fuite d\'eau',
                description: 'Il y a une fuite d\'eau importante devant ma maison depuis ce matin.',
                adresse: '123 Rue de la Liberté, Alger',
                priorite: 'Haute',
                statut: 'Nouveau'
            },
            {
                client: client._id,
                type: 'Facturation',
                description: 'Le montant de ma dernière facture semble erroné, il est trois fois supérieur à la normale.',
                adresse: '123 Rue de la Liberté, Alger',
                priorite: 'Moyenne',
                statut: 'En cours',
                reponseAdmin: 'Nous sommes en train de vérifier votre compteur avec nos techniciens.'
            },
            {
                client: client._id,
                type: 'Qualité d\'eau',
                description: 'L\'eau a une couleur jaunâtre aujourd\'hui.',
                adresse: '123 Rue de la Liberté, Alger',
                priorite: 'Basse',
                statut: 'Résolu',
                reponseAdmin: 'Des travaux ont eu lieu sur le réseau. Laissez couler l\'eau pendant 5 minutes.',
                dateTraitement: new Date()
            }
        ];

        await Complaint.insertMany(dummyComplaints);
        console.log('✅ 3 réclamations de test créées avec succès !');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

seedComplaints();

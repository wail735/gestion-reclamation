/**
 * Script de création d'un utilisateur Client (User)
 * Usage: node create-client.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createClient() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seaal');
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Check if client already exists
        const existing = await usersCollection.findOne({ email: 'client@seaal.dz' });
        if (existing) {
            console.log('⚠️  Un utilisateur avec cet email existe déjà !');
            await mongoose.disconnect();
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Client1234', salt);

        const now = new Date();
        await usersCollection.insertOne({
            nom: 'Client',
            prenom: 'Test',
            email: 'client@seaal.dz',
            motDePasse: hashedPassword,
            adresse: 'Alger Centre',
            phone: '0555000000',
            role: 'user',
            isOwner: true,
            createdAt: now,
            updatedAt: now,
            __v: 0
        });

        console.log('✅ Utilisateur Client créé avec succès !');
        console.log('📧 Email     : client@seaal.dz');
        console.log('🔑 Mot de passe : Client1234');
        console.log('👤 Rôle      : user (client)');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

createClient();

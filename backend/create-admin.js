/**
 * Script de création d'un utilisateur Admin
 * Usage: node create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seaal');
        console.log('✅ Connecté à MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Check if admin already exists
        const existing = await usersCollection.findOne({ email: 'admin@seaal.dz' });
        if (existing) {
            console.log('⚠️  Un utilisateur avec cet email existe déjà !');
            await mongoose.disconnect();
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin1234', salt);

        const now = new Date();
        await usersCollection.insertOne({
            nom: 'Admin',
            prenom: 'Seaal',
            email: 'admin@seaal.dz',
            motDePasse: hashedPassword,
            adresse: 'Siège Social, Alger',
            phone: '',
            role: 'admin',
            isOwner: false,
            createdAt: now,
            updatedAt: now,
            __v: 0
        });

        console.log('✅ Utilisateur Admin créé avec succès !');
        console.log('📧 Email     : admin@seaal.dz');
        console.log('🔑 Mot de passe : Admin1234');
        console.log('👑 Rôle      : admin');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

createAdmin();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function resetAllPasswords() {
    try {
        await mongoose.connect('mongodb://localhost:27017/seaal');
        const User = require('./models/User');
        
        // Fetch all users, including the password field
        const users = await User.find({}, '+motDePasse');
        
        console.log("=== LISTE DES UTILISATEURS ET MOTS DE PASSE ===\n");
        
        for (let user of users) {
            console.log(`👤 Nom complet : ${user.prenom} ${user.nom}`);
            console.log(`📧 Email       : ${user.email}`);
            console.log(`👑 Rôle        : ${user.role}`);
            
            // L'administrateur garde son mot de passe
            if (user.email === 'admin@seaal.dz') {
                console.log(`🔑 Mot de passe : Admin1234`);
            } else {
                // Pour tous les autres, on force le mot de passe à "123456" pour vous faciliter les tests
                const salt = await bcrypt.genSalt(10);
                user.motDePasse = await bcrypt.hash('123456', salt);
                await user.save();
                console.log(`🔑 Mot de passe : 123456 (Réinitialisé pour les tests)`);
            }
            console.log('--------------------------------------------------');
        }
        
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

resetAllPasswords();

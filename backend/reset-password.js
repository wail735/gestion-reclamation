/**
 * Script de réinitialisation de mot de passe
 * Usage: node reset-password.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ============================================================
// ⚙️  MODIFIER CES VALEURS AVANT DE LANCER LE SCRIPT
const EMAIL_CIBLE = 'admin@seaal.dz';       // <-- Email de l'utilisateur
const NOUVEAU_MOT_DE_PASSE = 'Admin1234';   // <-- Nouveau mot de passe souhaité
// ============================================================

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/seaal');
        console.log('✅ Connecté à MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NOUVEAU_MOT_DE_PASSE, salt);

        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: EMAIL_CIBLE },
            { $set: { motDePasse: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            console.log(`❌ Aucun utilisateur trouvé avec l'email: ${EMAIL_CIBLE}`);
        } else {
            console.log(`✅ Mot de passe réinitialisé avec succès pour: ${EMAIL_CIBLE}`);
            console.log(`🔑 Nouveau mot de passe: ${NOUVEAU_MOT_DE_PASSE}`);
        }
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

resetPassword();

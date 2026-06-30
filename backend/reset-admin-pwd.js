const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function resetPassword() {
    try {
        await mongoose.connect('mongodb://localhost:27017/seaal');
        const User = require('./models/User');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin1234', salt);
        
        await User.updateOne(
            { email: 'admin@seaal.dz' },
            { $set: { motDePasse: hashedPassword } }
        );
        
        console.log('Mot de passe mis à jour avec succès pour admin@seaal.dz : Admin1234');
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

resetPassword();

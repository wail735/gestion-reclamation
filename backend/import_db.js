const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

mongoose.connect('mongodb://localhost:27017/seaal')
.then(async () => {
    console.log('Connexion à la base de données réussie pour importation...');
    
    const dataPath = path.join(__dirname, '..', 'database_export.json');
    if (!fs.existsSync(dataPath)) {
        console.error('Fichier database_export.json introuvable.');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    await User.deleteMany({});
    await Complaint.deleteMany({});
    
    if(data.users && data.users.length > 0) {
        await User.insertMany(data.users);
        console.log(`✅ ${data.users.length} utilisateurs importés.`);
    }
    
    if(data.complaints && data.complaints.length > 0) {
        await Complaint.insertMany(data.complaints);
        console.log(`✅ ${data.complaints.length} réclamations importées.`);
    }

    console.log('Importation terminée !');
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
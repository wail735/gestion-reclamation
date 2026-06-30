const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/seaal')
.then(async () => {
    console.log('Connexion à la base de données réussie pour exportation...');

    try {
        const users = await User.find({});
        const complaints = await Complaint.find({});

        const exportData = {
            users,
            complaints
        };

        const exportPath = path.join(__dirname, '..', 'database_export.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

        console.log(`✅ Base de données exportée avec succès vers : ${exportPath}`);
        
        // Also create an import script for the new PC
        const importScriptContent = `
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
        console.log(\`✅ \${data.users.length} utilisateurs importés.\`);
    }
    
    if(data.complaints && data.complaints.length > 0) {
        await Complaint.insertMany(data.complaints);
        console.log(\`✅ \${data.complaints.length} réclamations importées.\`);
    }

    console.log('Importation terminée !');
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
`;
        fs.writeFileSync(path.join(__dirname, 'import_db.js'), importScriptContent.trim());
        console.log("✅ Script d'importation (import_db.js) créé avec succès.");
        
        process.exit(0);
    } catch (err) {
        console.error("Erreur lors de l'exportation:", err);
        process.exit(1);
    }
})
.catch(err => {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
});

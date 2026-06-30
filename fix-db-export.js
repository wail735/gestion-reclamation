const fs = require('fs');

const dataPath = './database_export.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Default hash to use for users missing a password
const defaultHash = "$2a$10$P9r.rTeFvC5Y7E00BOkcM.2ljSOHyfrCDjVCPT27xt5iZ4PFI9/6y";

data.users = data.users.map(user => {
    // Map English fields to French fields
    if (user.firstName) {
        user.prenom = user.firstName;
        delete user.firstName;
    }
    if (user.lastName) {
        user.nom = user.lastName;
        delete user.lastName;
    }
    if (user.password) {
        user.motDePasse = user.password;
        delete user.password;
    }
    if (user.address) {
        user.adresse = user.address;
        delete user.address;
    }

    // Ensure required fields
    if (!user.motDePasse) {
        user.motDePasse = defaultHash;
    }
    if (!user.prenom) {
        user.prenom = "Utilisateur";
    }
    if (!user.nom) {
        user.nom = "Inconnu";
    }

    return user;
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('database_export.json fixed successfully.');

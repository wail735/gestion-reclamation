const cron = require('node-cron');
const Complaint = require('../models/Complaint');

const startCronJobs = () => {
    // Tâche planifiée pour s'exécuter tous les jours à 2h00 du matin ('0 2 * * *')
    cron.schedule('0 2 * * *', async () => {
        console.log('--- CRON JOB: Démarrage du réentraînement du modèle IA ---');
        try {
            // Récupérer toutes les réclamations pour réentraîner avec les données les plus récentes
            const complaints = await Complaint.find({}).select('description type');
            
            if (complaints.length < 5) {
                console.log('CRON: Pas assez de données pour réentraîner le modèle (minimum 5).');
                return;
            }

            const dataToTrain = complaints.map(c => ({
                description: c.description,
                category: c.type
            }));

            const response = await fetch('http://127.0.0.1:8000/retrain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: dataToTrain })
            });

            if (response.ok) {
                const resData = await response.json();
                console.log('CRON: Réentraînement réussi:', resData.message);
            } else {
                const errorData = await response.json();
                console.error('CRON: Erreur lors du réentraînement:', errorData.detail);
            }
        } catch (error) {
            console.error('CRON: Erreur CRON de réentraînement:', error.message);
        }
    });

    console.log('Tâches CRON initialisées (Réentraînement IA configuré à 2h00 du matin).');
};

module.exports = startCronJobs;

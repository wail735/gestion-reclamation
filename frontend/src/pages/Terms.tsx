import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-brand-darkBg text-brand-text font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-muted hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} /> Retour à l'accueil
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-card border border-brand-border rounded-3xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-green mb-8">
            Conditions d'utilisation
          </h1>
          <div className="space-y-6 text-brand-muted leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">1. Acceptation des conditions</h2>
              <p>En accédant et en utilisant la plateforme Wakalati, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces termes, veuillez ne pas utiliser nos services.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">2. Description du service</h2>
              <p>Wakalati est la plateforme officielle de SEAAL permettant aux abonnés de gérer leurs factures, soumettre des réclamations et suivre leurs requêtes en ligne.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">3. Compte utilisateur</h2>
              <p>Pour utiliser certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable du maintien de la confidentialité de vos informations de connexion et de toute activité effectuée sous votre compte.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">4. Utilisation acceptable</h2>
              <p>Il est interdit d'utiliser la plateforme d'une manière qui pourrait l'endommager, la désactiver, la surcharger ou nuire à d'autres utilisateurs. Les soumissions de fausses réclamations sont strictement interdites.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">5. Modifications</h2>
              <p>SEAAL se réserve le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur la plateforme.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;

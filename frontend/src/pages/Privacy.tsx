import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-brand-darkBg text-brand-text font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-muted hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} /> Retour à l'accueil
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-card border border-brand-border rounded-3xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-green mb-8">
            Politique de confidentialité
          </h1>
          <div className="space-y-6 text-brand-muted leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">1. Collecte des données</h2>
              <p>Nous collectons les informations que vous nous fournissez lors de votre inscription et de la soumission de vos réclamations (nom, adresse email, adresse du domicile, numéro de contrat).</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">2. Utilisation des informations</h2>
              <p>Vos données sont exclusivement utilisées par SEAAL pour traiter vos demandes, pour vous fournir une assistance client, et pour vous notifier de l'état de votre réseau local.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">3. Protection des données</h2>
              <p>Nous adoptons des mesures de sécurité appropriées pour protéger vos informations personnelles contre tout accès, altération, divulgation ou destruction non autorisés.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">4. Partage d'informations</h2>
              <p>A l'exception des autorités gouvernementales en cas de demande légale stricte, SEAAL ne vend, ni n'échange, ni ne transfère à des tiers vos informations personnellement identifiables.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">5. Vos droits</h2>
              <p>Conformément à la réglementation algorithmique en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles depuis votre espace client.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;

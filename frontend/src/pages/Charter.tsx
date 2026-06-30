import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Charter = () => {
  return (
    <div className="min-h-screen bg-brand-darkBg text-brand-text font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-muted hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} /> Retour à l'accueil
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-card border border-brand-border rounded-3xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-green mb-8">
            Charte des réclamations
          </h1>
          <div className="space-y-6 text-brand-muted leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">1. Engagement de SEAAL</h2>
              <p>SEAAL s'engage à traiter chaque réclamation de manière équitable, transparente et dans les meilleurs délais. Notre objectif est d'assurer une fourniture d'eau continue et de qualité.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">2. Délais de traitement</h2>
              <p>Nous nous efforçons d'accuser réception de votre réclamation sous 24h ouvrées. Un premier diagnostic vous sera communiqué dans un délai de 48h à l'issue de l'analyse par nos équipes techniques.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">3. Typologie des requêtes</h2>
              <p>Vous pouvez formuler des réclamations concernant : des fuites sur la voie publique, des coupures d'eau non programmées, des manques de pression, la qualité de l'eau ou des erreurs de facturation.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">4. Transparence</h2>
              <p>Le statut de votre réclamation sera actualisé en temps réel sur la plateforme Wakalati. Vous serez notifié par email ou SMS en cas de changement de statut critique (en cours de résolution, résolu).</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Charter;

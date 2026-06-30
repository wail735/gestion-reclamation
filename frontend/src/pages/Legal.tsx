import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Legal = () => {
  return (
    <div className="min-h-screen bg-brand-darkBg text-brand-text font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-muted hover:text-white transition-colors mb-8">
          <ArrowLeft size={20} /> Retour à l'accueil
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-card border border-brand-border rounded-3xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-green mb-8">
            Mentions légales
          </h1>
          <div className="space-y-6 text-brand-muted leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">Éditeur du site</h2>
              <p>Le site Wakalati est édité par :</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Société des Eaux et de l'Assainissement d'Alger (SEAAL)</li>
                <li>Société par actions au capital de 2 000 000 000 DZD</li>
                <li>Siège social : Route Nationale n°11, Belouizdad, Alger, Algérie</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">Directeur de la publication</h2>
              <p>Le Directeur Général de la SEAAL.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">Hébergement</h2>
              <p>La plateforme est gérée et hébergée sur les serveurs locaux certifiés de la SEAAL, garantissant la souveraineté complète des données relatives aux infrastructures critiques nationales.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">Droits d'auteur et Propriété intellectuelle</h2>
              <p>L'ensemble des éléments figurant sur le site Wakalati (textes, graphismes, logiciels, photographies, images, vidéos, logos, marques) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, totale ou partielle, est strictement interdite sans autorisation préalable.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-brand-text mb-3">Contact</h2>
              <p>Email : contact@seaal.dz</p>
              <p>Téléphone : Numéro Vert 1594</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Legal;

import React from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Shield } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const Profile = () => {
  const storedUser = useAuthStore(state => state.user);
  const nom = storedUser?.nom || 'Nom';
  const prenom = storedUser?.prenom || 'Prénom';
  const email = storedUser?.email || '';
  const adresse = storedUser?.adresse || '';
  const role = storedUser?.role === 'admin' ? 'Administrateur' : 'Client Premium';
  const initials = `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-10"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold text-white tracking-wide">Mon Profil</h2>
        <p className="text-brand-muted">Gérez vos informations personnelles et préférences de sécurité.</p>
      </motion.div>

      {/* Hero Header Card */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] overflow-hidden relative border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
        {/* Dynamic Background */}
        <div className="h-44 relative bg-gradient-to-r from-brand-blue to-brand-green overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3"></div>
        </div>
        
        <div className="px-8 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end relative -mt-16 sm:-mt-20 gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-brand-card bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white shadow-2xl relative overflow-hidden">
                <span className="text-4xl font-bold tracking-widest absolute">{initials}</span>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer backdrop-blur-sm">
                  <Camera size={28} className="text-white drop-shadow-md" />
                </div>
              </div>
            </div>
            
            <div className="text-center sm:text-left flex-1 mb-2">
              <h3 className="text-3xl font-bold text-white tracking-wide">{nom} {prenom}</h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-brand-green/20 border border-brand-green/30 text-brand-green font-medium text-sm shadow-inner">
                <Shield size={14} /> {role}
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-brand-green hover:bg-[#159640] text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(18,126,54,0.4)] flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-center"
            >
              <Save size={18} />
              Enregistrer
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Info Fields */}
      <motion.div variants={itemVariants} className="glass-card rounded-[2rem] border border-white/10 p-8 space-y-8 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="border-b border-white/10 pb-4 relative z-10">
          <h4 className="text-xl font-bold text-white tracking-wide">Informations Personnelles</h4>
          <p className="text-sm text-brand-muted mt-1">Vos données de base utilisées pour la facturation et le contact.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {[
            { label: 'Nom', icon: User, value: nom, type: 'text' },
            { label: 'Prénom', icon: User, value: prenom, type: 'text' },
            { label: 'Adresse Email', icon: Mail, value: email, type: 'email' },
            { label: 'Adresse de facturation', icon: MapPin, value: adresse, type: 'text' },
          ].map((field, idx) => (
            <motion.div variants={itemVariants} key={idx} className="space-y-2 group">
              <label className="text-sm font-semibold text-brand-muted flex items-center gap-2 ml-1 transition-colors group-focus-within:text-brand-green">
                <field.icon size={16} className="opacity-70" /> {field.label}
              </label>
              <div className="relative">
                <input 
                  type={field.type} 
                  defaultValue={field.value} 
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 focus:bg-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 shadow-inner block backdrop-blur-sm"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;

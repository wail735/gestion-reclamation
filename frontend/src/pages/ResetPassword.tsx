import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/auth`;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/resetpassword/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de la réinitialisation");
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClassBlue = `w-full py-3.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-blue/50 focus:bg-white/10 focus:ring-1 focus:ring-brand-blue/50 hover:bg-white/10 transition-all placeholder:text-brand-muted/70 shadow-inner ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'}`;
  const iconPosLg = isRTL ? 'absolute right-4 top-1/2 -translate-y-1/2' : 'absolute left-4 top-1/2 -translate-y-1/2';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-brand-darkBg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-green/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md glass-card rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 p-8 z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-widest drop-shadow-md">SEAAL<span className="text-brand-blue">.</span></h1>
          <h2 className="text-xl font-bold text-white mb-1">Nouveau mot de passe</h2>
          <p className="text-brand-muted text-sm">Veuillez entrer votre nouveau mot de passe.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {success ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle size={60} className="text-brand-green mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Mot de passe réinitialisé !</h3>
            <p className="text-brand-muted mb-6">Vous allez être redirigé vers la page de connexion...</p>
            <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
              Retour à l'accueil
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Lock className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-blue`} size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Nouveau mot de passe" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className={`${inputClassBlue} ${isRTL ? 'pl-11' : 'pr-11'}`} 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors`}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="relative group">
              <Lock className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-blue`} size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Confirmer le mot de passe" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className={`${inputClassBlue} ${isRTL ? 'pl-11' : 'pr-11'}`} 
                required 
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              disabled={loading} 
              className="w-full py-4 mt-4 bg-brand-blue text-white rounded-xl font-bold shadow-[0_0_20px_rgba(0,84,147,0.3)] flex justify-center items-center gap-2 group transition-all disabled:opacity-60"
            >
              {loading ? 'Réinitialisation...' : <><span className="hidden group-hover:inline-block mr-2"><CheckCircle size={18} /></span> Réinitialiser <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;

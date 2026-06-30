import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Save, Lock, User, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:5000/api';

const Settings = () => {
  const storeUser = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const [user, setUser] = useState<typeof storeUser>(storeUser || null);
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    adresse: user?.adresse || '',
    phone: user?.phone || ''
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const toggleShowPassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la modification du profil');
      }

      // Update store user
      const updatedUser = { ...user, ...data };
      updateUser(updatedUser);
      setUser(updatedUser);
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la modification du mot de passe');
      }

      setSuccess('Mot de passe mis à jour avec succès !');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-brand-text">Mon Profil</h2>
        <p className="text-brand-muted mt-1">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-green/20 border border-brand-green/50 text-brand-green px-6 py-3 rounded-xl flex items-center gap-3">
          <Shield size={20} /> {success}
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-3 rounded-xl flex items-center gap-3">
          <Shield size={20} /> {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="bg-brand-card rounded-2xl shadow-sm border border-brand-border overflow-hidden h-fit flex flex-col">
          <button 
            onClick={() => setActiveTab('profil')}
            className={`flex items-center gap-3 p-4 text-sm font-medium transition-colors border-l-2 ${activeTab === 'profil' ? 'bg-white/5 border-brand-blue text-white' : 'border-transparent text-brand-muted hover:bg-white/5 hover:text-white'}`}
          >
            <User size={18} /> Mon Profil
          </button>
          <button 
            onClick={() => setActiveTab('securite')}
            className={`flex items-center gap-3 p-4 text-sm font-medium transition-colors border-l-2 ${activeTab === 'securite' ? 'bg-white/5 border-brand-blue text-white' : 'border-transparent text-brand-muted hover:bg-white/5 hover:text-white'}`}
          >
            <Lock size={18} /> Sécurité
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-brand-card rounded-2xl shadow-sm border border-brand-border p-6 md:p-8">
          
          {activeTab === 'profil' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-bold text-3xl shadow-lg border border-white/20">
                  {user.nom?.charAt(0)}{user.prenom?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.nom} {user.prenom}</h3>
                  <p className="text-brand-muted">{user.role === 'admin' ? 'Administrateur' : 'Client SEAAL'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">Nom</label>
                  <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-3 bg-brand-darkBg border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue transition-colors" />
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">Prénom</label>
                  <input type="text" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="w-full px-4 py-3 bg-brand-darkBg border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue transition-colors" />
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">Adresse E-mail</label>
                  <input type="email" value={formData.email} disabled className="w-full px-4 py-3 bg-brand-darkBg/50 border border-brand-border/50 text-brand-muted rounded-xl cursor-not-allowed" />
                  <p className="text-xs text-brand-muted mt-1">L'email ne peut pas être modifié.</p>
                </div>
                {user.role !== 'admin' ? (
                  <>
                    <div>
                      <label className="block text-brand-muted text-sm font-medium mb-2">Numéro de téléphone</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-brand-darkBg border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue transition-colors" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-brand-muted text-sm font-medium mb-2">Adresse de facturation (Postale)</label>
                      <input type="text" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} className="w-full px-4 py-3 bg-brand-darkBg border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue transition-colors" />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-brand-muted text-sm font-medium mb-2">Rôle d'administration</label>
                    <input type="text" value="Super Administrateur" disabled className="w-full px-4 py-3 bg-brand-darkBg/50 border border-brand-border/50 text-brand-blue font-medium rounded-xl cursor-not-allowed" />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-brand-border">
                <button type="submit" disabled={loading} className="bg-brand-blue hover:bg-[#2da1ff] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-brand-blue/20">
                  <Save size={18} /> {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'securite' && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-6">Modifier le mot de passe</h3>
              
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">Mot de passe actuel</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.currentPassword ? "text" : "password"} 
                      required 
                      value={passwords.currentPassword} 
                      onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} 
                      className="w-full px-4 py-3 pr-12 bg-brand-darkBg border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue transition-colors" 
                    />
                    <button 
                      type="button" 
                      onClick={() => toggleShowPassword('currentPassword')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors"
                    >
                      {showPasswords.currentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.newPassword ? "text" : "password"} 
                      required 
                      minLength={6} 
                      value={passwords.newPassword} 
                      onChange={e => setPasswords({...passwords, newPassword: e.target.value})} 
                      className="w-full px-4 py-3 pr-12 bg-brand-darkBg border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue transition-colors" 
                    />
                    <button 
                      type="button" 
                      onClick={() => toggleShowPassword('newPassword')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors"
                    >
                      {showPasswords.newPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">Confirmer le nouveau mot de passe</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.confirmPassword ? "text" : "password"} 
                      required 
                      minLength={6} 
                      value={passwords.confirmPassword} 
                      onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} 
                      className="w-full px-4 py-3 pr-12 bg-brand-darkBg border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue transition-colors" 
                    />
                    <button 
                      type="button" 
                      onClick={() => toggleShowPassword('confirmPassword')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors"
                    >
                      {showPasswords.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex pt-4">
                <button type="submit" disabled={loading} className="bg-brand-blue hover:bg-[#2da1ff] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-brand-blue/20">
                  <Key size={18} /> {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </div>
            </form>
          )}



        </div>
      </div>
    </motion.div>
  );
};

export default Settings;

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Ban, CheckCircle, Crown, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:5000/api/users';

const AdminUsers = () => {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', motDePasse: '', role: 'user', isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = user?.token;
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        motDePasse: '',
        role: user.role,
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } else {
      setEditingUser(null);
      setFormData({ nom: '', prenom: '', email: '', motDePasse: '', role: 'user', isActive: true });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = user?.token;
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `${API_URL}/${editingUser._id}` : API_URL;
      
      const payload = { ...formData };
      if (editingUser && !payload.motDePasse) {
        delete payload.motDePasse;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchUsers();
        setShowModal(false);
        toast.success(editingUser ? t('users.toast_update_success', 'Utilisateur modifié avec succès') : t('users.toast_create_success', 'Utilisateur créé avec succès'));
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || t('users.toast_error', "Erreur lors de l'enregistrement"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleStatus = async (targetUser) => {
    const confirmMsg = targetUser.isActive === false ? t('users.confirm_activate', 'Voulez-vous vraiment activer ce compte ?') : t('users.confirm_deactivate', 'Voulez-vous vraiment désactiver ce compte ?');
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const token = user?.token; // ✅ token de l'admin connecté
      const res = await fetch(`${API_URL}/${targetUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: targetUser.isActive === false ? true : false })
      });
      if (res.ok) {
        fetchUsers();
        toast.success(targetUser.isActive === false ? t('users.toast_activated', 'Utilisateur activé avec succès') : t('users.toast_deactivated', 'Utilisateur désactivé avec succès'));
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || t('users.toast_error', "Erreur lors de la mise à jour du statut"));
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur réseau");
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const nameMatch = `${user.nom} ${user.prenom}`.toLowerCase().includes(search);
    const emailMatch = user.email.toLowerCase().includes(search);
    const roleMatch = user.role.toLowerCase().includes(search);
    return nameMatch || emailMatch || roleMatch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-text">{t('users.title')}</h2>
          <p className="text-brand-muted mt-1">{t('users.sub')}</p>
        </div>
        <button onClick={() => openModal()} className="bg-brand-green hover:bg-[#12722b] text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
          <Plus size={20} /> {t('users.add_btn')}
        </button>
      </div>

      <div className="bg-brand-card rounded-2xl shadow-sm border border-brand-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-brand-border bg-brand-darkBg flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
            <input 
              type="text" 
              placeholder={t('users.search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-brand-card border border-brand-border text-brand-text placeholder-brand-muted rounded-lg w-full focus:outline-none focus:border-brand-blue" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-brand-card text-brand-muted text-sm border-b border-brand-border">
                <th className="p-5 font-medium">{t('users.col_name')}</th>
                <th className="p-5 font-medium">{t('users.col_email')}</th>
                <th className="p-5 font-medium">{t('users.col_role')}</th>
                <th className="p-5 font-medium">{t('users.col_status')}</th>
                <th className="p-5 font-medium text-end">{t('users.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={5} className="p-5 text-center text-brand-muted">{t('dashboard.loading')}</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-5 text-center text-brand-muted">{t('users.no_users')}</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-brand-border/30">
                    <td className="p-5 font-medium text-brand-text">{user.nom} {user.prenom}</td>
                    <td className="p-5 text-brand-muted">{user.email}</td>
                    <td className="p-5">
                      <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1.5 w-fit ${user.email === 'admin@seaal.dz' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : (user.role === 'admin' ? 'bg-blue-800/40 text-blue-300 border border-blue-600/50' : 'bg-white/5 text-brand-muted border border-white/10')}`}>
                        {user.email === 'admin@seaal.dz' ? (
                          <><Crown size={13} strokeWidth={2.5} /> SUPER ADMIN</>
                        ) : (
                          user.role === 'admin' ? t('users.role_admin_badge', 'ADMIN') : t('users.role_user_badge', 'USER')
                        )}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${user.isActive !== false ? 'bg-green-800/40 text-green-400 border-green-600/50' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {user.isActive !== false ? <><CheckCircle size={12}/> {t('users.active')}</> : <><Ban size={12}/> {t('users.inactive')}</>}
                      </span>
                    </td>
                    <td className="p-5 text-end flex items-center justify-end gap-3">
                      {user.email !== 'admin@seaal.dz' ? (
                        <>
                          <button onClick={() => openModal(user)} className="text-brand-blue hover:text-white transition-colors" title="Modifier">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => toggleStatus(user)} className={`${user.isActive !== false ? 'text-red-400 hover:text-red-500' : 'text-brand-green hover:text-[#12722b]'} transition-colors`} title="Désactiver/Activer">
                            <Ban size={18} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-brand-muted font-medium bg-brand-border/30 px-2 py-1 rounded">{t('users.protected', 'Protégé')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-darkBg border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <h3 className="text-2xl font-bold text-white mb-6">{editingUser ? t('users.edit_title') : t('users.add_title')}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-brand-muted text-xs mb-1">{t('login.nom_placeholder', 'Nom')}</label>
                    <input disabled={!!editingUser} required type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className={`w-full px-3 py-2 bg-brand-card border border-brand-border text-white rounded-lg focus:outline-none focus:border-brand-blue ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-brand-muted text-xs mb-1">{t('login.prenom_placeholder', 'Prénom')}</label>
                    <input disabled={!!editingUser} required type="text" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className={`w-full px-3 py-2 bg-brand-card border border-brand-border text-white rounded-lg focus:outline-none focus:border-brand-blue ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-brand-muted text-xs mb-1">{t('login.email_placeholder', 'Email')}</label>
                  <input disabled={!!editingUser} required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full px-3 py-2 bg-brand-card border border-brand-border text-white rounded-lg focus:outline-none focus:border-brand-blue ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`} />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-brand-muted text-xs mb-1">{t('users.password', 'Mot de passe')}</label>
                    <div className="relative">
                      <input required type={showPassword ? "text" : "password"} value={formData.motDePasse} onChange={e => setFormData({...formData, motDePasse: e.target.value})} className="w-full pl-3 pr-10 py-2 bg-brand-card border border-brand-border text-white rounded-lg focus:outline-none focus:border-brand-blue" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-brand-muted text-xs mb-1">{t('users.col_role', 'Rôle')}</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 bg-brand-card border border-brand-border text-white rounded-lg focus:outline-none focus:border-brand-blue">
                    <option value="user">{t('users.role_client', 'Client (user)')}</option>
                    <option value="admin">{t('users.role_admin', 'Administrateur')}</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-brand-muted hover:text-white">{t('users.cancel_btn', 'Annuler')}</button>
                  <button type="submit" className="bg-brand-blue hover:bg-[#2da1ff] text-white px-5 py-2 rounded-xl font-medium">{t('users.save_btn', 'Enregistrer')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminUsers;

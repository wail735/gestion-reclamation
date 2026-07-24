import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../config';

const Topbar = () => {
  const { t } = useTranslation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Get user data from Zustand store
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const nom = user?.nom || t('topbar.user');
  const prenom = user?.prenom || '';
  const role = user?.role === 'admin' ? t('topbar.admin') : t('topbar.client');
  const initials = `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notifications as seen when the dropdown is opened
  const handleNotifToggle = () => {
    const opening = !isNotifOpen;
    setIsNotifOpen(opening);
    if (opening && notifications.length > 0) {
      // Save current timestamp as "last seen"
      localStorage.setItem('notifLastSeen', new Date().toISOString());
      setHasUnread(false);
    }
  };

  // Fetch Notifications dynamically
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = user?.token;
        if (!token) return;
        
        const endpoint = role === 'Administrateur' ? `${API_BASE_URL}/api/complaints` : `${API_BASE_URL}/api/complaints/mycomplaints`;
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          const complaintsData = Array.isArray(data) ? data : (data.data || []);
          let notifs = [];
          if (role === t('topbar.admin')) {
            const nouveaux = complaintsData.filter(c => c.statut === 'Nouveau' || c.clientModified);
            notifs = nouveaux.map(c => ({
              id: c._id,
              title: c.clientModified ? t('topbar.notif_modified_title', { defaultValue: 'Réclamation modifiée' }) : t('topbar.notif_new_title'),
              message: c.clientModified ? t('topbar.notif_modified_msg', { type: c.type, defaultValue: `La réclamation de type ${c.type} a été modifiée par le client` }) : t('topbar.notif_new_msg', { type: c.type }),
              date: c.clientModified ? (c.updatedAt || c.createdAt) : c.createdAt
            }));
          } else {
            const traites = complaintsData.filter(c => c.statut !== 'Nouveau' && !c.clientRead);
            notifs = traites.map(c => ({
              id: c._id,
              title: t('topbar.notif_update_title', { statut: c.statut }),
              message: t('topbar.notif_update_msg', { type: c.type }),
              date: c.dateTraitement || c.updatedAt || c.createdAt
            }));
          }
          // Sort by newest and keep top 5
          notifs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const topNotifs = notifs.slice(0, 5);
          setNotifications(topNotifs);

          // Check if there are notifications newer than the last time the user opened the panel
          const lastSeen = localStorage.getItem('notifLastSeen');
          if (topNotifs.length > 0) {
            if (!lastSeen) {
              // Never opened notifications before → show red badge
              setHasUnread(true);
            } else {
              const lastSeenDate = new Date(lastSeen);
              const hasNew = topNotifs.some(n => new Date(n.date) > lastSeenDate);
              setHasUnread(hasNew);
            }
          } else {
            setHasUnread(false);
          }
        }
      } catch (e) {
        console.error("Erreur de notifications", e);
      }
    };
    fetchNotifs();

    // Recharger les notifications quand le client lit une réclamation
    window.addEventListener('complaintRead', fetchNotifs);
    return () => window.removeEventListener('complaintRead', fetchNotifs);
  }, [role]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      navigate(`/dashboard/complaints?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-4 z-40 mx-4 lg:mx-10 rounded-2xl glass-card border border-white/10 h-20 flex items-center justify-between px-6 lg:px-8 transition-all lg:ml-[280px]">
      <div className="flex items-center gap-4 flex-1">
        
        {/* Animated Search Bar */}
        <motion.div 
          className={`relative group flex items-center transition-all duration-500 ease-out ${isSearchFocused ? 'w-full max-w-xl' : 'w-full max-w-sm'}`}
        >
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${isSearchFocused ? 'text-brand-green' : 'text-brand-muted group-hover:text-white'}`} size={20} />
          <input 
            type="text" 
            placeholder={t('topbar.search_placeholder')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl w-full focus:outline-none focus:bg-white/10 focus:border-brand-green/50 hover:bg-white/10 transition-all duration-300 placeholder:text-brand-muted/70 shadow-inner"
          />
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 -z-10 rounded-2xl bg-brand-green/20 blur-md pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6 ml-4">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <motion.button 
            onClick={handleNotifToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-2.5 transition-colors rounded-xl border ${isNotifOpen ? 'bg-white/10 border-white/20 text-white' : 'text-brand-muted hover:text-white hover:bg-white/10 border-transparent hover:border-white/10'}`}
          >
            <Bell size={22} className="drop-shadow-sm" />
            {hasUnread && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-card shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
            )}
          </motion.button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 bg-[#041a33] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
              >
                <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h4 className="font-bold text-white">{t('topbar.notifications')}</h4>
                  <span className="bg-brand-blue text-white text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>
                </div>
                <div className="max-h-80 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-brand-muted text-sm">
                      {t('topbar.no_notif')}
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications.map((notif, idx) => (
                        <div key={idx} onClick={() => { setIsNotifOpen(false); navigate('/dashboard/complaints', { state: { openComplaintId: notif.id } }); }} className="p-4 hover:bg-white/5 cursor-pointer transition-colors group">
                          <p className="text-brand-blue font-semibold text-sm group-hover:text-brand-green transition-colors">{notif.title}</p>
                          <p className="text-white text-sm mt-1">{notif.message}</p>
                          <p className="text-brand-muted text-xs mt-2">{new Date(notif.date).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-white/10 text-center bg-white/5">
                  <button onClick={() => { setIsNotifOpen(false); navigate('/dashboard/complaints'); }} className="text-sm font-medium text-brand-muted hover:text-white transition-colors">{t('topbar.see_all')}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-3 cursor-pointer p-1.5 pr-4 rounded-xl transition-all duration-300 border shadow-sm ${isProfileOpen ? 'bg-white/10 border-white/20' : 'hover:bg-white/5 border-transparent hover:border-white/10'}`}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-sm">
              <p className="font-bold text-white tracking-wide">{nom} {prenom}</p>
              <p className={`font-medium text-xs text-left ${role === 'Administrateur' ? 'text-brand-blue' : 'text-brand-green'}`}>{role}</p>
            </div>
            <motion.div animate={{ rotate: isProfileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} className="text-brand-muted hidden md:block" />
            </motion.div>
          </motion.div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-56 bg-[#041a33] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl"
              >
                <div className="px-4 py-3 border-b border-white/10 mb-2 md:hidden">
                  <p className="font-bold text-white">{nom} {prenom}</p>
                  <p className="text-xs text-brand-muted">{role}</p>
                </div>
                
                <button onClick={() => { setIsProfileOpen(false); navigate('/dashboard/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-brand-muted hover:text-white hover:bg-white/5 transition-colors">
                  <User size={16} /> {t('sidebar.profile')}
                </button>
                
                <div className="h-px bg-white/10 my-2 mx-3"></div>
                
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-colors">
                  <LogOut size={16} /> {t('sidebar.logout')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

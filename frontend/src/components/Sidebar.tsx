import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, User, Settings, LogOut, Globe, Users, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import logoImg from './logo.jpg';

const Sidebar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const role = user?.role || 'user';

  const clientMenuItems = [
    { icon: LayoutDashboard, label: t('dashboard.recent_client') === t('dashboard.recent_client') ? 'Tableau de bord' : '', labelKey: 'sidebar.stats', path: '/dashboard' },
    { icon: FileText, labelKey: 'sidebar.my_complaints', path: '/dashboard/complaints' },
  ];

  const adminMenuItems = [
    { icon: LayoutDashboard, labelKey: 'sidebar.stats', path: '/dashboard' },
    { icon: FileText, labelKey: 'sidebar.complaints', path: '/dashboard/complaints' },
    { icon: Users, labelKey: 'sidebar.users', path: '/dashboard/users' },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : clientMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 glass-card text-brand-text shadow-[10px_0_30px_-15px_rgba(0,0,0,0.5)] flex flex-col z-50 transition-all border-r border-white/10 rounded-r-[2rem] my-4 ml-4 h-[calc(100vh-2rem)] overflow-hidden">

      {/* Brand Header */}
      <div className="flex items-center justify-center gap-3 min-h-[80px] border-b border-white/10 bg-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/30 to-brand-green/30 blur-2xl opacity-50 pointer-events-none"></div>
        <img
          src={logoImg}
          alt="SEAAL Logo"
          className="w-8 h-8 rounded-lg object-cover z-10 relative"
        />
        <h1 className="text-2xl font-extrabold text-white tracking-widest drop-shadow-md z-10 relative">
          SEAAL<span className="text-brand-green">.</span>
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 relative no-scrollbar">
        <nav className="space-y-1.5 relative">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={index}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden font-medium ${isActive
                    ? 'text-white shadow-lg'
                    : 'text-brand-muted hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveBackground"
                          className="absolute inset-0 bg-gradient-to-r from-brand-green/90 to-brand-blue/90 border border-white/20 rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative z-10 flex items-center gap-3">
                      <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md text-white' : 'group-hover:scale-110 group-hover:text-brand-green'}`} />
                      <span className="tracking-wide relative z-10 drop-shadow-sm">{t(item.labelKey)}</span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 space-y-2 bg-white/5 backdrop-blur-md">
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) => `flex w-full items-center gap-3 px-4 py-3 shadow-[0_0_15px_rgba(0,0,0,0)] rounded-xl transition-all group font-medium relative overflow-hidden ${isActive ? 'bg-white/10 text-white' : 'text-brand-muted hover:text-white hover:bg-white/10'}`}
        >
          <User size={20} className="group-hover:scale-110 transition-transform duration-300" />
          <span className="tracking-wide text-sm">{t('sidebar.profile')}</span>
        </NavLink>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:text-white hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] rounded-xl transition-all group font-medium text-sm relative overflow-hidden">
          <LogOut size={20} className="group-hover:-translate-x-1 group-hover:scale-110 transition-transform duration-300" />
          <span className="tracking-wide">{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

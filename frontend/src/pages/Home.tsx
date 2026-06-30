import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Droplets, ArrowRight, Users, Activity, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const translateType = (type, t) => {
  const map = {
    'Retard d\'intervention': 'retard_intervention',
    'Fuite d\'eau': 'fuite_eau',
    'Problème de compteur': 'probleme_compteur',
    'Facturation': 'facturation',
    'Coupure d\'eau': 'coupure_eau'
  };
  return map[type] ? t(`types.${map[type]}`) : type;
};

const translateStatus = (status, t) => {
  const map = {
    'Nouveau': 'nouveau',
    'En cours': 'en_cours',
    'Résolu': 'resolu',
    'Rejeté': 'rejete'
  };
  return map[status] ? t(`statuts.${map[status]}`) : status;
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-brand-card rounded-2xl p-6 shadow-sm border border-brand-border flex items-center gap-4 hover:shadow-lg hover:shadow-brand-blue/5 transition-all"
  >
    <div className={`p-4 rounded-xl ${colorClass}`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-brand-muted text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-brand-text">{value}</h3>
    </div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  CLIENT DASHBOARD                                                    */
/* ------------------------------------------------------------------ */
const ClientDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      try {
        const token = user?.token;
        const res = await fetch('http://localhost:5000/api/complaints/mycomplaints', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const complaintsData = Array.isArray(data) ? data : (data.data || []);
          const sorted = complaintsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setComplaints(sorted);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyComplaints();
  }, []);

  const stats = {
    total: complaints.length,
    enCours: complaints.filter(c => c.statut === 'En cours').length,
    resolues: complaints.filter(c => c.statut === 'Résolu').length,
    actionRequise: complaints.filter(c => c.statut === 'Nouveau' || c.statut === 'Rejeté').length
  };

  const recentComplaints = complaints.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-brand-text">{t('dashboard.client_title')}, {user?.prenom || 'Client'}</h2>
        <p className="text-brand-muted mt-2">{t('dashboard.client_sub')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dashboard.total')} value={loading ? '...' : stats.total} icon={Droplets} colorClass="bg-brand-blue/20 text-brand-blue" />
        <StatCard title={t('dashboard.in_progress')} value={loading ? '...' : stats.enCours} icon={Clock} colorClass="bg-orange-500/20 text-orange-400" />
        <StatCard title={t('dashboard.resolved')} value={loading ? '...' : stats.resolues} icon={CheckCircle2} colorClass="bg-brand-green/20 text-brand-green" />
        <StatCard title={t('dashboard.action_required')} value={loading ? '...' : stats.actionRequise} icon={AlertCircle} colorClass="bg-red-500/20 text-red-400" />
      </div>

      <div className="bg-brand-card rounded-2xl shadow-sm border border-brand-border overflow-hidden mt-8">
        <div className="p-6 border-b border-brand-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-text">{t('dashboard.recent_client')}</h3>
          <Link to="/dashboard/complaints" className="text-brand-blue font-medium flex items-center gap-1 hover:gap-2 transition-all">
            {t('dashboard.see_all')} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-darkBg text-brand-muted text-sm">
                <th className="p-4 font-medium">{t('dashboard.col_id')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_date')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_type')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td className="p-4"><div className="h-4 bg-brand-border/50 rounded w-16 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-brand-border/50 rounded w-24 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-brand-border/50 rounded w-20 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-6 bg-brand-border/50 rounded-full w-20 animate-pulse"></div></td>
                  </tr>
                ))
              ) : recentComplaints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-brand-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-brand-border/20 flex items-center justify-center mb-3">
                        <Inbox size={24} className="text-brand-muted opacity-50" />
                      </div>
                      <p className="text-sm font-medium text-brand-text">{t('dashboard.no_recent')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentComplaints.map((item) => (
                  <tr key={item._id} className="hover:bg-brand-border/50 transition-colors">
                    <td className="p-4 font-medium text-brand-text">{item._id.substring(item._id.length - 6).toUpperCase()}</td>
                    <td className="p-4 text-brand-muted">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-brand-muted">{translateType(item.type, t)}</td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border whitespace-nowrap ${
                        item.statut === 'Résolu' ? 'bg-green-800/40 text-green-400 border-green-600/50' : 
                        item.statut === 'Rejeté' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                        item.statut === 'En cours' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                        'bg-blue-600/25 text-blue-300 border-blue-500/40'
                      }`}>
                        {translateStatus(item.statut, t)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  ADMIN DASHBOARD                                                     */
/* ------------------------------------------------------------------ */

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '12px' }}>
      {payload.map((entry, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: entry.color }} />
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const CHART_COLORS = {
  'Facturation':           '#22c55e',
  'Fuite d\'eau':          '#3b82f6',
  'Retard d\'intervention': '#eab308',
  'Problème de compteur':  '#f97316',
  'Coupure d\'eau':        '#a855f7',
};

const STATUS_COLORS = {
  'Nouveau':  '#22c55e',
  'Résolu':   '#3b82f6',
  'En cours': '#eab308',
  'Rejeté':   '#ef4444',
};

const AdminDashboard = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<{
    openComplaints: number;
    resolutionRate: number;
    totalUsers: number;
    avgResponseTime: string;
    recentActivities: any[];
    complaintsByType: any[];
    usersByMonth: any[];
    usersByDay: any[];
    complaintsByMonth?: any[];
    allUsers?: any[];
  }>({
    openComplaints: 0,
    resolutionRate: 0,
    totalUsers: 0,
    avgResponseTime: "0h",
    recentActivities: [],
    complaintsByType: [],
    usersByMonth: [],
    usersByDay: [],
    complaintsByMonth: [],
    allUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token;
        const res = await fetch('http://localhost:5000/api/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-brand-text">{t('dashboard.admin_title')}</h2>
        <p className="text-brand-muted mt-2">{t('dashboard.admin_sub')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dashboard.open_complaints')} value={loading ? "..." : stats.openComplaints} icon={AlertCircle} colorClass="bg-red-500/20 text-red-400" />
        <StatCard title={t('dashboard.resolution_rate')} value={loading ? "..." : `${stats.resolutionRate}%`} icon={Activity} colorClass="bg-brand-green/20 text-brand-green" />
        <StatCard title={t('dashboard.total_users')} value={loading ? "..." : stats.totalUsers} icon={Users} colorClass="bg-brand-blue/20 text-brand-blue" />
        <StatCard title={t('dashboard.avg_response')} value={loading ? "..." : stats.avgResponseTime} icon={Clock} colorClass="bg-orange-500/20 text-orange-400" />
      </div>

      {!loading && stats.usersByDay && stats.complaintsByType && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-brand-card rounded-2xl p-6 shadow-sm border border-brand-border">
              <h3 className="text-lg font-bold text-brand-text mb-4">{t('dashboard.chart_type')}</h3>
              <div className="h-72">
                {(() => {
                  const pieData = stats.complaintsByType.map(e => ({
                    name: translateType(e.name, t),
                    value: e.value,
                    _fill: CHART_COLORS[e.name] || '#64748b'
                  }));
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 15, right: 10, bottom: 5, left: 10 }}>
                        <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-type-${index}`} fill={entry._fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} />
                        <Legend content={renderLegend} />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            <div className="bg-brand-card rounded-2xl p-6 shadow-sm border border-brand-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-brand-text">{t('dashboard.chart_complaints_by_month')}</h3>
                <div className="flex justify-center items-center gap-4 bg-[#1e293b]/50 p-1.5 rounded-xl border border-brand-border/50">
                  <button onClick={() => setCurrentYear(y => y - 1)} className="w-8 h-8 flex justify-center items-center bg-[#334155]/80 hover:bg-[#475569] rounded-lg text-white transition-colors"><ChevronLeft size={16} strokeWidth={2.5} /></button>
                  <span className="font-bold text-sm text-white min-w-[40px] text-center">{currentYear}</span>
                  <button onClick={() => setCurrentYear(y => y + 1)} className="w-8 h-8 flex justify-center items-center bg-[#334155]/80 hover:bg-[#475569] rounded-lg text-white transition-colors"><ChevronRight size={16} strokeWidth={2.5} /></button>
                </div>
              </div>
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    Array.from({ length: 12 }).map((_, i) => {
                      const monthName = new Date(2000, i, 1).toLocaleString(i18n.language || 'fr', { month: 'short' });
                      const found = stats.complaintsByMonth?.find(d => d.year === currentYear && d.month === i + 1);
                      return { label: monthName, 'Réclamations': found ? found.count : 0 };
                    })
                  } margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b', dy: 5 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} interval={0} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b', dx: -5 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Bar dataKey="Réclamations" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-[#0b1121] rounded-2xl p-6 shadow-sm border border-brand-border flex flex-col justify-between">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-bold text-brand-muted tracking-wider uppercase mb-2">{t('dashboard.user_growth')}</p>
                <h2 className="text-5xl font-bold text-white mb-1">{stats.allUsers ? stats.allUsers.filter(u => new Date(u.createdAt).getFullYear() === currentMonth.getFullYear() && new Date(u.createdAt).getMonth() === currentMonth.getMonth()).length : 0}</h2>
                <p className="text-sm font-medium text-brand-blue/80">
                  +{stats.allUsers ? stats.allUsers.filter(u => new Date(u.createdAt).getFullYear() === currentMonth.getFullYear() && new Date(u.createdAt).getMonth() === currentMonth.getMonth()).length : 0} {t('dashboard.registered_in')} {currentMonth.toLocaleDateString(i18n.language || 'fr', { month: 'long' })}
                </p>
              </div>
              <div className="flex justify-center items-center gap-4 bg-[#1e293b]/50 p-1.5 rounded-xl border border-brand-border/50">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-8 h-8 flex justify-center items-center bg-[#334155]/80 hover:bg-[#475569] rounded-lg text-white transition-colors"><ChevronLeft size={16} strokeWidth={2.5} /></button>
                <span className="font-bold text-sm text-white min-w-[80px] text-center capitalize">
                  {currentMonth.toLocaleDateString(i18n.language || 'fr', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-8 h-8 flex justify-center items-center bg-[#334155]/80 hover:bg-[#475569] rounded-lg text-white transition-colors"><ChevronRight size={16} strokeWidth={2.5} /></button>
              </div>
            </div>

            {/* Graph */}
            <div className="h-40 mt-4 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayData = stats.usersByDay?.find(d => d.date === dateStr);
                    return { name: day.toString(), value: dayData ? dayData.count : 0 };
                  })} 
                  margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsersNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b', dy: 5 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} minTickGap={15} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b', dx: -5 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} contentStyle={{ backgroundColor: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUsersNew)" 
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, style: { filter: 'drop-shadow(0px 0px 6px rgba(59,130,246,0.8))' } }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* List */}
            <div className="mt-4 pt-4 border-t border-brand-border/50">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[11px] font-bold text-brand-muted tracking-wider uppercase">{t('dashboard.registered_in')} {currentMonth.toLocaleDateString(i18n.language || 'fr', { month: 'long', year: 'numeric' })}</p>
                <div className="w-5 h-5 rounded-full bg-[#1e293b] flex justify-center items-center text-[10px] font-bold text-brand-blue border border-[#334155]">
                  {stats.allUsers ? stats.allUsers.filter(u => new Date(u.createdAt).getFullYear() === currentMonth.getFullYear() && new Date(u.createdAt).getMonth() === currentMonth.getMonth()).length : 0}
                </div>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent">
                {(() => {
                  if (!stats.allUsers) return null;
                  const monthUsers = stats.allUsers.filter(u => new Date(u.createdAt).getFullYear() === currentMonth.getFullYear() && new Date(u.createdAt).getMonth() === currentMonth.getMonth()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  if (monthUsers.length === 0) {
                    return <p className="text-sm text-center text-brand-muted py-6">{t('dashboard.no_users_month')}</p>;
                  }
                  return monthUsers.map(u => (
                    <div key={u._id} className="flex justify-between items-center bg-[#1e293b]/30 p-3 rounded-xl border border-brand-border/40 hover:bg-[#1e293b]/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-blue/20 text-brand-blue flex justify-center items-center text-xs font-bold border border-brand-blue/30 uppercase">
                          {u.nom?.[0]}{u.prenom?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white capitalize">{u.nom} {u.prenom}</p>
                          <p className="text-[11px] text-brand-muted">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-brand-muted">{String(new Date(u.createdAt).getDate()).padStart(2, '0')}/{String(new Date(u.createdAt).getMonth() + 1).padStart(2, '0')}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-brand-card rounded-2xl shadow-sm border border-brand-border overflow-hidden">
        <div className="p-6 border-b border-brand-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-text">{t('dashboard.recent_admin')}</h3>
          <Link to="/dashboard/complaints" className="text-brand-blue font-medium flex items-center gap-1 hover:gap-2 transition-all">
            {t('dashboard.manage')} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-darkBg text-brand-muted text-sm">
                <th className="p-4 font-medium">{t('dashboard.col_id')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_client')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_date')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_type')}</th>
                <th className="p-4 font-medium">{t('dashboard.col_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`skeleton-admin-${i}`}>
                    <td className="p-4"><div className="h-4 bg-brand-border/50 rounded w-16 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-brand-border/50 rounded w-28 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-brand-border/50 rounded w-24 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-brand-border/50 rounded w-20 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-6 bg-brand-border/50 rounded-full w-20 animate-pulse"></div></td>
                  </tr>
                ))
              ) : stats.recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-brand-border/20 flex items-center justify-center mb-3">
                        <Inbox size={24} className="text-brand-muted opacity-50" />
                      </div>
                      <p className="text-sm font-medium text-brand-text">{t('dashboard.no_recent')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                stats.recentActivities.map((item, idx) => (
                  <tr key={idx} className="hover:bg-brand-border/50 transition-colors">
                    <td className="p-4 font-medium text-brand-text">{item.id.substring(item.id.length - 6).toUpperCase()}</td>
                    <td className="p-4 font-medium text-brand-text">{item.user}</td>
                    <td className="p-4 text-brand-muted">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="p-4 text-brand-muted">{translateType(item.type, t)}</td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                        item.statut === 'Résolu' ? 'bg-green-800/40 text-green-400 border-green-600/50' : 
                        item.statut === 'Nouveau' ? 'bg-blue-600/25 text-blue-300 border-blue-500/40' :
                        item.statut === 'Rejeté' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                        'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                      }`}>{translateStatus(item.statut, t)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  ROOT                                                                */
/* ------------------------------------------------------------------ */
const Home = () => {
  const user = useAuthStore(state => state.user);
  const role = user?.role || 'user';

  if (role === 'admin') {
    return <AdminDashboard user={user} />;
  }

  return <ClientDashboard user={user} />;
};

export default Home;

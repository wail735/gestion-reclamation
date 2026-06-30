import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Home, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuthStore } from '../store/authStore';
import AddressAutocomplete from '../components/AddressAutocomplete';

const API_URL = 'http://localhost:5000/api/auth';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const loginAction = useAuthStore(state => state.login);
  const isRTL = i18n.language === 'ar';

  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('register') !== 'true');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', motDePasse: '' });
  const [registerData, setRegisterData] = useState({
    nom: '', prenom: '', email: '', motDePasse: '', confirmMotDePasse: '', adresse: '', phone: ''
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backendEmailError, setBackendEmailError] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur de connexion');
      loginAction(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldErrors = React.useMemo(() => {
    const errors: Record<string, string> = {};

    const nameRegex = /^[A-Za-zÀ-ÿ\s'-]{2,}$/;
    if (registerData.nom && !nameRegex.test(registerData.nom)) {
      errors.nom = t('login.error_invalid_name');
    }
    if (registerData.prenom && !nameRegex.test(registerData.prenom)) {
      errors.prenom = t('login.error_invalid_name');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (registerData.email && !emailRegex.test(registerData.email)) {
      errors.email = t('login.error_email_format');
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (registerData.motDePasse && !passwordRegex.test(registerData.motDePasse)) {
      errors.motDePasse = t('login.error_password_strength');
    }

    if (registerData.confirmMotDePasse && registerData.motDePasse !== registerData.confirmMotDePasse) {
      errors.confirmMotDePasse = t('login.error_password_mismatch');
    }

    if (registerData.phone && registerData.phone !== '+213') {
      const phone = registerData.phone;
      if (!phone.startsWith('+213')) {
        errors.phone = t('login.error_phone_format');
      } else if (phone.length > 4 && !['5', '6', '7'].includes(phone[4])) {
        errors.phone = t('login.error_phone_format');
      } else if (phone.length > 13) {
        errors.phone = t('login.error_phone_format');
      } else if (phone.length > 4 && !/^\+213[5-7]\d*$/.test(phone)) {
        errors.phone = t('login.error_phone_format');
      }
    }

    if (registerData.adresse && registerData.adresse.length > 150) {
      errors.adresse = t('login.error_address_length');
    }

    return errors;
  }, [registerData, t]);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de la création du compte");
      loginAction(data);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('e-mail') || msg.includes('email')) {
        setBackendEmailError(t('login.error_email_exists'));
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_URL}/forgotpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de la demande");
      alert(data.message || "Un email de réinitialisation vous a été envoyé.");
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err) {
      alert(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const inputClass = `w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-green/50 focus:bg-white/10 focus:ring-1 focus:ring-brand-green/50 hover:bg-white/10 transition-all placeholder:text-brand-muted/70 text-sm shadow-inner ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'}`;
  const inputClassBlue = `w-full py-3.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-blue/50 focus:bg-white/10 focus:ring-1 focus:ring-brand-blue/50 hover:bg-white/10 transition-all placeholder:text-brand-muted/70 shadow-inner ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'}`;
  const inputSmClass = `w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/50 hover:bg-white/10 transition-all placeholder:text-brand-muted/70 text-sm shadow-inner ${isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'}`;

  const iconPos = isRTL
    ? 'absolute right-3 top-1/2 -translate-y-1/2'
    : 'absolute left-3 top-1/2 -translate-y-1/2';
  const iconPosLg = isRTL
    ? 'absolute right-4 top-1/2 -translate-y-1/2'
    : 'absolute left-4 top-1/2 -translate-y-1/2';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="min-h-screen bg-brand-darkBg bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-darkBg via-brand-darkBg to-[#011429] flex flex-col justify-center items-center p-4 relative overflow-hidden"
    >
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-green/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`absolute top-8 z-50 ${isRTL ? 'right-8' : 'left-8'}`}>
        <Link to="/" className="flex items-center gap-2 text-brand-muted hover:text-white font-medium transition-colors bg-white/5 py-2 px-4 rounded-full border border-white/10 backdrop-blur-md">
          <Home size={18} /> {t('login.back')}
        </Link>
      </motion.div>

      {/* Language switcher */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`absolute top-8 z-50 ${isRTL ? 'left-8' : 'right-8'}`}>
        <LanguageSwitcher />
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-3 rounded-xl backdrop-blur-md text-sm max-w-sm text-center"
          >
            ⚠️ {error}
            {error.toLowerCase().includes('désactivé') && (
              <div className="mt-2 pt-2 border-t border-red-500/30">
                <a href="mailto:admin@seaal.dz" className="text-brand-blue underline hover:text-[#2da1ff] font-medium">
                  {t('login.contact_admin')}
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop Sliding Layout ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl glass-card h-[680px] relative overflow-hidden hidden md:block z-10 rounded-[2rem] border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Sign Up Form (Left) */}
        <div className="absolute top-0 left-0 w-1/2 h-full p-10 flex flex-col justify-center items-center">
          <div className="text-center mb-5 w-full">
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-wide">{t('login.register_title')}</h2>
            <p className="text-brand-muted">{t('login.register_sub')}</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-3 w-full max-w-[360px] overflow-y-auto pr-2 pb-4 no-scrollbar" style={{ maxHeight: '80%' }}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <div className="relative group">
                  <User className={`${iconPos} text-brand-muted transition-colors group-focus-within:text-brand-green`} size={16} />
                  <input type="text" placeholder={t('login.nom_placeholder')} value={registerData.nom} onChange={e => setRegisterData({ ...registerData, nom: e.target.value })} className={`${inputSmClass} ${fieldErrors.nom ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`} required autoComplete="off" />
                </div>
                {fieldErrors.nom && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.nom}</span>}
              </div>
              <div className="flex flex-col">
                <div className="relative group">
                  <User className={`${iconPos} text-brand-muted transition-colors group-focus-within:text-brand-green`} size={16} />
                  <input type="text" placeholder={t('login.prenom_placeholder')} value={registerData.prenom} onChange={e => setRegisterData({ ...registerData, prenom: e.target.value })} className={`${inputSmClass} ${fieldErrors.prenom ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`} required autoComplete="off" />
                </div>
                {fieldErrors.prenom && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.prenom}</span>}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="relative group">
                <Phone className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-green`} size={16} />
                <input type="tel" placeholder={t('login.phone_placeholder')} value={registerData.phone} onFocus={() => !registerData.phone && setRegisterData({ ...registerData, phone: '+213' })} onChange={e => setRegisterData({ ...registerData, phone: e.target.value })} className={`${inputClass} ${fieldErrors.phone ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`} autoComplete="off" minLength={13} maxLength={13} pattern="^\+213[5-7]\d{8}$" />
              </div>
              {fieldErrors.phone && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.phone}</span>}
            </div>

            <div className="flex flex-col">
              <div className="relative group">
                <Mail className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-green`} size={16} />
                <input type="email" placeholder={t('login.email_placeholder')} value={registerData.email} onChange={e => { setRegisterData({ ...registerData, email: e.target.value }); setBackendEmailError(''); }} className={`${inputClass} ${(fieldErrors.email || backendEmailError) ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`} required autoComplete="off" />
              </div>
              {(fieldErrors.email || backendEmailError) && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.email || backendEmailError}</span>}
            </div>

            <div className="flex flex-col">
              <div className="relative group">
                <AddressAutocomplete 
                  value={registerData.adresse} 
                  onChange={(val) => setRegisterData({ ...registerData, adresse: val })} 
                  placeholder={t('login.address_placeholder')} 
                  inputClassName={`${inputClass} ${fieldErrors.adresse ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`}
                />
              </div>
              {fieldErrors.adresse && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.adresse}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <div className="relative group">
                  <Lock className={`${iconPos} text-brand-muted transition-colors group-focus-within:text-brand-green`} size={16} />
                  <input type={showRegisterPassword ? "text" : "password"} placeholder={t('login.password_placeholder')} value={registerData.motDePasse} onChange={e => setRegisterData({ ...registerData, motDePasse: e.target.value })} className={`${inputSmClass} ${isRTL ? 'pl-9' : 'pr-9'} ${fieldErrors.motDePasse ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`} required autoComplete="new-password" />
                  <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors`}>
                    {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.motDePasse && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium leading-tight">{fieldErrors.motDePasse}</span>}
              </div>
              <div className="flex flex-col">
                <div className="relative group">
                  <Lock className={`${iconPos} text-brand-muted transition-colors group-focus-within:text-brand-green`} size={16} />
                  <input type={showConfirmPassword ? "text" : "password"} placeholder={t('login.confirm_placeholder')} value={registerData.confirmMotDePasse} onChange={e => setRegisterData({ ...registerData, confirmMotDePasse: e.target.value })} className={`${inputSmClass} ${isRTL ? 'pl-9' : 'pr-9'} ${fieldErrors.confirmMotDePasse ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : ''}`} required autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors`}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.confirmMotDePasse && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.confirmMotDePasse}</span>}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-3.5 bg-brand-green text-white rounded-xl font-bold shadow-[0_0_20px_rgba(18,126,54,0.3)] hover:shadow-[0_0_25px_rgba(18,126,54,0.5)] flex justify-center items-center gap-2 group transition-shadow disabled:opacity-60"
            >
              {loading ? t('login.registering') : <>{t('login.register_btn')} <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
            </motion.button>
          </form>
        </div>

        {/* Login Form (Right) */}
        <div className="absolute top-0 right-0 w-1/2 h-full p-12 flex flex-col justify-center items-center">
          <div className="text-center mb-8 w-full">
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-wide">{t('login.login_title')}</h2>
            <p className="text-brand-muted">{t('login.login_sub')}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6 w-full max-w-[320px]">
            <div className="relative group">
              <Mail className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-blue`} size={20} />
              <input type="email" placeholder={t('login.email_placeholder')} value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} className={inputClassBlue} required />
            </div>
            <div className="space-y-2">
              <div className="relative group">
                <Lock className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-blue`} size={20} />
                <input type={showLoginPassword ? "text" : "password"} placeholder={t('login.password_placeholder')} value={loginData.motDePasse} onChange={e => setLoginData({ ...loginData, motDePasse: e.target.value })} className={`${inputClassBlue} ${isRTL ? 'pl-11' : 'pr-11'}`} required />
                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors`}>
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm text-brand-blue hover:text-[#2da1ff] transition-colors font-medium">{t('login.forgot_password')}</button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold shadow-[0_0_20px_rgba(0,84,147,0.3)] hover:shadow-[0_0_25px_rgba(0,84,147,0.5)] flex justify-center items-center gap-2 group mt-8 transition-shadow disabled:opacity-60"
            >
              {loading ? t('login.logging_in') : <>{t('login.login_btn')} <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
            </motion.button>
          </form>
        </div>

        {/* Sliding Overlay */}
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-brand-blue/90 to-brand-green/90 z-20 overflow-hidden flex flex-col justify-center items-center text-white p-12 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm border border-white/20"
          initial={false}
          animate={{ x: isLogin ? '100%' : '0%' }}
          transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="absolute top-12 left-12 w-3 h-3 bg-white/40 rounded-full blur-[1px]"></div>
          <div className="absolute bottom-24 right-16 w-5 h-5 bg-white/30 rounded-full blur-[1px]"></div>
          <div className="absolute top-1/3 right-12 w-2 h-2 bg-white/50 rounded-full blur-[0.5px]"></div>

          <h1 className="text-5xl font-extrabold mb-10 tracking-widest drop-shadow-md z-30">
            SEAAL<span className={isLogin ? 'text-brand-darkBg' : 'text-white'}>.</span>
          </h1>

          <div className="relative w-full h-40 z-30 flex items-center justify-center">
            <motion.div
              className="absolute w-full text-center flex flex-col items-center"
              initial={false}
              animate={{ opacity: isLogin ? 1 : 0, scale: isLogin ? 1 : 0.95, pointerEvents: isLogin ? 'auto' : 'none' }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-3 tracking-wide">{t('login.overlay_already')}</h3>
              <p className="mb-8 text-white/90">{t('login.overlay_already_sub')}</p>
              <button onClick={() => { setIsLogin(false); setError(''); }} className="px-8 py-3 rounded-full border-2 border-white/80 hover:border-white text-white font-bold hover:bg-white/10 backdrop-blur-sm transition-all">
                {t('login.overlay_signin_btn')}
              </button>
            </motion.div>

            <motion.div
              className="absolute w-full text-center flex flex-col items-center"
              initial={false}
              animate={{ opacity: !isLogin ? 1 : 0, scale: !isLogin ? 1 : 0.95, pointerEvents: !isLogin ? 'auto' : 'none' }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-3 tracking-wide">{t('login.overlay_new')}</h3>
              <p className="mb-8 text-white/90">{t('login.overlay_new_sub')}</p>
              <button onClick={() => { setIsLogin(true); setError(''); }} className="px-8 py-3 rounded-full border-2 border-white/80 hover:border-white text-white font-bold hover:bg-white/10 backdrop-blur-sm transition-all">
                {t('login.overlay_register_btn')}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Mobile View ── */}
      <div className="w-full max-w-md glass-card rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 p-8 md:hidden z-10 my-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-widest drop-shadow-md">SEAAL<span className="text-brand-green">.</span></h1>
          <h2 className="text-2xl font-bold text-white mb-1">{isLogin ? t('login.login_title') : t('login.register_title')}</h2>
          <p className="text-brand-muted">{isLogin ? t('login.login_sub') : t('login.register_sub')}</p>
        </div>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              <div className="relative group">
                <Mail className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-blue`} size={20} />
                <input type="email" placeholder={t('login.email_placeholder')} value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} className={inputClassBlue} required />
              </div>
              <div className="relative group">
                <Lock className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-blue`} size={20} />
                <input type={showLoginPassword ? "text" : "password"} placeholder={t('login.password_placeholder')} value={loginData.motDePasse} onChange={e => setLoginData({ ...loginData, motDePasse: e.target.value })} className={`${inputClassBlue} ${isRTL ? 'pl-11' : 'pr-11'}`} required />
                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors`}>
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} w-full`}>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm text-brand-blue hover:text-[#2da1ff] transition-colors font-medium">{t('login.forgot_password')}</button>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-60">
                {loading ? t('login.logging_in') : t('login.login_btn')}
              </motion.button>
              <p className="text-center text-brand-muted">{t('login.new_client')} <span onClick={() => { setIsLogin(false); setError(''); }} className="text-[#2da1ff] font-bold cursor-pointer hover:underline">{t('login.go_register')}</span></p>
            </motion.form>
          ) : (
            <motion.form key="signup" onSubmit={handleRegister} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <div className="relative group">
                    <User className={`${iconPos} text-brand-muted`} size={16} />
                    <input type="text" placeholder={t('login.nom_placeholder')} value={registerData.nom} onChange={e => setRegisterData({ ...registerData, nom: e.target.value })} className={`${inputSmClass} ${fieldErrors.nom ? 'border-red-500/50 focus:border-red-500/50' : ''}`} required autoComplete="off" />
                  </div>
                  {fieldErrors.nom && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.nom}</span>}
                </div>
                <div className="flex flex-col">
                  <div className="relative group">
                    <User className={`${iconPos} text-brand-muted`} size={16} />
                    <input type="text" placeholder={t('login.prenom_placeholder')} value={registerData.prenom} onChange={e => setRegisterData({ ...registerData, prenom: e.target.value })} className={`${inputSmClass} ${fieldErrors.prenom ? 'border-red-500/50 focus:border-red-500/50' : ''}`} required autoComplete="off" />
                  </div>
                  {fieldErrors.prenom && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.prenom}</span>}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="relative group">
                  <Phone className={`${iconPosLg} text-brand-muted`} size={16} />
                  <input type="tel" placeholder={t('login.phone_placeholder')} value={registerData.phone} onFocus={() => !registerData.phone && setRegisterData({ ...registerData, phone: '+213' })} onChange={e => setRegisterData({ ...registerData, phone: e.target.value })} className={`${inputClass} ${fieldErrors.phone ? 'border-red-500/50 focus:border-red-500/50' : ''}`} autoComplete="off" minLength={13} maxLength={13} pattern="^\+213[5-7]\d{8}$" />
                </div>
                {fieldErrors.phone && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.phone}</span>}
              </div>
              <div className="flex flex-col">
                <div className="relative group">
                  <Mail className={`${iconPosLg} text-brand-muted`} size={16} />
                  <input type="email" placeholder={t('login.email_placeholder')} value={registerData.email} onChange={e => { setRegisterData({ ...registerData, email: e.target.value }); setBackendEmailError(''); }} className={`${inputClass} ${(fieldErrors.email || backendEmailError) ? 'border-red-500/50 focus:border-red-500/50' : ''}`} required autoComplete="off" />
                </div>
                {(fieldErrors.email || backendEmailError) && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.email || backendEmailError}</span>}
              </div>
              <div className="flex flex-col">
                <div className="relative group">
                  <AddressAutocomplete 
                    value={registerData.adresse} 
                    onChange={(val) => setRegisterData({ ...registerData, adresse: val })} 
                    placeholder={t('login.address_placeholder')} 
                    inputClassName={`${inputClass} ${fieldErrors.adresse ? 'border-red-500/50 focus:border-red-500/50' : ''}`}
                  />
                </div>
                {fieldErrors.adresse && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.adresse}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <div className="relative group">
                    <Lock className={`${iconPos} text-brand-muted`} size={16} />
                    <input type={showRegisterPassword ? "text" : "password"} placeholder={t('login.password_placeholder')} value={registerData.motDePasse} onChange={e => setRegisterData({ ...registerData, motDePasse: e.target.value })} className={`${inputSmClass} ${isRTL ? 'pl-9' : 'pr-9'} ${fieldErrors.motDePasse ? 'border-red-500/50 focus:border-red-500/50' : ''}`} required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors`}>
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.motDePasse && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium leading-tight">{fieldErrors.motDePasse}</span>}
                </div>
                <div className="flex flex-col">
                  <div className="relative group">
                    <Lock className={`${iconPos} text-brand-muted`} size={16} />
                    <input type={showConfirmPassword ? "text" : "password"} placeholder={t('login.confirm_placeholder')} value={registerData.confirmMotDePasse} onChange={e => setRegisterData({ ...registerData, confirmMotDePasse: e.target.value })} className={`${inputSmClass} ${isRTL ? 'pl-9' : 'pr-9'} ${fieldErrors.confirmMotDePasse ? 'border-red-500/50 focus:border-red-500/50' : ''}`} required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors`}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmMotDePasse && <span className="text-red-400 text-[10px] mt-1 ml-1 font-medium">{fieldErrors.confirmMotDePasse}</span>}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} className="w-full py-4 mt-2 bg-brand-green text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-60">
                {loading ? t('login.registering') : t('login.register_btn')}
              </motion.button>
              <p className="text-center text-brand-muted text-sm">{t('login.already_registered')} <span onClick={() => { setIsLogin(true); setError(''); }} className="text-[#2da1ff] font-bold cursor-pointer hover:underline">{t('login.go_login')}</span></p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card w-full max-w-md rounded-2xl p-6 border border-brand-border shadow-xl"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <h3 className="text-xl font-bold text-white mb-2">Mot de passe oublié</h3>
              <p className="text-sm text-brand-muted mb-4">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative group">
                  <Mail className={`${iconPosLg} text-brand-muted transition-colors group-focus-within:text-brand-blue`} size={20} />
                  <input type="email" placeholder={t('login.email_placeholder')} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className={inputClassBlue} required />
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setShowForgotModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors">Annuler</button>
                  <button type="submit" disabled={forgotLoading} className="flex-1 py-3 bg-brand-blue hover:bg-[#2da1ff] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                    {forgotLoading ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LoginPage;

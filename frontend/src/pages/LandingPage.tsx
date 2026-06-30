import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, FileText, Headset, ArrowRight, Mail, Phone } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import logoImg from '../components/logo.jpg';

const LandingPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-brand-darkBg font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-brand-darkBg/80 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img
              src={logoImg}
              alt="SEAAL Logo"
              className="w-9 h-9 rounded-xl object-cover"
            />
            <span className="text-2xl font-bold text-brand-text">{t('nav.app_name')}</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <a href="#services" className="hidden md:block text-brand-muted hover:text-white font-medium transition-colors">
              {t('nav.services')}
            </a>
            <LanguageSwitcher />
            <Link to="/login" className="bg-brand-blue text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-brand-blue/20 transition-all hover:scale-105 active:scale-95 hover:bg-[#2da1ff]">
              {t('nav.login')}
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-gradient-to-br from-brand-blue/10 to-brand-green/10 rounded-full blur-3xl opacity-50"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 text-center lg:text-left"
        >
          <h1 className="text-5xl lg:text-7xl font-bold text-brand-text leading-tight mb-6 tracking-tight">
            {t('hero.title').split('<highlight>')[0]}
            <span className="text-white">{t('hero.title').split('<highlight>')[1]?.split('</highlight>')[0]}</span>
            {t('hero.title').split('</highlight>')[1]}
          </h1>
          <p className="text-lg lg:text-xl text-brand-muted mb-10 max-w-2xl mx-auto lg:mx-0">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to="/login" className="w-full sm:w-auto bg-brand-green text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-brand-green/30 transition-all flex items-center justify-center gap-2 group">
              {t('hero.cta_client')}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#services"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-brand-text bg-brand-card hover:bg-brand-border border border-brand-border transition-colors text-center"
            >
              {t('hero.cta_learn')}
            </a>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 w-full max-w-lg relative"
        >
          {/* Hero Illustration Image */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="relative w-full aspect-square rounded-[2.5rem] shadow-2xl shadow-brand-blue/20 overflow-hidden flex items-center justify-center border border-brand-border/50"
          >
             <img 
                src="/seaal_hero.png" 
                alt="SEAAL Dashboard App" 
                className="w-full h-full object-cover"
              />
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div id="services" className="bg-brand-darkBg py-24 relative z-10 border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-brand-text mb-4">{t('features.title')}</h2>
            <p className="text-brand-muted text-lg max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -8 }} className="bg-brand-card p-8 rounded-3xl shadow-sm border border-brand-border hover:shadow-xl hover:shadow-brand-blue/5 transition-all">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-3">{t('features.complaint_title')}</h3>
              <p className="text-brand-muted">{t('features.complaint_desc')}</p>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} className="bg-brand-card p-8 rounded-3xl shadow-sm border border-brand-border hover:shadow-xl hover:shadow-brand-blue/5 transition-all">
              <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue mb-6 border border-brand-blue/20">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-3">{t('features.tracking_title')}</h3>
              <p className="text-brand-muted">{t('features.tracking_desc')}</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -8 }} className="bg-brand-card p-8 rounded-3xl shadow-sm border border-brand-border hover:shadow-xl hover:shadow-brand-blue/5 transition-all">
              <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green mb-6 border border-brand-green/20">
                <Headset size={28} />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-3">{t('features.support_title')}</h3>
              <p className="text-brand-muted">{t('features.support_desc')}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#01040A] text-gray-400 py-16 border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logoImg}
                  alt="SEAAL Logo"
                  className="w-9 h-9 rounded-xl object-cover"
                />
                <h3 className="text-2xl font-bold text-brand-text">{t('footer.title')}</h3>
              </div>
              <p className="max-w-sm mb-6 leading-relaxed">{t('footer.desc')}</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-brand-card border border-brand-border flex items-center justify-center hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.324V1.325C24 .597 23.403 0 22.675 0z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-brand-card border border-brand-border flex items-center justify-center hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors">
                  <span className="sr-only">Twitter / X</span>
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold mb-4 tracking-wide text-sm uppercase">{t('footer.legal_title')}</h4>
              <ul className="space-y-3">
                <li><Link to="/terms" className="hover:text-brand-blue transition-colors">{t('footer.terms')}</Link></li>
                <li><Link to="/privacy" className="hover:text-brand-blue transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link to="/charter" className="hover:text-brand-blue transition-colors">{t('footer.charter')}</Link></li>
                <li><Link to="/legal" className="hover:text-brand-blue transition-colors">{t('footer.legal')}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div id="contact">
              <h4 className="text-white font-bold mb-4 tracking-wide text-sm uppercase">Contact</h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="mailto:admin@seaal.dz"
                    className="flex items-center gap-3 group hover:text-brand-blue transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors shrink-0">
                      <Mail size={14} />
                    </span>
                    <span className="text-sm break-all">admin@seaal.dz</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+21321000000"
                    className="flex items-center gap-3 group hover:text-brand-blue transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors shrink-0">
                      <Phone size={14} />
                    </span>
                    <span className="text-sm">+213 21 00 00 00</span>
                  </a>
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                Compte désactivé ?{' '}
                <a href="mailto:admin@seaal.dz" className="text-brand-blue hover:underline">
                  Contactez-nous
                </a>
              </p>
            </div>
          </div>
          
          <div className="border-t border-brand-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>{t('footer.rights')}</p>
            <p className="mt-4 md:mt-0">{t('footer.platform')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import React, { useState, useEffect } from 'react';
import { Filter, Plus, Search, X, Check, Clock, AlertCircle, RefreshCw, FileText, Inbox, ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { API_BASE_URL } from '../config';

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

const API_URL = `${API_BASE_URL}/api/complaints`;

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (path.startsWith('/uploads/')) return `${API_BASE_URL}${path}`;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/uploads/${path}`;
};

/* ------------------------------------------------------------------ */
/*  TIMELINE COMPONENT (client complaint tracking)                      */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    key: 'submitted',
    label: 'Réclamation soumise',
    sub: 'Votre demande a été reçue par nos services.',
    activeFor: ['Nouveau', 'En cours', 'Résolu', 'Rejeté'],
    dot: '#22c55e',       // green
  },
  {
    key: 'processing',
    label: 'En cours de traitement',
    sub: 'Nos équipes examinent votre dossier.',
    activeFor: ['En cours', 'Résolu', 'Rejeté'],
    dot: '#eab308',       // yellow
  },
  {
    key: 'resolved',
    label: 'Résolu',
    sub: 'Traitement finalisé. Consultez la réponse ci-dessous.',
    activeFor: ['Résolu'],
    dot: '#3b82f6',       // blue
    rejectedLabel: 'Rejeté',
    rejectedSub: 'Votre réclamation a été rejetée.',
    rejectedDot: '#ef4444',
    rejectedFor: ['Rejeté'],
  },
];

const ComplaintTimeline = ({ statut }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-0 pl-1">
      {STEPS.map((step, idx) => {
        const isActive = step.activeFor.includes(statut);
        const isRejected = step.rejectedFor && step.rejectedFor.includes(statut);
        const isLast = idx === STEPS.length - 1;

        const dotColor = isRejected
          ? step.rejectedDot
          : isActive
            ? step.dot
            : 'transparent';

        const dotBorder = isActive || isRejected ? 'transparent' : '#334155';

        let label = '';
        let sub = '';
        if (step.key === 'submitted') {
          label = t('complaints.step1_label');
          sub = t('complaints.step1_sub');
        } else if (step.key === 'processing') {
          label = t('complaints.step2_label');
          sub = t('complaints.step2_sub');
        } else if (step.key === 'resolved') {
          if (isRejected) {
            label = t('complaints.step3_rejected_label');
            sub = t('complaints.step3_rejected_sub');
          } else {
            label = t('complaints.step3_label');
            sub = t('complaints.step3_sub');
          }
        }

        const labelColor = isActive || isRejected ? '#ffffff' : '#4a637a';
        const subColor = isActive || isRejected ? '#94a3b8' : '#2e4257';

        return (
          <div key={step.key} className="flex gap-4">
            {/* Dot + connector line */}
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  border: `2px solid ${dotBorder}`,
                  flexShrink: 0,
                  marginTop: 3,
                  boxShadow: isActive || isRejected ? `0 0 6px ${dotColor}99` : 'none',
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flexGrow: 1,
                    minHeight: 28,
                    backgroundColor: '#1e3a5f',
                    margin: '3px 0',
                  }}
                />
              )}
            </div>

            {/* Text */}
            <div className="pb-5">
              <p style={{ color: labelColor, fontWeight: 600, fontSize: '14px', lineHeight: 1.3 }}>
                {label}
              </p>
              <p style={{ color: subColor, fontSize: '12px', marginTop: 2 }}>
                {sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminComplaints = () => {
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [reponseAdmin, setReponseAdmin] = useState('');
  const [statut, setStatut] = useState('');
  const [type, setType] = useState('');
  const [processing, setProcessing] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filterStatut, setFilterStatut] = useState('Tous statuts');
  const [filterType, setFilterType] = useState('Tous types');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [similarComplaints, setSimilarComplaints] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch !== null) {
      setSearchTerm(querySearch);
    }
  }, [searchParams]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = user?.token;
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction
      });
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatut && filterStatut !== 'Tous statuts') params.append('statut', filterStatut);
      if (filterType && filterType !== 'Tous types') params.append('type', filterType);

      const res = await fetch(`${API_URL}?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const handleRefreshEvent = () => fetchComplaints();
    window.addEventListener('refresh_complaints', handleRefreshEvent);
    return () => window.removeEventListener('refresh_complaints', handleRefreshEvent);
  }, [currentPage, sortConfig, filterStatut, filterType]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else if (searchTerm !== null) {
        fetchComplaints();
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    if (location.state?.openComplaintId && complaints.length > 0) {
      const complaintToOpen = complaints.find(c => c._id === location.state.openComplaintId);
      if (complaintToOpen) {
        openModal(complaintToOpen);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, complaints]);

  const handleRefresh = () => {
    setFilterStatut('Tous statuts');
    setFilterType('Tous types');
    setSearchTerm('');
    fetchComplaints();
  };

  const handleRetrainAI = async () => {
    if (!window.confirm("Voulez-vous vraiment lancer le ré-entraînement de l'IA avec les données actuelles ? Cela peut prendre quelques instants.")) {
      return;
    }
    setRetraining(true);
    const toastId = toast.loading("Ré-entraînement de l'IA en cours...");
    try {
      const res = await fetch(`${API_URL}/retrain-ai`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("IA ré-entraînée avec succès !", { id: toastId });
      } else {
        toast.error(data.message || "Erreur lors du ré-entraînement de l'IA", { id: toastId });
      }
    } catch (error) {
      toast.error("Service IA injoignable", { id: toastId });
    } finally {
      setRetraining(false);
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const token = user?.token;
      const res = await fetch(`${API_URL}/${selectedComplaint._id}/process`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statut, reponseAdmin, type })
      });

      if (res.ok) {
        toast.success(t('complaints.toast_process_success', { defaultValue: 'Réclamation traitée avec succès !' }));
        fetchComplaints();
        setSelectedComplaint(null);
      } else {
        toast.error(t('complaints.toast_process_error', { defaultValue: 'Erreur lors du traitement' }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const openModal = async (complaint) => {
    setSelectedComplaint(complaint);
    setStatut(complaint.statut);
    setType(complaint.type);
    setReponseAdmin(complaint.reponseAdmin || '');
    setSimilarComplaints([]);
    setLoadingSimilar(true);
    try {
      const token = user?.token;
      if (complaint.clientModified) {
         await fetch(`${API_URL}/${complaint._id}/read`, {
           method: 'PUT',
           headers: { 'Authorization': `Bearer ${token}` }
         });
         window.dispatchEvent(new Event('complaintRead'));
         complaint.clientModified = false;
      }

      const res = await fetch(`${API_URL}/${complaint._id}/similar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSimilarComplaints(data.similar || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des réclamations similaires :", error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-brand-blue" /> : <ArrowDown size={14} className="ml-1 text-brand-blue" />;
  };

  const downloadPDF = async (complaint) => {
    const toastId = toast.loading(t('complaints.toast_pdf_loading', { defaultValue: 'Génération du PDF...' }));

    try {
      const doc = new jsPDF();

      // Async image loader helper
      const loadImage = (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      // Load the official square SEAAL logo first (logo.jpg)
      let logoImg = await loadImage('/logo.jpg');
      if (!logoImg) {
        logoImg = await loadImage('/seaal_logo.png');
      }

      // 1. HEADER SECTION
      if (logoImg) {
        // Draw the square logo at top left (20mm x 20mm)
        doc.addImage(logoImg as HTMLImageElement, 'JPEG', 20, 10, 20, 20);

        // Company Text headers aligned next to the square logo (at x = 44)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 84, 147); // Royal Blue
        doc.text("SEAAL", 44, 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Direction Clientèle & Réclamations", 44, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Alger, Algérie", 44, 24);
      } else {
        // Fallback stylized text banner if image fails
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(0, 84, 147); // Royal Blue
        doc.text("seaal", 20, 20);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(18, 126, 54); // SEAAL Green
        doc.text("EAU ET ASSAINISSEMENT D'ALGER", 20, 25);
      }

      // Title & Document Reference on the right (x = 190)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(0, 84, 147);
      doc.text("FICHE DE RÉCLAMATION", 190, 15, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Réf: #${complaint._id.substring(complaint._id.length - 6).toUpperCase()}`, 190, 21, { align: "right" });
      doc.text(`Date: ${new Date(complaint.createdAt).toLocaleDateString('fr-FR')}`, 190, 26, { align: "right" });

      // Double-colored Accent Divider line (reflecting SEAAL brand colors)
      // Royal Blue Left Line
      doc.setDrawColor(0, 84, 147);
      doc.setLineWidth(1.5);
      doc.line(20, 34, 115, 34);

      // Green Right Line
      doc.setDrawColor(18, 126, 54);
      doc.setLineWidth(1.5);
      doc.line(115, 34, 190, 34);

      // 2. DETAILED INFORMATION CARDS (Side-by-Side)
      let y = 42;
      const cardWidth = 80;
      const cardHeight = 46;

      // LEFT CARD: Client Information
      const xLeft = 20;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(xLeft, y, cardWidth, cardHeight, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(xLeft, y, cardWidth, cardHeight, 3, 3, "D");

      // Top colored accent bar (Blue)
      doc.setFillColor(0, 84, 147);
      doc.rect(xLeft, y, cardWidth, 3, "F");

      // Content
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("INFORMATIONS CLIENT", xLeft + 6, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      const clientName = `${complaint.client?.nom || ''} ${complaint.client?.prenom || ''}`.trim() || 'Non spécifié';
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(clientName, xLeft + 6, y + 17);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const emailText = doc.splitTextToSize(`Email: ${complaint.client?.email || 'N/A'}`, cardWidth - 12);
      doc.text(emailText, xLeft + 6, y + 25);

      const phoneText = complaint.client?.telephone || complaint.client?.phone || 'N/A';
      doc.text(`Tél: ${phoneText}`, xLeft + 6, y + 36);

      // RIGHT CARD: Complaint details
      const xRight = 110;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(xRight, y, cardWidth, cardHeight, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(xRight, y, cardWidth, cardHeight, 3, 3, "D");

      // Top colored accent bar (Green)
      doc.setFillColor(18, 126, 54);
      doc.rect(xRight, y, cardWidth, 3, "F");

      // Content
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text("DÉTAILS RÉCLAMATION", xRight + 6, y + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Type d'incident:", xRight + 6, y + 17);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(translateType(complaint.type, t), xRight + 6, y + 22);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Statut de traitement:", xRight + 6, y + 31);

      // Define colors for the status badge pill
      let badgeBg = [239, 246, 255]; // Light Blue for Nouveau
      let badgeText = [59, 130, 246];
      const statusStr = translateStatus(complaint.statut, t).toUpperCase();

      if (complaint.statut === 'Résolu') {
        badgeBg = [236, 253, 245]; // Light Green
        badgeText = [5, 150, 105];
      } else if (complaint.statut === 'En cours') {
        badgeBg = [254, 243, 199]; // Light Yellow
        badgeText = [217, 119, 6];
      } else if (complaint.statut === 'Rejeté') {
        badgeBg = [254, 242, 242]; // Light Red
        badgeText = [220, 38, 38];
      }

      // Draw Badge Pill
      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.roundedRect(xRight + 6, y + 34, 32, 6, 1.5, 1.5, "F");
      doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(statusStr, xRight + 22, y + 38.2, { align: "center" });

      y = y + cardHeight + 10;

      // 3. INCIDENT ADDRESS BAR (Wide)
      if (complaint.adresse) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, y, 170, 14, 2, 2, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(20, y, 170, 14, 2, 2, "D");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Adresse de l'incident:", 26, y + 9);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);

        const splitAdresse = doc.splitTextToSize(complaint.adresse, 115);
        doc.text(splitAdresse, 65, y + 9);

        y += 20;
      } else {
        y += 4;
      }

      // 4. INCIDENT DESCRIPTION BOX
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 8, "F");
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      doc.line(20, y + 8, 190, y + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 84, 147);
      doc.text("DESCRIPTION DÉTAILLÉE DE L'INCIDENT", 25, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const splitDesc = doc.splitTextToSize(complaint.description || 'Aucune description fournie.', 160);
      doc.text(splitDesc, 25, y + 14);

      y = y + 14 + (splitDesc.length * 5) + 10;

      // 5. ADMINISTRATION RESPONSE BOX (If present)
      if (complaint.reponseAdmin) {
        doc.setFillColor(240, 253, 250);
        doc.rect(20, y, 170, 8, "F");
        doc.setDrawColor(204, 251, 241);
        doc.line(20, y, 190, y);
        doc.line(20, y + 8, 190, y + 8);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(18, 126, 54);
        doc.text("RÉPONSE ET MESURES DE L'ADMINISTRATION", 25, y + 5.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);

        const splitResp = doc.splitTextToSize(complaint.reponseAdmin, 160);
        doc.text(splitResp, 25, y + 14);

        y = y + 14 + (splitResp.length * 5) + 10;
      }

      // 6. FORMAL FOOTER
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 275, 190, 275);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Société des Eaux et de l'Assainissement d'Alger (SEAAL)", 20, 281);
      doc.text("Fiche de réclamation officielle générée par l'Administration", 190, 281, { align: "right" });

      // Save PDF file
      doc.save(`Reclamation_${complaint._id.substring(complaint._id.length - 6).toUpperCase()}.pdf`);
      toast.success(t('complaints.toast_pdf_success', { defaultValue: 'PDF généré et téléchargé avec succès !' }), { id: toastId });
    } catch (error) {
      console.error("Erreur PDF:", error);
      toast.error(t('complaints.toast_pdf_error', { defaultValue: 'Erreur lors de la génération du PDF' }), { id: toastId });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-text">{t('complaints.admin_title')}</h2>
          <p className="text-brand-muted mt-1">{t('complaints.admin_sub')}</p>
        </div>
      </div>

      <div className="bg-brand-card rounded-2xl shadow-sm border border-brand-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-brand-border bg-brand-darkBg flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
              <input
                type="text"
                placeholder={t('complaints.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-brand-card border border-brand-border text-brand-text placeholder-brand-muted rounded-lg w-full text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
              />
            </div>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="bg-brand-card border border-brand-border text-brand-text rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-blue cursor-pointer">
              <option value="Tous statuts">{t('complaints.all_statuses', { defaultValue: 'Tous statuts' })}</option>
              <option value="Nouveau">{translateStatus('Nouveau', t)}</option>
              <option value="En cours">{translateStatus('En cours', t)}</option>
              <option value="Résolu">{translateStatus('Résolu', t)}</option>
              <option value="Rejeté">{translateStatus('Rejeté', t)}</option>
            </select>

            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-brand-card border border-brand-border text-brand-text rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-blue cursor-pointer">
              <option value="Tous types">{t('complaints.all_types', { defaultValue: 'Tous types' })}</option>
              <option value="Retard d'intervention">{translateType('Retard d\'intervention', t)}</option>
              <option value="Fuite d'eau">{translateType('Fuite d\'eau', t)}</option>
              <option value="Problème de compteur">{translateType('Problème de compteur', t)}</option>
              <option value="Facturation">{translateType('Facturation', t)}</option>
              <option value="Coupure d'eau">{translateType('Coupure d\'eau', t)}</option>
            </select>
          </div>
          <div className="flex justify-between items-center text-xs text-brand-muted">
            <span>
              {t('complaints.total_count', { count: complaints.length, defaultValue: `${complaints.length} réclamation(s)` })} — {t('complaints.page_info', { current: currentPage, total: totalPages })}
            </span>
            <button onClick={handleRefresh} className="flex items-center gap-1 hover:text-brand-text transition-colors">
              <RefreshCw size={14} /> {t('complaints.refresh', { defaultValue: 'Actualiser' })}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-card text-brand-muted text-sm border-b border-brand-border">
                <th className="p-4 md:p-5 font-medium cursor-pointer group hover:text-brand-text transition-colors" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center">{t('complaints.col_id_date')} <SortIcon columnKey="createdAt" /></div>
                </th>
                <th className="p-4 md:p-5 font-medium cursor-pointer group hover:text-brand-text transition-colors" onClick={() => handleSort('client')}>
                  <div className="flex items-center">{t('complaints.col_client')} <SortIcon columnKey="client" /></div>
                </th>
                <th className="p-4 md:p-5 font-medium cursor-pointer group hover:text-brand-text transition-colors" onClick={() => handleSort('type')}>
                  <div className="flex items-center">{t('complaints.col_type_desc')} <SortIcon columnKey="type" /></div>
                </th>
                <th className="p-4 md:p-5 font-medium cursor-pointer group hover:text-brand-text transition-colors" onClick={() => handleSort('statut')}>
                  <div className="flex items-center">{t('dashboard.col_status', { defaultValue: 'Statut' })} <SortIcon columnKey="statut" /></div>
                </th>
                <th className="p-4 md:p-5 font-medium text-right">{t('complaints.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td className="p-4 md:p-5"><div className="h-4 bg-brand-border/50 rounded w-24 animate-pulse mb-2"></div><div className="h-3 bg-brand-border/30 rounded w-16 animate-pulse"></div></td>
                    <td className="p-4 md:p-5"><div className="h-4 bg-brand-border/50 rounded w-32 animate-pulse mb-2"></div><div className="h-3 bg-brand-border/30 rounded w-40 animate-pulse"></div></td>
                    <td className="p-4 md:p-5"><div className="h-4 bg-brand-border/50 rounded w-28 animate-pulse mb-2"></div><div className="h-3 bg-brand-border/30 rounded w-48 animate-pulse"></div></td>
                    <td className="p-4 md:p-5"><div className="h-6 bg-brand-border/50 rounded-full w-20 animate-pulse"></div></td>
                    <td className="p-4 md:p-5 flex justify-end gap-2"><div className="h-8 bg-brand-border/50 rounded w-20 animate-pulse"></div><div className="h-8 bg-brand-border/50 rounded w-8 animate-pulse"></div></td>
                  </tr>
                ))
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-brand-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-brand-border/20 flex items-center justify-center mb-4">
                        <Inbox size={32} className="text-brand-muted opacity-50" />
                      </div>
                      <p className="text-lg font-medium text-brand-text">{t('complaints.no_complaints')}</p>
                      <p className="text-sm mt-1">{t('dashboard.no_recent', { defaultValue: 'Modifiez vos filtres ou effectuez une autre recherche.' })}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                complaints.map((item) => (
                  <tr key={item._id} className="hover:bg-brand-border/30 transition-colors group">
                    <td className="p-4 md:p-5">
                      <p className="font-semibold text-brand-text">{item._id.substring(item._id.length - 6).toUpperCase()}</p>
                      <p className="text-xs text-brand-muted">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 md:p-5 max-w-[180px] lg:max-w-[220px] truncate">
                      <p className="font-medium text-brand-text truncate" title={`${item.client?.nom} ${item.client?.prenom}`}>{item.client?.nom} {item.client?.prenom}</p>
                      <p className="text-xs text-brand-muted truncate" title={item.client?.email}>{item.client?.email}</p>
                    </td>
                    <td className="p-4 md:p-5 max-w-[180px] lg:max-w-xs truncate">
                      <p className="font-medium text-brand-text truncate">{translateType(item.type, t)}</p>
                      <p className="text-xs text-brand-muted truncate" title={item.description}>{item.description}</p>
                    </td>
                    <td className="p-4 md:p-5">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${item.statut === 'Résolu' ? 'bg-green-800/40 text-green-400 border-green-600/50' : item.statut === 'En cours' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : item.statut === 'Rejeté' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-blue-600/25 text-blue-300 border-blue-500/40'}`}>{translateStatus(item.statut, t)}</span>
                      </div>
                    </td>
                    <td className="p-4 md:p-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => downloadPDF(item)} className="text-purple-400 p-1.5 bg-purple-500/15 border border-purple-500/30 rounded-lg hover:bg-purple-500/25 transition-colors" title="Télécharger PDF">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => openModal(item)} className="bg-blue-800/40 text-blue-300 font-bold text-sm px-4 py-1.5 rounded-lg border border-blue-600/50 hover:bg-blue-700 hover:text-white transition-all">
                          {t('complaints.process_btn')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 p-4 border-t border-brand-border bg-brand-darkBg/50">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-brand-muted">{t('complaints.page_info', { current: currentPage, total: totalPages })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal de traitement */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-darkBg border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
              <button onClick={() => setSelectedComplaint(null)} className="absolute top-4 right-4 text-brand-muted hover:text-white z-10 bg-brand-darkBg rounded-full p-1"><X size={24} /></button>

              <h3 className="text-2xl font-bold text-white mb-6 shrink-0">{t('complaints.process_title')}</h3>

              <div className="overflow-y-auto pr-2 -mr-2">
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-brand-muted mb-1">{t('complaints.client_label')}</p>
                    <p className="font-medium text-white">{selectedComplaint.client?.nom} {selectedComplaint.client?.prenom}</p>
                    <p className="text-brand-muted text-xs">{selectedComplaint.client?.phone || selectedComplaint.client?.email}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-brand-muted mb-1">{t('complaints.details_label')}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white">{translateType(selectedComplaint.type, t)}</p>
                      {selectedComplaint.aiConfidence != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: selectedComplaint.aiConfidence >= 0.85 ? 'rgba(34,197,94,0.15)' : selectedComplaint.aiConfidence >= 0.6 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                            color: selectedComplaint.aiConfidence >= 0.85 ? '#22c55e' : selectedComplaint.aiConfidence >= 0.6 ? '#fbbf24' : '#f87171',
                            border: `1px solid ${selectedComplaint.aiConfidence >= 0.85 ? 'rgba(34,197,94,0.3)' : selectedComplaint.aiConfidence >= 0.6 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`
                          }}>
                          🤖 IA {Math.round(selectedComplaint.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-brand-muted text-xs">{selectedComplaint.adresse}</p>
                  </div>
                  <div className="col-span-2 bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-brand-muted mb-1">{t('complaints.description_label')}</p>
                    <p className="text-white whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>
                  {selectedComplaint.piecesJointes && selectedComplaint.piecesJointes.length > 0 && (
                    <div className="col-span-2 bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-brand-muted mb-2">Pièce Jointe</p>
                      <a href={getFileUrl(selectedComplaint.piecesJointes[0])} target="_blank" rel="noreferrer">
                        <img
                          src={getFileUrl(selectedComplaint.piecesJointes[0])}
                          alt="Pièce jointe"
                          className="max-w-full max-h-48 object-contain rounded-lg border border-white/10"
                          onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23f87171' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='3' y1='3' x2='21' y2='21'%3E%3C/line%3E%3C/svg%3E"; }}
                        />
                      </a>
                    </div>
                  )}

                  {/* Similar Complaints Alert */}
                  {(loadingSimilar || similarComplaints.length > 0) && (
                    <div className="col-span-2 bg-white/5 p-4 rounded-xl border border-red-500/20 space-y-3">
                      <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                        <span>🤖 Détection de Doublons / Incidents Similaires IA</span>
                        {loadingSimilar && <RefreshCw size={14} className="animate-spin text-brand-blue" />}
                      </h4>

                      {loadingSimilar ? (
                        <p className="text-xs text-brand-muted">Recherche d'incidents similaires en cours...</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {similarComplaints.map(sim => (
                            <div key={sim.id} className="flex justify-between items-start gap-4 p-2.5 rounded bg-brand-card/50 border border-white/5 text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">
                                  N° {sim.id.substring(sim.id.length - 6).toUpperCase()} — {translateType(sim.type, t)}
                                </p>
                                {sim.clientName && (
                                  <p className="text-brand-blue text-[10px] font-medium mt-0.5 flex items-center gap-1">
                                    👤 {sim.clientName}
                                  </p>
                                )}
                                <p className="text-brand-muted truncate mt-0.5 text-xs" title={sim.description}>
                                  {sim.description}
                                </p>
                                <p className="text-[10px] text-brand-muted mt-1">
                                  Créé le {new Date(sim.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-[10px] font-bold text-[#3b82f6] bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                  {sim.score}% similaire
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${sim.statut === 'Résolu'
                                  ? 'bg-green-800/40 text-green-400 border-green-600/50'
                                  : sim.statut === 'En cours'
                                    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                                    : sim.statut === 'Rejeté'
                                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                      : 'bg-blue-600/25 text-blue-300 border-blue-500/40'
                                  }`}>
                                  {translateStatus(sim.statut, t)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <form onSubmit={handleProcess} className="space-y-4">
                  <div>
                    <label className="block text-brand-muted text-sm font-medium mb-2">Corriger le Type / Catégorie</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 bg-brand-card border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue">
                      <option value="Retard d'intervention">{translateType("Retard d'intervention", t)}</option>
                      <option value="Fuite d'eau">{translateType("Fuite d'eau", t)}</option>
                      <option value="Problème de compteur">{translateType("Problème de compteur", t)}</option>
                      <option value="Facturation">{translateType("Facturation", t)}</option>
                      <option value="Coupure d'eau">{translateType("Coupure d'eau", t)}</option>
                      <option value="Autre">{translateType("Autre", t)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.change_status')}</label>
                    <select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full px-4 py-3 bg-brand-card border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue">
                      <option value="Nouveau">{translateStatus('Nouveau', t)}</option>
                      <option value="En cours">{translateStatus('En cours', t)}</option>
                      <option value="Résolu">{translateStatus('Résolu', t)}</option>
                      <option value="Rejeté">{translateStatus('Rejeté', t)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.response_label')}</label>
                    <textarea value={reponseAdmin} onChange={(e) => setReponseAdmin(e.target.value)} rows={3} placeholder={t('complaints.response_placeholder')} className="w-full px-4 py-3 bg-brand-card border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue resize-none"></textarea>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setSelectedComplaint(null)} className="px-5 py-2.5 rounded-xl font-medium text-brand-muted hover:text-white hover:bg-white/5">{t('complaints.cancel')}</button>
                    <button type="submit" disabled={processing} className="bg-brand-blue hover:bg-[#2da1ff] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50">
                      <Check size={18} /> {processing ? t('complaints.saving') : t('complaints.save')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};



const ClientComplaints = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const clientUser = useAuthStore(state => state.user);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    description: '',
    adresse: '',
    piecesJointes: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');

  // Edit Form States
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    description: '',
    adresse: '',
    piecesJointes: []
  });
  const [updating, setUpdating] = useState(false);
  const [editFileError, setEditFileError] = useState('');

  useEffect(() => {
    fetchMyComplaints();
  }, [currentPage]);

  const resetNewForm = () => {
    setFormData({ description: '', adresse: '', piecesJointes: [] });
    setFileError('');
    setShowNewModal(false);
  };

  useEffect(() => {
    if (location.state?.openComplaintId && complaints.length > 0) {
      const complaintToOpen = complaints.find(c => c._id === location.state.openComplaintId);
      if (complaintToOpen) {
        handleConsulter(complaintToOpen);
        // Nettoyer le state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, complaints]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const token = clientUser?.token;
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage)
      });
      const res = await fetch(`${API_URL}/mycomplaints?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setFileError('Le fichier est trop volumineux (Max 20MB)');
        return;
      }
      setFileError('');
      setFormData(prev => ({
        ...prev,
        piecesJointes: [file]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = clientUser?.token;

      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description);
      formDataToSend.append('adresse', formData.adresse);

      if (formData.piecesJointes && formData.piecesJointes.length > 0) {
        if (formData.piecesJointes[0] instanceof File) {
          formDataToSend.append('piecesJointes', formData.piecesJointes[0]);
        }
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      const data = await res.json();
      if (res.ok) {
        resetNewForm();
        fetchMyComplaints();
        // Étape 7 : afficher confirmation avec numéro de réclamation
        const numeroReclamation = data._id
          ? data._id.substring(data._id.length - 6).toUpperCase()
          : '------';
        toast.success(
          `Réclamation soumise avec succès !\nN° de réclamation : ${numeroReclamation}`,
          {
            duration: 3000,
            style: {
              background: '#0f1f3d',
              color: '#fff',
              border: '1px solid #1e3a5f',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              whiteSpace: 'pre-line',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          }
        );
      } else {
        toast.error(data.message || t('complaints.toast_create_error', { defaultValue: 'Erreur lors de la création de la réclamation' }), {
          style: {
            background: '#1a0a0a',
            color: '#f87171',
            border: '1px solid #7f1d1d',
            borderRadius: '12px',
          },
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingComplaint(item);
    setEditFormData({
      description: item.description,
      adresse: item.adresse,
      piecesJointes: item.piecesJointes || []
    });
    setEditFileError('');
    setShowEditModal(true);
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setEditFileError('Le fichier est trop volumineux (Max 20MB)');
        return;
      }
      setEditFileError('');
      setEditFormData(prev => ({
        ...prev,
        piecesJointes: [file]
      }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = clientUser?.token;

      const formDataToSend = new FormData();
      formDataToSend.append('description', editFormData.description);
      formDataToSend.append('adresse', editFormData.adresse);

      if (editFormData.piecesJointes && editFormData.piecesJointes.length > 0) {
        if (editFormData.piecesJointes[0] instanceof File) {
          formDataToSend.append('piecesJointes', editFormData.piecesJointes[0]);
        } else if (typeof editFormData.piecesJointes[0] === 'string') {
          formDataToSend.append('piecesJointes', editFormData.piecesJointes[0]);
        }
      }

      const res = await fetch(`${API_URL}/${editingComplaint._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setEditingComplaint(null);
        setEditFormData({ description: '', adresse: '', piecesJointes: [] });
        setEditFileError('');
        fetchMyComplaints();
        toast.success(t('complaints.toast_update_success', { defaultValue: 'Réclamation modifiée avec succès !' }), {
          style: {
            background: '#0f1f3d',
            color: '#fff',
            border: '1px solid #1e3a5f',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '14px',
          },
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
        });
      } else {
        toast.error(data.message || t('complaints.toast_update_error', { defaultValue: 'Erreur lors de la modification de la réclamation' }), {
          style: {
            background: '#1a0a0a',
            color: '#f87171',
            border: '1px solid #7f1d1d',
            borderRadius: '12px',
          },
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setUpdating(false);
    }
  };

  const handleConsulter = async (item) => {
    try {
      const token = clientUser?.token;
      // Étape 2 : rechercher la réponse associée à la réclamation (côté serveur au moment du clic)
      const res = await fetch(`${API_URL}/${item._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const latestData = await res.json();
        setSelectedComplaint(latestData);

        // Si la réclamation n'a pas encore été lue par le client, on la marque comme lue
        if (latestData.clientRead === false) {
          await fetch(`${API_URL}/${item._id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          // Notifier Topbar pour mettre à jour le compteur de notifications
          window.dispatchEvent(new Event('complaintRead'));
          // Mettre à jour la liste locale
          fetchMyComplaints();
        }
      } else {
        setSelectedComplaint(item); // Fallback aux données en cache
      }
    } catch (error) {
      console.error(error);
      setSelectedComplaint(item); // Fallback aux données en cache
    }
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-text">{t('complaints.client_title')}</h2>
          <p className="text-brand-muted mt-1">{t('complaints.client_sub')}</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="bg-brand-green hover:bg-[#12722b] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-brand-green/20">
          <Plus size={20} /> {t('complaints.new_btn')}
        </button>
      </div>

      <div className="bg-brand-card rounded-2xl shadow-sm border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-card text-brand-muted text-sm border-b border-brand-border">
                <th className="p-4 md:p-5 font-medium">{t('complaints.col_id_date')}</th>
                <th className="p-4 md:p-5 font-medium">{t('dashboard.col_type', { defaultValue: 'Type' })}</th>
                <th className="p-4 md:p-5 font-medium">{t('dashboard.col_status', { defaultValue: 'Statut' })}</th>
                <th className="p-4 md:p-5 font-medium text-right">{t('complaints.col_details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={4} className="p-4 md:p-5 text-center text-brand-muted">{t('dashboard.loading')}</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={4} className="p-4 md:p-5 text-center text-brand-muted">{t('complaints.no_my_complaints')}</td></tr>
              ) : (
                complaints.map((item) => (
                  <tr key={item._id} className="hover:bg-brand-border/30 transition-colors">
                    <td className="p-4 md:p-5">
                      <p className="font-semibold text-brand-text">{item._id.substring(item._id.length - 6).toUpperCase()}</p>
                      <p className="text-xs text-brand-muted">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 md:p-5 font-medium text-brand-text">{translateType(item.type, t)}</td>
                    <td className="p-4 md:p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${item.statut === 'Résolu' ? 'bg-green-800/40 text-green-400 border-green-600/50' : item.statut === 'Rejeté' ? 'bg-red-500/15 text-red-400 border-red-500/30' : item.statut === 'En cours' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-blue-600/25 text-blue-300 border-blue-500/40'}`}>{translateStatus(item.statut, t)}</span>
                    </td>
                    <td className="p-4 md:p-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEditClick(item)}
                          disabled={item.statut !== 'Nouveau'}
                          className={`font-bold text-sm px-4 py-1.5 rounded-lg border transition-all ${item.statut === 'Nouveau'
                            ? 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50 hover:bg-yellow-600 hover:text-white cursor-pointer'
                            : 'bg-yellow-500/10 text-yellow-500/30 border-yellow-500/20 cursor-not-allowed'
                            }`}
                        >
                          {t('profile.edit_btn', { defaultValue: 'Modifier' }).split(' ')[0]}
                        </button>
                        <button onClick={() => handleConsulter(item)} className="bg-blue-800/40 text-blue-300 font-bold text-sm px-4 py-1.5 rounded-lg border border-blue-600/50 hover:bg-blue-700 hover:text-white transition-all">{t('complaints.view_btn')}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 p-4 border-t border-brand-border bg-brand-darkBg/50">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-brand-muted">{t('complaints.page_info', { current: currentPage, total: totalPages })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal - Nouvelle Réclamation */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-darkBg border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={resetNewForm} className="absolute top-4 right-4 text-brand-muted hover:text-white"><X size={24} /></button>

              <h3 className="text-2xl font-bold text-white mb-6">{t('complaints.new_title')}</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.desc_label')} *</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder={t('complaints.desc_placeholder')} className="w-full px-4 py-3 bg-brand-card border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue resize-none" required></textarea>
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.address_label')} *</label>
                  <AddressAutocomplete 
                    value={formData.adresse} 
                    onChange={(val) => setFormData({ ...formData, adresse: val })} 
                    placeholder={t('complaints.address_placeholder')} 
                  />
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.attachment_label')}</label>
                  <div className="relative w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:border-brand-blue transition-colors cursor-pointer flex items-center gap-2">
                    <FileText size={18} className="text-[#8ca0bc]" />
                    <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span className="text-sm truncate block">
                      {formData.piecesJointes.length > 0 ? t('complaints.file_selected') : t('complaints.file_placeholder')}
                    </span>
                  </div>
                  {formData.piecesJointes.length > 0 && (
                    <div className="mt-3 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      {(formData.piecesJointes[0] instanceof File && formData.piecesJointes[0].type.startsWith('image/')) || (typeof formData.piecesJointes[0] === 'string' && (formData.piecesJointes[0].startsWith('data:image/') || formData.piecesJointes[0].match(/\.(jpeg|jpg|jfif|gif|png|webp)$/i))) ? (
                        <img src={formData.piecesJointes[0] instanceof File ? URL.createObjectURL(formData.piecesJointes[0]) : (formData.piecesJointes[0].startsWith('data:') ? formData.piecesJointes[0] : getFileUrl(formData.piecesJointes[0]))} alt="Aperçu" className="w-16 h-16 object-cover rounded-lg border border-white/10" onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23f87171' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='3' y1='3' x2='21' y2='21'%3E%3C/line%3E%3C/svg%3E"; }} />
                      ) : (
                        <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                          <FileText size={24} className="text-[#8ca0bc]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#8ca0bc]">{t('complaints.file_selected')}</p>
                        <p className="text-sm font-medium text-white truncate">Image / Document</p>
                      </div>
                      <button type="button" onClick={() => setFormData({ ...formData, piecesJointes: [] })} className="text-red-400 hover:text-red-300 p-1 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  {fileError && <p className="text-red-400 text-xs mt-1">{fileError}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-border mt-6">
                  <button type="button" onClick={resetNewForm} className="px-5 py-2.5 rounded-xl font-medium text-brand-muted hover:text-white hover:bg-white/5">{t('complaints.cancel')}</button>
                  <button type="submit" disabled={submitting} className="bg-brand-blue hover:bg-[#2da1ff] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50">
                    {submitting ? t('complaints.submitting') : t('complaints.submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Modifier Réclamation */}
      <AnimatePresence>
        {showEditModal && editingComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-brand-darkBg border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => { setShowEditModal(false); setEditingComplaint(null); setEditFormData({ description: '', adresse: '', piecesJointes: [] }); setEditFileError(''); }} className="absolute top-4 right-4 text-brand-muted hover:text-white"><X size={24} /></button>

              <h3 className="text-2xl font-bold text-white mb-6">{t('complaints.edit_title', { defaultValue: 'Modifier la Réclamation' })}</h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.desc_label')} *</label>
                  <textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={4} placeholder={t('complaints.desc_placeholder')} className="w-full px-4 py-3 bg-brand-card border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue resize-none" required></textarea>
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.address_label')} *</label>
                  <AddressAutocomplete 
                    value={editFormData.adresse} 
                    onChange={(val) => setEditFormData({ ...editFormData, adresse: val })} 
                    placeholder={t('complaints.address_placeholder')} 
                  />
                </div>
                <div>
                  <label className="block text-brand-muted text-sm font-medium mb-2">{t('complaints.attachment_label')}</label>
                  <div className="relative w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:border-brand-blue transition-colors cursor-pointer flex items-center gap-2">
                    <FileText size={18} className="text-[#8ca0bc]" />
                    <input type="file" accept="image/*,.pdf" onChange={handleEditFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span className="text-sm truncate block">
                      {editFormData.piecesJointes.length > 0 ? t('complaints.file_selected') : t('complaints.file_placeholder')}
                    </span>
                  </div>
                  {editFormData.piecesJointes.length > 0 && (
                    <div className="mt-3 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      {(editFormData.piecesJointes[0] instanceof File && editFormData.piecesJointes[0].type.startsWith('image/')) || (typeof editFormData.piecesJointes[0] === 'string' && (editFormData.piecesJointes[0].startsWith('data:image/') || editFormData.piecesJointes[0].match(/\.(jpeg|jpg|jfif|gif|png|webp)$/i))) ? (
                        <img src={editFormData.piecesJointes[0] instanceof File ? URL.createObjectURL(editFormData.piecesJointes[0]) : (editFormData.piecesJointes[0].startsWith('data:') ? editFormData.piecesJointes[0] : getFileUrl(editFormData.piecesJointes[0]))} alt="Aperçu" className="w-16 h-16 object-cover rounded-lg border border-white/10" onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23f87171' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='3' y1='3' x2='21' y2='21'%3E%3C/line%3E%3C/svg%3E"; }} />
                      ) : (
                        <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                          <FileText size={24} className="text-[#8ca0bc]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#8ca0bc]">{t('complaints.file_selected')}</p>
                        <p className="text-sm font-medium text-white truncate">Image / Document</p>
                      </div>
                      <button type="button" onClick={() => setEditFormData({ ...editFormData, piecesJointes: [] })} className="text-red-400 hover:text-red-300 p-1 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  {editFileError && <p className="text-red-400 text-xs mt-1">{editFileError}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-brand-border mt-6">
                  <button type="button" onClick={() => { setShowEditModal(false); setEditingComplaint(null); setEditFormData({ description: '', adresse: '', piecesJointes: [] }); setEditFileError(''); }} className="px-5 py-2.5 rounded-xl font-medium text-brand-muted hover:text-white hover:bg-white/5">{t('complaints.cancel')}</button>
                  <button type="submit" disabled={updating} className="bg-brand-blue hover:bg-[#2da1ff] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50">
                    {updating ? t('complaints.saving') : t('complaints.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Consulter Réponse (Timeline) */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-[#0d1b35] border border-white/10 rounded-2xl p-7 w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedComplaint(null)}
                className="absolute top-4 right-4 text-brand-muted hover:text-white transition-colors z-10 bg-[#0d1b35] rounded-full p-1"
              >
                <X size={22} />
              </button>

              <h3 className="text-xl font-bold text-white mb-6 shrink-0">{t('complaints.details_title')}</h3>

              <div className="overflow-y-auto pr-2 -mr-2">
                {/* Type & Description */}
                <div className="space-y-3 mb-6">
                  <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/8">
                    <p className="text-[#8ca0bc] text-xs mb-1">{t('dashboard.col_type', { defaultValue: 'Type' })}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{translateType(selectedComplaint.type, t)}</p>

                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[#8ca0bc] text-xs font-medium uppercase tracking-wider mb-2">{t('complaints.description_label')}</p>
                    <p className="text-white/90 text-sm leading-relaxed">{selectedComplaint.description}</p>
                  </div>
                  {selectedComplaint.piecesJointes && selectedComplaint.piecesJointes.length > 0 && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[#8ca0bc] text-xs font-medium uppercase tracking-wider mb-2">{t('complaints.attachment_label', { defaultValue: 'Pièce Jointe' })}</p>
                      <a href={getFileUrl(selectedComplaint.piecesJointes[0])} target="_blank" rel="noreferrer">
                        <img
                          src={getFileUrl(selectedComplaint.piecesJointes[0])}
                          alt="Pièce jointe"
                          className="max-w-full max-h-48 object-contain rounded-lg border border-white/10"
                          onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23f87171' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='3' y1='3' x2='21' y2='21'%3E%3C/line%3E%3C/svg%3E"; }}
                        />
                      </a>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <p className="text-[#8ca0bc] text-sm mb-4">{t('complaints.tracking_title')}</p>
                <ComplaintTimeline statut={selectedComplaint.statut} />

                {/* Admin reply */}
                {selectedComplaint.reponseAdmin ? (
                  <div className="bg-brand-blue/10 border border-brand-blue/25 p-4 rounded-xl mt-5">
                    <p className="text-brand-blue text-sm font-bold flex items-center gap-2">
                      {t('complaints.admin_response')}
                      {selectedComplaint.dateTraitement && (
                        <span className="text-xs font-normal opacity-60">
                          {new Date(selectedComplaint.dateTraitement).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    <p className="text-white text-sm mt-2">{selectedComplaint.reponseAdmin}</p>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/8 p-4 rounded-xl mt-5 flex items-center gap-3">
                    <Clock className="text-[#8ca0bc] shrink-0" size={18} />
                    <p className="text-[#8ca0bc] text-sm">{t('complaints.pending_response')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Complaints = () => {
  const user = useAuthStore(state => state.user);
  const role = user?.role || 'user';

  if (role === 'admin') {
    return <AdminComplaints />;
  }

  return <ClientComplaints />;
};

export default Complaints;

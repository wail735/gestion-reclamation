import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddressAutocomplete = ({ value, onChange, placeholder, inputClassName = "" }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = React.useRef(null);

  // Sync prop value only if it comes from outside (not from user typing)
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // Append "Algérie" to restrict search generally, but allow user input
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=dz&addressdetails=1&limit=5`);
      let data = await res.json();
      
      // Filter for Alger and Tipaza if required, though nominatim may use different spellings
      // Since the user asked for Alger and Tipaza seulement, we can filter by state or display_name
      data = data.filter(item => {
          const lowerName = item.display_name.toLowerCase();
          return lowerName.includes('alger') || lowerName.includes('tipaza') || lowerName.includes('tipasa');
      });

      setSuggestions(data);
    } catch (error) {
      console.error("Erreur géocodage:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 3) {
        searchAddress(query);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (suggestion) => {
    const addressName = suggestion.display_name;
    setQuery(addressName);
    onChange(addressName);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => { if (query.length >= 3) setShowDropdown(true); }}
          placeholder={placeholder}
          className={inputClassName || "w-full px-4 py-3 bg-brand-card border border-brand-border text-white rounded-xl focus:outline-none focus:border-brand-blue pr-10"}
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none transition-colors group-focus-within:text-brand-green">
          <MapPin size={16} />
        </div>
      </div>
      <AnimatePresence>
        {showDropdown && (query.length >= 3) && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 w-full mt-1 bg-brand-card border border-brand-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-sm text-brand-muted text-center flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-brand-blue" /> Recherche en cours...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  onClick={() => handleSelect(suggestion)}
                  className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors flex items-start gap-3"
                >
                  <MapPin size={16} className="text-brand-blue shrink-0 mt-0.5" />
                  <p className="text-sm text-white/90 leading-tight text-left">{suggestion.display_name}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-brand-muted text-center">Aucune adresse trouvée (Alger/Tipaza uniquement)</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressAutocomplete;

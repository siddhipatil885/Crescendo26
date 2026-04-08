import React, { useState, useEffect } from 'react';
import { Phone, HardHat, Loader2, UserX, Building2, BadgeCheck, AlertCircle } from 'lucide-react';
import { fetchContractorByName } from '../../services/contractors';

/**
 * ContractorCard
 * Shows contractor info for a given issue.
 * - If contractorName is falsy → "No contractor assigned" state.
 * - Tries to enrich from the Firestore `contractors` collection (optional).
 * - If Firestore lookup fails or returns nothing, still shows the raw name.
 */
export default function ContractorCard({ contractorName }) {
  const [enriched, setEnriched] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contractorName) {
      setEnriched(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchContractorByName(contractorName)
      .then((data) => {
        if (!cancelled) {
          setEnriched(data);
          setLoading(false);
        }
      })
      .catch(() => {
        // Firestore lookup failed — degrade gracefully, still show the string
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [contractorName]);

  // ── No contractor at all ────────────────────────────────────────────
  if (!contractorName) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
        <UserX size={16} className="text-slate-400 shrink-0" />
        <span className="text-sm text-slate-500 font-medium">No contractor assigned</span>
      </div>
    );
  }

  // ── Loading enrichment ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-indigo-500 shrink-0" />
        <span className="text-sm text-slate-500 font-medium">Fetching contractor details…</span>
      </div>
    );
  }

  // ── Resolved data (enriched or raw string fallback) ─────────────────
  const displayName = enriched?.name || contractorName;
  const phone       = enriched?.contact_number || enriched?.phone || enriched?.contactNumber || null;
  const company     = enriched?.company || enriched?.organisation || null;
  const verified    = enriched?.verified ?? false;
  const isPublic    = !displayName.toLowerCase().includes('not public');

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shadow-sm">
          <HardHat size={18} className="text-indigo-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + verified badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-900 font-extrabold text-sm truncate">{displayName}</p>
            {verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                <BadgeCheck size={10} />
                Verified
              </span>
            )}
          </div>

          {/* Company */}
          {company && (
            <p className="text-slate-500 text-xs font-medium mt-0.5 flex items-center gap-1.5 truncate">
              <Building2 size={11} className="shrink-0" />
              {company}
            </p>
          )}

          {/* Phone or notice */}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Phone size={12} />
              {phone}
            </a>
          ) : (
            <p className="text-slate-400 text-xs mt-2 italic">
              {isPublic ? 'Contact not available' : 'Contact details are not public'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

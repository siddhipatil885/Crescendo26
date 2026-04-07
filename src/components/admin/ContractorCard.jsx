import React, { useState, useEffect } from 'react';
import { Phone, HardHat, Loader2, UserX, Building2, BadgeCheck } from 'lucide-react';
import { fetchContractorByName } from '../../services/contractors';

/**
 * ContractorCard
 * Fetches and displays contractor details for a given contractorName.
 * If the issue already carries a flat string, pass it as `contractorName`.
 */
export default function ContractorCard({ contractorName }) {
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contractorName) {
      setContractor(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchContractorByName(contractorName)
      .then((data) => {
        if (!cancelled) {
          setContractor(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('Failed to load contractor details.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [contractorName]);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-3">
        <Loader2 size={18} className="animate-spin text-indigo-500" />
        <span className="text-sm text-slate-500 font-medium">Fetching contractor details…</span>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
        <p className="text-rose-700 text-sm font-medium">{error}</p>
      </div>
    );
  }

  // ── No contractor assigned ───────────────────────────────────────────
  if (!contractor && !contractorName) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-3">
        <UserX size={18} className="text-slate-400" />
        <span className="text-sm text-slate-500 font-medium">No contractor assigned</span>
      </div>
    );
  }

  // If issue had a contractor string but no matching Firestore doc, show the string
  const displayName = contractor?.name || contractorName;
  const phone = contractor?.contact_number || contractor?.phone || contractor?.contactNumber || null;
  const company = contractor?.company || contractor?.organisation || null;
  const verified = contractor?.verified ?? false;

  // ── Contractor Card ──────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shadow-sm">
          <HardHat size={20} className="text-indigo-600" />
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

          {/* Phone */}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Phone size={12} />
              {phone}
            </a>
          ) : (
            <p className="text-slate-400 text-xs mt-2 italic">Contact not available</p>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin, CheckCircle2, Clock, Loader2, LogOut, Search, Filter,
  LayoutDashboard, Map as MapIcon, FileText, Settings, X, ArrowRight, ShieldCheck,
  BarChart3, ListTodo, Download, AlertTriangle, Users, Bell,
  TrendingUp, ClipboardList, Zap, ArrowUpRight, Menu
} from 'lucide-react';
import { assignIssueToWorker, subscribeToIssues, updateIssue } from '../../services/issues';
import { ISSUE_STATUS, isInProgressStatus, isPendingStatus, isResolvedStatus, statusEquals } from '../../utils/constants';
import { timeAgo } from '../../utils/formatters';
import { uploadToCloudinary } from '../../services/storage';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AuthFlow';
import MapView from '../../components/map/MapView';
import ContractorCard from '../../components/admin/ContractorCard';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { fetchActiveWorkers } from '../../services/workers';

const FALLBACK_DEMO_WORKER = {
  id: import.meta.env.VITE_DEMO_WORKER_DOC_ID || '',
  uid: import.meta.env.VITE_DEMO_WORKER_UID || '',
  name: import.meta.env.VITE_DEMO_WORKER_NAME || 'Demo Worker',
  email: (import.meta.env.VITE_DEV_WORKER_EMAILS || '').split(',')[0]?.trim() || 'worker@test.com',
  active: true,
};

function mergeWorkersWithFallback(workersList) {
  const nextWorkers = Array.isArray(workersList) ? workersList.filter(Boolean) : [];

  if (!FALLBACK_DEMO_WORKER.id) {
    return nextWorkers;
  }

  const alreadyPresent = nextWorkers.some((worker) => worker.id === FALLBACK_DEMO_WORKER.id);
  if (alreadyPresent) {
    return nextWorkers;
  }

  return [...nextWorkers, FALLBACK_DEMO_WORKER];
}

const statusBadge = (status, t) => {
  const s = status?.toLowerCase();
  if (isPendingStatus(s)) return { bg: 'bg-rose-100', text: 'text-rose-700', label: t('pending') };
  if (statusEquals(s, ISSUE_STATUS.ASSIGNED)) return { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Assigned' };
  if (isInProgressStatus(s)) return { bg: 'bg-amber-100', text: 'text-amber-700', label: t('in_progress') };
  if (isResolvedStatus(s)) return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('resolved') };
  if (statusEquals(s, ISSUE_STATUS.REJECTED)) return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Rejected' };
  return { bg: 'bg-slate-100', text: 'text-slate-700', label: t('status_unknown') };
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [afterPhotoFile, setAfterPhotoFile] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('admin_notifications') === 'true';
  });

  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const requiresAfterPhoto = (issue, nextStatus, pendingFile = afterPhotoFile) => {
    const isResolving = [ISSUE_STATUS.RESOLVED, ISSUE_STATUS.COMPLETED].includes(nextStatus);
    if (!isResolving) {
      return false;
    }

    return !issue?.afterImage && !issue?.afterImageUrl && !pendingFile;
  };

  useEffect(() => {
    const unsubscribe = subscribeToIssues(
      (data) => {
        setIssues(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      500
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadWorkers = async () => {
      try {
        const workersList = mergeWorkersWithFallback(await fetchActiveWorkers());
        if (!cancelled) {
          setWorkers(workersList);
        }
      } catch (workerError) {
        console.warn('Worker list load failed:', workerError);
        if (!cancelled) {
          const fallbackWorkers = mergeWorkersWithFallback([]);
          setWorkers(fallbackWorkers);
        }
      }
    };

    loadWorkers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('admin_notifications', notificationsEnabled);
  }, [notificationsEnabled]);

  useEffect(() => {
    setAfterPhotoFile(null);
    setSelectedWorkerId(selectedIssue?.assignedTo || '');
  }, [selectedIssue?.id]);

  const handleExportCsv = () => {
    alert("Exporting database to CSV... (Coming soon: Backend integration required)");
  };

  const handleInviteOfficer = () => {
    alert("Opening invitation portal... (Coming soon)");
  };

  const toggleNotifications = (e) => {
    setNotificationsEnabled(e.target.checked);
  };

  const stats = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter(i => isPendingStatus(i.status)).length;
    const inProgress = issues.filter(i => isInProgressStatus(i.status)).length;
    const resolved = issues.filter(i => isResolvedStatus(i.status)).length;

    const today = new Date().setHours(0, 0, 0, 0);
    const resolvedToday = issues.filter(i => {
      if (!isResolvedStatus(i.status)) return false;
      const ts = i.updatedAt || i.updated_at;
      const updatedDate = ts?.toDate ? ts.toDate().setHours(0, 0, 0, 0) : null;
      return updatedDate === today;
    }).length;

    return { total, pending, inProgress, resolved, resolvedToday };
  }, [issues]);
  const categories = useMemo(() => {
    const cats = new Set(issues.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchSearch = issue.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const statusLower = issue.status?.toLowerCase();
      const matchStatus = statusFilter === 'All'
        || (statusFilter === 'Pending' && ['pending', 'open'].includes(statusLower))
        || (statusFilter === 'In Progress' && ['assigned', 'in_progress', 'in progress', 'review'].includes(statusLower))
        || (statusFilter === 'Resolved' && ['resolved', 'completed', 'verified'].includes(statusLower));

      const matchCategory = categoryFilter === 'All' || issue.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [issues, searchQuery, statusFilter, categoryFilter]);

  const handleStatusChange = async (id, newStatus) => {
    setIsUpdating(true);
    try {
      const statusLabel = newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      // Check if resolving and require after photo
      if (requiresAfterPhoto(selectedIssue, newStatus)) {
        alert("Please upload an after photo before marking the issue as resolved.");
        setIsUpdating(false);
        return;
      }

      let updates = { 
        status: newStatus,
        timelineEvent: {
          type: 'status_update',
          title: `Status updated to ${statusLabel}`,
          status: newStatus,
          note: `Operational status marked as ${statusLabel}`,
          createdAt: new Date().toISOString()
        }
      };

      // Upload after photo if provided
      if (afterPhotoFile) {
        const afterImageUrl = await uploadToCloudinary(afterPhotoFile, id, 'after');
        updates.afterImage = afterImageUrl;
        updates.afterImageUrl = afterImageUrl;
      }

      await updateIssue(id, updates);
      
      setSelectedIssue((prev) => {
        if (prev?.id !== id) {
          return prev;
        }

        return {
          ...prev,
          status: newStatus,
          afterImage: updates.afterImage || prev.afterImage,
          afterImageUrl: updates.afterImageUrl || prev.afterImageUrl,
        };
      });
      
      // Clear the file input
      setAfterPhotoFile(null);
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  const executeBulkStatus = async (status) => {
    if (selectedRowIds.size === 0) return;
    
    // Filter out issues that already have the target status
    const ids = Array.from(selectedRowIds).filter(id => {
      const issue = issues.find(i => i.id === id);
      return issue && !statusEquals(issue.status, status);
    });

    if (ids.length === 0) {
      setSelectedRowIds(new Set()); // Clear selection if nothing to update
      return;
    }

    const blockedIds = ids.filter((id) => requiresAfterPhoto(issues.find((issue) => issue.id === id), status, null));
    if (blockedIds.length > 0) {
      alert("One or more selected issues need an after photo before they can be resolved.");
      return;
    }

    const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    const results = await Promise.allSettled(ids.map(id => updateIssue(id, { 
      status, 
      timelineEvent: {
        type: 'status_update',
        title: `Status updated to ${statusLabel}`,
        status: status,
        note: `Operational status bulk-marked as ${statusLabel}`,
        createdAt: new Date().toISOString()
      }
    })));
    
    const failed = [];
    const newSet = new Set(selectedRowIds);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failed.push(`ID ${ids[index]}: ${result.reason.message || result.reason}`);
      } else {
        newSet.delete(ids[index]);
      }
    });

    setSelectedRowIds(newSet);

    if (failed.length > 0) {
      alert(`Bulk update completed with errors:\n${failed.join('\n')}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleAssignWorker = async () => {
    if (!selectedIssue?.id) {
      return;
    }

    const worker = workers.find((entry) => entry.id === selectedWorkerId);
    const normalizedWorker = worker
      ? { id: worker.id, name: worker.name || worker.email, uid: worker.uid || null }
      : null;

    if (!normalizedWorker) {
      alert('Please select a worker before assigning.');
      return;
    }

    setIsUpdating(true);
    try {
      await assignIssueToWorker(selectedIssue.id, normalizedWorker);
      setSelectedIssue((current) => (
        current?.id === selectedIssue.id
          ? {
              ...current,
              assignedTo: normalizedWorker.id,
              assignedWorkerName: normalizedWorker.name,
              assignedWorkerUid: normalizedWorker.uid,
              status: ISSUE_STATUS.ASSIGNED,
            }
          : current
      ));
    } catch (assignmentError) {
      alert(`Assignment failed: ${assignmentError.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const mapCenter = useMemo(() => {
    const withCoords = filteredIssues.filter(i => i.lat && i.lng);
    if (withCoords.length === 0) return [19.0760, 72.8777];
    const sumLat = withCoords.reduce((sum, i) => sum + i.lat, 0);
    const sumLng = withCoords.reduce((sum, i) => sum + i.lng, 0);
    return [sumLat / withCoords.length, sumLng / withCoords.length];
  }, [filteredIssues]);

  const toggleRowSelect = (id) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRowIds(newSet);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'map', icon: MapIcon, label: t('live_map') },
    { id: 'issues', icon: ListTodo, label: t('issue_management') },
    { id: 'analytics', icon: BarChart3, label: t('analytics_reports') },
  ];

  const mobileNavItems = [
    ...navItems,
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  const activeTabTitle = {
    dashboard: t('dashboard'),
    map: t('live_map'),
    issues: t('issue_management'),
    analytics: t('analytics_reports'),
    settings: t('settings'),
  }[activeTab] || t('dashboard');

  /* ===================== RENDER MODULES ===================== */

  const renderDashboard = () => (
    <div className="space-y-6 fade-in">
      {/* SaaS Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <ClipboardList size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reports</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.total}</div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp size={14} className="mr-1" /> +12% from last week
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
              <AlertTriangle size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.pending}</div>
            <p className="text-xs text-rose-500 mt-2 font-medium flex items-center">
              <TrendingUp size={14} className="mr-1" /> Requires attention
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.inProgress}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center">
              Active deployments
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.resolved}</div>
            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
              <TrendingUp size={14} className="mr-1" /> +5% resolution rate
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold tracking-tight text-slate-900 mb-6 flex items-center text-lg">
            Recent Activity Feed
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {issues.slice(0, 10).map(issue => {
              const bgBadge = statusBadge(issue.status, t);
              return (
                <div key={issue.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-colors" onClick={() => setSelectedIssue(issue)}>
                  <img src={issue.beforeImage || issue.beforeImageUrl || 'https://via.placeholder.com/60'} className="w-12 h-12 rounded-lg object-cover shadow-sm bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold tracking-tight text-slate-900 truncate">{issue.category}</h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{issue.description || t('no_description_provided')}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center"><Clock size={12} className="mr-1" /> {timeAgo(issue.createdAt || issue.reported_at)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${bgBadge.bg} ${bgBadge.text}`}>
                      {bgBadge.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold tracking-tight text-slate-900 flex items-center text-lg">
              Category Breakdown
            </h3>
            <button 
              onClick={handleExportCsv}
              aria-label="Export categories to CSV"
              className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center hover:bg-indigo-100 transition-colors"
            >
              <Download size={14} className="mr-1.5" /> Export
            </button>
          </div>
          <div className="flex-1 rounded-xl border border-slate-100 flex items-center justify-center bg-slate-50 p-8 min-h-[300px]">
            <div className="w-full space-y-5">
              {Object.entries(issues.reduce((acc, i) => { acc[i.category || t('other')] = (acc[i.category || t('other')] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="font-bold text-slate-900">{t('reports_count', { count })}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (count / issues.length) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="h-[calc(100vh-140px)] w-full flex flex-col bg-slate-100 rounded-2xl shadow-sm border-4 border-white overflow-hidden fade-in relative isolate">
      <div className="absolute top-6 left-6 z-[400] bg-white/90 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200/50 text-sm font-semibold text-slate-700 flex gap-4">
        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-rose-500 mr-2 shadow-sm"></div> Pending</span>
        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-400 mr-2 shadow-sm"></div> In Progress</span>
        <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-sm"></div> Resolved</span>
      </div>
      <MapView issues={filteredIssues} center={mapCenter} zoom={12} loading={loading} />
    </div>
  );

  const renderIssues = () => (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden fade-in">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <h3 className="font-bold tracking-tight text-slate-900 text-lg">Complaint Management <span className="text-sm font-medium text-slate-400 ml-2 py-0.5 px-2 bg-slate-100 rounded-md">{filteredIssues.length} total</span></h3>
        {selectedRowIds.size > 0 && (
          <div className="flex items-center gap-3 slide-in-right">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              {selectedRowIds.size} Selected
            </span>
            <button onClick={() => executeBulkStatus('in_progress')} className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-lg hover:bg-amber-100 transition shadow-sm">Mark In-Progress</button>
            <button onClick={() => executeBulkStatus('resolved')} className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-lg hover:bg-emerald-100 transition shadow-sm">Mark Resolved</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm text-slate-600 relative border-collapse">
          <thead className="text-xs text-slate-400 uppercase bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
            <tr>
              <th className="p-4 w-12 border-b border-slate-200">
                <input type="checkbox" onChange={(e) => setSelectedRowIds(e.target.checked ? new Set(filteredIssues.map(i => i.id)) : new Set())} checked={selectedRowIds.size === filteredIssues.length && filteredIssues.length > 0} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
              </th>
              <th className="px-4 py-4 font-bold border-b border-slate-200">Media</th>
              <th className="px-4 py-4 font-bold border-b border-slate-200">Incident Details</th>
              <th className="px-4 py-4 font-bold border-b border-slate-200">Status & Verification</th>
              <th className="px-4 py-4 font-bold border-b border-slate-200">Registered</th>
              <th className="px-6 py-4 font-bold text-right border-b border-slate-200">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredIssues.map((issue) => {
              const badge = statusBadge(issue.status, t);
              return (
                <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4">
                    <input type="checkbox" checked={selectedRowIds.has(issue.id)} onChange={() => toggleRowSelect(issue.id)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                  </td>
                  <td className="px-4 py-4">
                    <img src={issue.beforeImage || issue.beforeImageUrl || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shadow-sm cursor-pointer group-hover:scale-105 transition-transform" onClick={() => setSelectedIssue(issue)} alt="Thumbnail" />
                  </td>
                  <td className="px-4 py-4 max-w-[300px] cursor-pointer" onClick={() => setSelectedIssue(issue)}>
                    <div className="font-bold text-slate-900 mb-1 tracking-tight">{issue.category} <span className="font-mono text-[10px] text-slate-400 ml-2 font-normal bg-slate-100 px-1 py-0.5 rounded">#{issue.id?.slice(-5)}</span></div>
                    <div className="text-xs text-slate-500 truncate leading-relaxed">{issue.description || t('no_description')}</div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center font-medium"><MapPin size={12} className="mr-1" /> {issue.neighbourhood || t('location_unknown')}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    {issue.verified_by_citizen && (
                      <span className="inline-flex mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 items-center whitespace-nowrap">
                        <ShieldCheck size={10} className="mr-1" /> {t('verified')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs whitespace-nowrap text-slate-500">
                    <div className="font-medium text-slate-700">{new Date(issue.createdAt || issue.reported_at).toLocaleDateString()}</div>
                    <div className="text-[11px] mt-0.5">{timeAgo(issue.createdAt || issue.reported_at)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      aria-label={`Update issue ${issue.id}`}
                      className="text-indigo-600 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition shadow-sm border border-transparent hover:border-indigo-700" 
                      onClick={() => setSelectedIssue(issue)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 fade-in">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-5xl">
        <h3 className="font-bold tracking-tight text-slate-900 text-xl flex items-center mb-8">
          <BarChart3 size={24} className="mr-2 text-indigo-600" /> Executive Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50 shadow-sm">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Avg Resolution Time</h4>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">42 hrs</div>
            <p className="text-sm text-emerald-600 mt-3 font-semibold flex items-center"><TrendingUp size={16} className="mr-1.5" /> 12% faster than last month</p>
          </div>
          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50 shadow-sm">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Resolved Today</h4>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{stats.resolvedToday}</div>
            <p className="text-sm text-slate-600 mt-3 font-semibold flex items-center"><TrendingUp size={16} className="mr-1.5 text-slate-400" /> Daily throughput</p>
          </div>

          <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50 shadow-sm">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Citizen Engagement</h4>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">842 <span className="text-xl text-slate-400 font-medium tracking-normal">Tokens</span></div>
            <p className="text-sm text-slate-500 mt-3 font-medium flex items-center"><Users size={16} className="mr-1.5" /> Claim tokens issued this period</p>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
          <div>
            <h4 className="font-bold text-indigo-900 text-lg">Generate Offline Report</h4>
            <p className="text-sm text-indigo-700/80 mt-1 font-medium">Export the comprehensive dataset tailored for municipal board review.</p>
          </div>
          <button 
            onClick={handleExportCsv}
            aria-label="Export comprehensive report to CSV"
            className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition hover:shadow-md"
          >
            <Download size={18} className="mr-2" /> Export to CSV
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold tracking-tight text-slate-900 text-xl flex items-center">
            <Settings size={22} className="mr-2 text-slate-400" /> Administrative Personnel
          </h3>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center pb-8 border-b border-slate-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-2xl mr-6 border-2 border-indigo-100 shadow-sm">
              OP
            </div>
            <div>
              <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">Officer Puneet</h4>
              <p className="text-sm text-slate-500 font-medium mt-1 bg-slate-100 inline-block px-2.5 py-1 rounded-md">Public Works Department • Ward C</p>
              <p className="text-xs text-slate-400 mt-2 flex items-center"><Clock size={12} className="mr-1" /> Shift: 08:00 AM - 04:00 PM</p>
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 mb-5 flex items-center"><AlertTriangle size={18} className="mr-2 text-amber-500" /> Notification Preferences</h4>
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={notificationsEnabled}
                onChange={toggleNotifications}
                className="form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition" 
              />
              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Alert me instantly regarding High-Priority categorizations</span>
            </label>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h4 className="text-base font-bold text-slate-900 mb-5 flex items-center"><Users size={18} className="mr-2 text-slate-400" /> Team Management</h4>
            <button 
              onClick={handleInviteOfficer}
              aria-label="Invite a new administrative officer"
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-sm hover:shadow flex items-center"
            >
              Invite New Officer <ArrowUpRight size={16} className="ml-2 opacity-70" />
            </button>
            <p className="text-xs text-slate-400 mt-3 max-w-sm leading-relaxed">Invitations will automatically route new officers to your specific municipal department overview securely.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800 font-sans">

      {/* SIDEBAR - Dark SaaS Theme */}
      <aside className="w-64 bg-slate-900 flex flex-col justify-between hidden md:flex shrink-0 shadow-xl z-20">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
            <div className="bg-indigo-500 p-1.5 rounded-lg mr-3 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white" size={22} />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">CIVIX <span className="text-indigo-400 font-medium">{t('admin_panel')}</span></h1>
          </div>
          <nav className="p-4 space-y-1.5 mt-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-label={`Navigate to ${item.label}`}
                className={`w-full flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <item.icon size={18} className={`mr-3 ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`} /> {item.label}
              </button>
            ))}

            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">{t('system')}</p>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              aria-label={t('settings')}
              className={`w-full flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <Settings size={18} className={`mr-3 ${activeTab === 'settings' ? 'opacity-100' : 'opacity-70'}`} /> {t('settings_personnel')}
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            aria-label="Logout of administrative session"
            className="w-full flex items-center px-4 py-3 text-slate-400 hover:text-white hover:bg-rose-500/10 rounded-xl font-semibold transition-colors group"
          >
            <LogOut size={18} className="mr-3 group-hover:text-rose-400 transition-colors" /> {t('logout_session')}
          </button>
        </div>
      </aside>

      {/* MOBILE NAVIGATION - Slide-over Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-[280px] bg-slate-900 shadow-2xl z-50 md:hidden flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50">
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center">
                <ShieldCheck className="text-indigo-500 mr-2" size={22} /> CIVIX
              </h1>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t('close_menu')}
                className="text-slate-400 hover:text-white p-2"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="p-4 space-y-2 flex-1">
              {mobileNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  aria-label={`Navigate to ${item.label}`}
                  className={`w-full flex items-center px-4 py-4 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <item.icon size={20} className="mr-4" /> {item.label}
                </button>
              ))}
            </nav>
            <div className="p-6 border-t border-slate-800/50 pb-10">
              <button
                onClick={handleLogout}
                aria-label="Logout of session"
                className="w-full flex items-center px-4 py-4 text-rose-400 bg-rose-500/10 rounded-xl font-bold transition-colors"
              >
                <LogOut size={20} className="mr-4" /> {t('logout')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">

        {/* TOP NAVBAR - Crisp White, subtle borders */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t('open_menu')}
              className="md:hidden mr-4 p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{activeTabTitle}</h2>
            {loading && <Loader2 size={18} className="ml-4 animate-spin text-indigo-500" />}
          </div>

          <div className="flex items-center space-x-6">
            <LanguageSwitcher />

            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder={t('search_database')}
                aria-label={t('search_database')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-transparent rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white w-64 bg-slate-100 text-slate-800 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>

            <button 
              aria-label="View notifications"
              className="relative text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 cursor-pointer pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">Puneet S.</p>
              <p className="text-xs font-medium text-slate-500">{t('admin')}</p>
            </div>
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-200 shadow-sm">
                PU
              </div>
            </div>
          </div>
        </header>

        {/* PAGE BODY - Deep Padding, gap spacing */}
        <div className="flex-1 overflow-auto p-8 relative z-0">
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center shadow-sm font-medium">
              <AlertTriangle size={18} className="mr-3" /> {error}
            </div>
          )}

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'map' && renderMap()}
          {activeTab === 'issues' && renderIssues()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}

        </div>
      </main>

      {/* ENHANCED SLIDE-OUT DRAWER */}
      {selectedIssue && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedIssue(null)}></div>
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-slate-200">

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white relative z-10 shrink-0">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center">Complaint Overview</h2>
                <div className="text-xs font-mono font-medium text-slate-400 mt-1">ID: {selectedIssue.id}</div>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">

              {/* Images Section */}
              <div className="space-y-6 mb-8">
                {/* Before Image */}
                <div className="w-full h-72 bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner group">
                  <img src={selectedIssue.beforeImage || selectedIssue.beforeImageUrl || 'https://via.placeholder.com/500'} alt="Before Documentation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">BEFORE</div>
                </div>

                {/* After Image - Only show if exists */}
                {(selectedIssue.afterImage || selectedIssue.afterImageUrl) && (
                  <div className="w-full h-72 bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner group">
                    <img src={selectedIssue.afterImage || selectedIssue.afterImageUrl} alt="After Documentation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">AFTER</div>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Worker Assignment</label>
                <div className="space-y-4">
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    disabled={isUpdating}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select worker</option>
                    {workers.map((worker) => {
                      return (
                        <option key={worker.id} value={worker.id}>
                          {worker.name || worker.email || worker.id}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={handleAssignWorker}
                    disabled={isUpdating || !selectedWorkerId}
                    className="w-full bg-sky-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Assigning...' : 'Assign worker'}
                  </button>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">Current assignee</div>
                    <div className="mt-1">{selectedIssue.assignedWorkerName || selectedIssue.assignedTo || 'Not assigned yet'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Operational Status</label>
                <div className="relative">
                  <select
                    value={selectedIssue.status || ISSUE_STATUS.PENDING}
                    onChange={(e) => handleStatusChange(selectedIssue.id, e.target.value)}
                    disabled={isUpdating}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm cursor-pointer appearance-none"
                  >
                    <option value={ISSUE_STATUS.REPORTED}>📝 Reported</option>
                    <option value={ISSUE_STATUS.OPEN}>🚩 Open / New</option>
                    <option value={ISSUE_STATUS.PENDING}>⚠️ Pending Validation</option>
                    <option value={ISSUE_STATUS.ASSIGNED}>👷 Assigned</option>
                    <option value={ISSUE_STATUS.IN_PROGRESS}>🚧 Action In Progress</option>
                    <option value={ISSUE_STATUS.REVIEW}>🔍 Under Review</option>
                    <option value={ISSUE_STATUS.RESOLVED}>✅ Resolved</option>
                    <option value={ISSUE_STATUS.REJECTED}>❌ Rejected by Citizen</option>
                    <option value={ISSUE_STATUS.COMPLETED}>🏁 Completed</option>
                    <option value={ISSUE_STATUS.VERIFIED}>🛡️ Verified by Citizen</option>
                  </select>
                </div>
              </div>

              {/* After Photo Upload Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resolution Evidence</label>
                {selectedIssue.afterImage || selectedIssue.afterImageUrl ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-emerald-700 font-bold">After photo uploaded successfully</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">Image is displayed above for verification</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-slate-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              alert('File size must be less than 10MB');
                              return;
                            }
                            if (!file.type.startsWith('image/')) {
                              alert('Please select a valid image file');
                              return;
                            }
                            setAfterPhotoFile(file);
                          }
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        aria-label="Select after photo"
                      />
                      <p className="text-xs text-slate-500 mt-2">Click to select or drag and drop image</p>
                    </div>

                    {afterPhotoFile && (
                      <div className="space-y-3">
                        {/* File Preview Card */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900 truncate">{afterPhotoFile.name}</p>
                              <div className="flex gap-3 mt-2 text-[11px] text-slate-500">
                                <span>Size: {(afterPhotoFile.size / 1024 / 1024).toFixed(2)}MB</span>
                                <span>Type: {afterPhotoFile.type.split('/')[1].toUpperCase()}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setAfterPhotoFile(null)}
                              disabled={isUpdating}
                              className="ml-2 p-1.5 hover:bg-slate-200 rounded transition text-slate-400 hover:text-slate-600"
                              aria-label="Remove file"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          
                          {/* Image Preview Thumbnail */}
                          <div className="w-full h-32 bg-slate-200 rounded overflow-hidden mb-3">
                            <img 
                              src={URL.createObjectURL(afterPhotoFile)} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* File Validation Indicators */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[11px]">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-emerald-700 font-medium">Format valid</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-emerald-700 font-medium">Size acceptable</span>
                            </div>
                          </div>
                        </div>

                        {/* Upload Instructions */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <p className="text-xs text-blue-700 font-medium">Requirements:</p>
                          <ul className="text-[11px] text-blue-600 mt-1.5 space-y-1 pl-4">
                            <li>• Clear image of the resolved issue</li>
                            <li>• Maximum file size: 10MB</li>
                            <li>• Supported formats: JPG, PNG, WebP, GIF</li>
                            <li>• Recommended: Well-lit, high-resolution photo</li>
                          </ul>
                        </div>

                        {/* Confirm Upload Button */}
                        <button
                          onClick={async () => {
                            if (isUpdating || !afterPhotoFile) {
                              return;
                            }

                            setIsUpdating(true);
                            try {
                              const afterImageUrl = await uploadToCloudinary(afterPhotoFile, selectedIssue.id, 'after');
                              await updateIssue(selectedIssue.id, { 
                                afterImage: afterImageUrl, 
                                afterImageUrl: afterImageUrl,
                                lastModified: new Date().toISOString()
                              });
                              setSelectedIssue((prev) => {
                                if (prev?.id !== selectedIssue.id) {
                                  return prev;
                                }

                                return {
                                  ...prev,
                                  afterImage: afterImageUrl,
                                  afterImageUrl: afterImageUrl,
                                };
                              });
                              setAfterPhotoFile(null);
                              alert('✓ After photo confirmed and uploaded successfully!');
                            } catch (err) {
                              alert('✗ Upload failed: ' + err.message);
                            } finally {
                              setIsUpdating(false);
                            }
                          }}
                          disabled={isUpdating}
                          className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          aria-label="Confirm photo upload"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              Confirm Upload
                            </>
                          )}
                        </button>

                        {/* Helpful Tip */}
                        <p className="text-xs text-slate-500 text-center italic">After upload, the photo will appear above for review. You can then mark the issue as resolved.</p>
                      </div>
                    )}

                    {!afterPhotoFile && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">Upload a photo showing the resolved issue (required for resolution)</p>
                    )}
                  </div>
                )}
              </div>

              {selectedIssue.verified_by_citizen && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 flex items-start shadow-sm">
                  <div className="bg-emerald-100 p-2 rounded-xl mr-4 text-emerald-600 mt-0.5 border border-emerald-200 shadow-sm"><ShieldCheck size={20} /></div>
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-900 tracking-tight">Resolution Authenticated</h4>
                    <p className="text-xs text-emerald-700 mt-1.5 font-medium leading-relaxed">Citizen successfully uploaded physical verification of the structural resolution.</p>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Citizen Verification</h4>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-semibold capitalize">
                      {selectedIssue.citizenVerification?.status || 'pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Verified At</span>
                    <span className="font-semibold">
                      {selectedIssue.citizenVerification?.verifiedAt?.toDate
                        ? selectedIssue.citizenVerification.verifiedAt.toDate().toLocaleString()
                        : selectedIssue.citizenVerification?.verifiedAt || 'Awaiting citizen response'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Worker Proof</span>
                    <span className="font-semibold">
                      {selectedIssue.afterUploadMeta?.timestamp ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asset Category</h4>
                  <p className="font-bold text-slate-900 text-sm bg-slate-100 inline-block px-3 py-1.5 rounded-lg border border-slate-200">{selectedIssue.category || 'Uncategorized'}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Citizen Deposition</h4>
                  <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl overflow-wrap break-words whitespace-pre-wrap font-medium">{selectedIssue.description || selectedIssue.text || 'No textual description.'}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contractor Details</h4>
                  <ContractorCard contractorName={selectedIssue.contractor} />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logged Timestamp</h4>
                    <p className="text-slate-800 text-sm flex items-center font-bold"><Clock size={14} className="mr-2 text-slate-400" /> {timeAgo(selectedIssue.createdAt || selectedIssue.reported_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coordinates</h4>
                    <p className="text-slate-800 text-sm flex items-center font-bold"><MapPin size={14} className="mr-2 text-slate-400" /> <span className="truncate">{selectedIssue.neighbourhood || 'Unknown Node'}</span></p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

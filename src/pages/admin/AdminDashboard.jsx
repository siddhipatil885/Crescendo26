import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, CheckCircle2, Clock, Loader2, LogOut, Search, Filter, 
  LayoutDashboard, Map as MapIcon, FileText, Settings, X, ArrowRight, ShieldCheck
} from 'lucide-react';
import { subscribeToIssues, updateIssue } from '../../services/issues';
import { timeAgo } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AuthFlow';
import MapView from '../../components/map/MapView';

const statusBadge = (status) => {
  const s = status?.toLowerCase();
  if (s === 'pending' || s === 'open') return { bg: 'bg-red-100', text: 'text-red-700', label: 'PENDING' };
  if (['in_progress', 'in progress', 'review', 'rti generated'].includes(s)) return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'IN PROGRESS' };
  if (['resolved', 'completed', 'verified'].includes(s)) return { bg: 'bg-green-100', text: 'text-green-700', label: 'RESOLVED' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'UNKNOWN' };
};

export default function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Drawer
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAdminAuth();

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
      500 // Fetch a larger batch for the desktop command center
    );
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter(i => ['pending', 'open'].includes(i.status?.toLowerCase())).length;
    const inProgress = issues.filter(i => ['in_progress', 'in progress', 'review', 'rti generated'].includes(i.status?.toLowerCase())).length;
    const resolved = issues.filter(i => ['resolved', 'completed', 'verified'].includes(i.status?.toLowerCase())).length;
    return { total, pending, inProgress, resolved };
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
        || (statusFilter === 'In Progress' && ['in_progress', 'in progress', 'review', 'rti generated'].includes(statusLower))
        || (statusFilter === 'Resolved' && ['resolved', 'completed', 'verified'].includes(statusLower));

      const matchCategory = categoryFilter === 'All' || issue.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [issues, searchQuery, statusFilter, categoryFilter]);

  const handleStatusChange = async (id, newStatus) => {
    setIsUpdating(true);
    try {
      await updateIssue(id, { status: newStatus });
      if (selectedIssue && selectedIssue.id === id) {
        setSelectedIssue(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Compute robust map bounds/center
  const mapCenter = useMemo(() => {
    const withCoords = filteredIssues.filter(i => i.lat && i.lng);
    if (withCoords.length === 0) return [19.0760, 72.8777]; // Default fallback location
    const sumLat = withCoords.reduce((sum, i) => sum + i.lat, 0);
    const sumLng = withCoords.reduce((sum, i) => sum + i.lng, 0);
    return [sumLat / withCoords.length, sumLng / withCoords.length];
  }, [filteredIssues]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <ShieldCheck className="text-slate-900 mr-2" size={24} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CIVIX <span className="text-indigo-600">Admin</span></h1>
          </div>
          <nav className="p-4 space-y-1">
            <button className="w-full flex items-center px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium transition-colors">
              <LayoutDashboard size={18} className="mr-3" /> Dashboard
            </button>
            <button className="w-full flex items-center px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
              <MapIcon size={18} className="mr-3" /> Map View
            </button>
            <button className="w-full flex items-center px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
              <FileText size={18} className="mr-3" /> Reports
            </button>
            <button className="w-full flex items-center px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
              <Settings size={18} className="mr-3" /> Officer Settings
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            <LogOut size={18} className="mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-slate-800">Command Center</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by keyword..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 bg-slate-50 transition-shadow"
              />
            </div>
            
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 transition-colors hover:bg-white">
              <Filter className="text-slate-400 ml-2" size={14} />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-slate-600 py-1 pl-2 pr-6 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 transition-colors hover:bg-white">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-slate-600 py-1 pl-2 pr-6 focus:outline-none cursor-pointer"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
              </select>
            </div>
            
            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm ml-2">
              OP
            </div>
          </div>
        </header>

        {/* SCROLLABLE PAGE BODY */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          
          {error && (
             <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center shadow-sm">
              <span className="font-semibold mr-2">System Error:</span> {error}
            </div>
          )}

          {/* KEY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Total Reported</span>
              <div className="text-3xl font-extrabold text-slate-800 mt-2">{stats.total}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-red-400 tracking-wider uppercase">Open / Pending</span>
              <div className="text-3xl font-extrabold text-red-600 mt-2">{stats.pending}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">In Progress</span>
              <div className="text-3xl font-extrabold text-blue-600 mt-2">{stats.inProgress}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-green-500 tracking-wider uppercase">Resolved</span>
              <div className="text-3xl font-extrabold text-green-600 mt-2">{stats.resolved}</div>
            </div>
          </div>

          {/* MAIN TWO-COLUMN LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-270px)] min-h-[500px]">
            
            {/* DATA TABLE (60%) */}
            <div className="lg:w-[60%] flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
                <h3 className="font-semibold text-slate-800">Recent Citations & Reports</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{filteredIssues.length} results found</span>
              </div>
              
              <div className="overflow-y-auto flex-1 p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Loader2 size={32} className="animate-spin mb-4" />
                    <p>Loading database records...</p>
                  </div>
                ) : filteredIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50">
                    <CheckCircle2 size={48} className="mb-4 text-slate-200" />
                    <h4 className="text-lg font-medium text-slate-600 mb-1">No reports matching criteria</h4>
                    <p className="text-sm">Try adjusting your filters or search constraints.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm text-slate-600 relative">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Incident</th>
                        <th className="px-5 py-3 font-semibold">Classification</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Registered</th>
                        <th className="px-5 py-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredIssues.map((issue) => {
                        const badge = statusBadge(issue.status);
                        return (
                          <tr 
                            key={issue.id} 
                            onClick={() => setSelectedIssue(issue)}
                            className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                          >
                            <td className="px-5 py-3 align-middle">
                              <div className="flex items-center">
                                <img 
                                  src={issue.beforeImage || issue.beforeImageUrl || 'https://via.placeholder.com/150'} 
                                  className="w-10 h-10 rounded-full object-cover mr-3 bg-slate-100 border border-slate-200 group-hover:border-indigo-300 transition-colors"
                                  alt="Thumbnail"
                                />
                                <div className="font-mono text-slate-600 text-xs hidden sm:block w-20 truncate">#{issue.id?.slice(-5).toUpperCase()}</div>
                              </div>
                            </td>
                            <td className="px-5 py-3 align-middle max-w-[200px]">
                              <div className="font-semibold text-slate-800 mb-0.5 truncate">{issue.category || 'Unassigned'}</div>
                              <div className="text-xs text-slate-500 truncate">{issue.neighbourhood || 'Location Unknown'}</div>
                            </td>
                            <td className="px-5 py-3 align-middle">
                              <span className={`inline-flex items-center px-2 py-1.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${badge.bg} ${badge.text}`}>
                                {badge.label}
                                {issue.verified_by_citizen && <ShieldCheck size={12} className="ml-1 opacity-80" />}
                              </span>
                            </td>
                            <td className="px-5 py-3 align-middle text-xs whitespace-nowrap text-slate-500">
                              {timeAgo(issue.createdAt || issue.reported_at)}
                            </td>
                            <td className="px-5 py-3 align-middle text-right">
                              <button 
                                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center ml-auto border border-indigo-100 hover:border-indigo-600 shadow-sm"
                                onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }}
                              >
                                View <ArrowRight size={14} className="ml-1" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* GEO MAP VIEW (40%) */}
            <div className="lg:w-[40%] bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative z-0">
              <div className="px-5 py-4 border-b border-slate-100 bg-white shadow-sm shrink-0 flex items-center">
                <MapPin size={16} className="text-slate-400 mr-2" />
                <h3 className="font-semibold text-slate-800">Geographic Heatmap</h3>
              </div>
              <div className="flex-1 w-full bg-slate-100 relative isolate">
                <MapView 
                  issues={filteredIssues}
                  center={mapCenter}
                  zoom={12}
                  loading={loading}
                />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* DRAWER / MODAL OVERLAY */}
      {selectedIssue && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedIssue(null)}></div>
          <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-slate-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Review Report</h2>
                <div className="text-xs font-mono text-slate-500 mt-0.5">ID: {selectedIssue.id}</div>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)} 
                className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content Space */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              
              {/* Evidence Photo */}
              <div className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden mb-6 relative border border-slate-200 shadow-sm">
                <img 
                  src={selectedIssue.beforeImage || selectedIssue.beforeImageUrl || 'https://via.placeholder.com/500'} 
                  alt="Documentation" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                  Field Documentation
                </div>
              </div>

              {/* Status Update Module */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operational Status</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedIssue.status?.toLowerCase() || 'pending'}
                    onChange={(e) => handleStatusChange(selectedIssue.id, e.target.value)}
                    disabled={isUpdating}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm cursor-pointer"
                  >
                    <option value="pending">⚠️ Pending Validation</option>
                    <option value="in_progress">🚧 Action In Progress</option>
                    <option value="resolved">✅ Resolved & Closed</option>
                  </select>
                </div>
              </div>

              {/* Verified Notice */}
              {selectedIssue.verified_by_citizen && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start shadow-sm">
                  <div className="bg-emerald-100 p-1.5 rounded-full mr-3 text-emerald-600 mt-0.5 border border-emerald-200">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Resolution Authenticated</h4>
                    <p className="text-xs text-emerald-600 mt-1">A local citizen has physically uploaded verification of the resolution.</p>
                  </div>
                </div>
              )}
              {selectedIssue.verification_photo_url && (
                <div className="mb-6 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center"><CheckCircle2 size={14} className="mr-1.5 text-slate-400" /> Completion Evidence</h4>
                  <div className="w-full h-40 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                    <img 
                      src={selectedIssue.verification_photo_url} 
                      alt="Verification" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Metadata Panel */}
              <div className="space-y-5 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Asset Category</h4>
                  <p className="font-semibold text-slate-800 text-sm bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">{selectedIssue.category || 'Uncategorized'}</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Citizen Deposition</h4>
                  <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg overflow-wrap break-words whitespace-pre-wrap">{selectedIssue.description || selectedIssue.text || 'No textual description provided by the reporter.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Logged Timestamp</h4>
                    <p className="text-slate-700 text-sm flex items-center font-medium">
                      <Clock size={14} className="mr-1.5 text-slate-400" /> 
                      {timeAgo(selectedIssue.createdAt || selectedIssue.reported_at)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coordinates</h4>
                    <p className="text-slate-700 text-sm flex items-center font-medium">
                      <MapPin size={14} className="mr-1.5 text-slate-400" /> 
                      <span className="truncate">{selectedIssue.neighbourhood || 'Unknown Node'}</span>
                    </p>
                    {selectedIssue.lat && (
                      <p className="text-[10px] font-mono text-slate-500 mt-1 ml-5">
                        {selectedIssue.lat.toFixed(5)}, {selectedIssue.lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>

                {selectedIssue.claimToken && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">Security Hash <ShieldCheck size={12} className="ml-1 text-slate-300"/></h4>
                    <p className="font-mono text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 break-all">{selectedIssue.claimToken}</p>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </>
      )}

    </div>
  );
}

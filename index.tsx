import { useStore } from './src/store/useStore';
import { useMuseumSync } from './src/hooks/useMuseumSync';
import { useMuseumActions } from './src/hooks/useMuseumActions';
import { getStatusStyles, getContrastColor, ALBERTA_HOLIDAYS, MONTHS, FY_QUARTERS, BASE_LANE_HEIGHT, TRACK_HEIGHT, HEADER_HEIGHT, STANDARD_BAR_HEIGHT, PHASE_BAR_HEIGHT, MILESTONE_COLORS } from './src/constants';
import { toISODate, getPositionFromDate, getDateFromPosition, formatBarDate } from './src/lib/dateUtils';
import { calculateTracks } from './src/lib/layoutEngine';
import { Exhibition, PhaseType, LocationMilestone, ProjectPhase, ExhibitionStatus } from './src/types';
import { DetailPanel } from './src/components/DetailPanel';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  X,
  User,
  MapPin,
  Trash2,
  Check,
  Edit2,
  Building2,
  Settings,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Printer,
  Calendar,
  Eye,
  CalendarOff,
  RefreshCw,
  CircleCheck,
  Copy,
  Clock,
  Layers,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Palette,
  Info,
  Filter,
  Search,
  MoreVertical,
  GripVertical,
  Flag,
  AlertTriangle,
  LogOut,
  LogIn,
  Cloud,
  CloudOff,
  History
} from 'lucide-react';

import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  serverTimestamp 
} from './src/lib/firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  writeBatch,
  getDoc
} from 'firebase/firestore';

// --- Types & Constants ---

// --- Components ---


// --- Main App ---

export default function MasterScheduler() {
  const { currentUser, syncStatus, setSyncStatus, isInitialLoad } = useMuseumSync();
  const { 
    museumName, setMuseumName,
    galleries, setGalleries,
    phaseTypes, setPhaseTypes,
    exhibitions, setExhibitions,
    locationMilestones, setLocationMilestones,
    monthWidth, setMonthWidth,
    timelineStartDate, setTimelineStartDate,
    timelineEndDate, setTimelineEndDate,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    showHolidays, setShowHolidays
  } = useStore();
  const { handleUpdateExhibition, handleRemoveExhibition, handleUpdateGalleryName, handleAddGallery, handleRemoveGallery, handleDuplicateProject } = useMuseumActions(currentUser, setSyncStatus);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'settings'>('portfolio');
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  
  const [draggingBarId, setDraggingBarId] = useState<string | null>(null);
  const [dragStartMouseX, setDragStartMouseX] = useState(0);
  const [dragStartProjectX, setDragStartProjectX] = useState(0);
  const [dragDurationDays, setDragDurationDays] = useState(0);
  const [dragTempStartDate, setDragTempStartDate] = useState<string | null>(null);
  const [dragTempEndDate, setDragTempEndDate] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);

  const [editMilestoneDraft, setEditMilestoneDraft] = useState<LocationMilestone | null>(null);

  const applyPreset = (years: number) => {
    if (isNaN(years)) return;
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    setTimelineStartDate(toISODate(new Date(d.getFullYear(), d.getMonth(), 1)));
    const e = new Date(d);
    e.setFullYear(e.getFullYear() + years);
    setTimelineEndDate(toISODate(new Date(e.getFullYear(), e.getMonth(), 0)));
    
    // Auto-adjust zoom for 3Y print compatibility if 3 years selected
    if (years === 3) {
      setMonthWidth(45);
    } else if (years === 1) {
      setMonthWidth(120);
    }
  };

  const filteredExhibitions = useMemo(() => {
    return exhibitions.filter(ex => {
      const matchesSearch = ex.title.toUpperCase().includes(searchQuery.toUpperCase()) || 
                           (ex.exhibitionId || '').toUpperCase().includes(searchQuery.toUpperCase());
      const matchesStatus = statusFilter === 'All' || ex.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exhibitions, searchQuery, statusFilter]);

  const viewMonths = useMemo(() => {
    let start = new Date(timelineStartDate + 'T12:00:00');
    let end = new Date(timelineEndDate + 'T12:00:00');
    if (isNaN(start.getTime())) start = new Date();
    if (isNaN(end.getTime())) end = new Date();
    if (start > end) end = start;

    const months = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMarker = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (current <= endMarker) {
      const y = current.getFullYear();
      const m = current.getMonth();
      let fyQ = '';
      if (m >= 3 && m <= 5) fyQ = 'Q1';
      else if (m >= 6 && m <= 8) fyQ = 'Q2';
      else if (m >= 9 && m <= 11) fyQ = 'Q3';
      else fyQ = 'Q4';

      months.push({ year: y, month: m, label: MONTHS[m], fyQuarter: fyQ });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }, [timelineStartDate, timelineEndDate]);

  const holidayMilestones = useMemo(() => {
    return ALBERTA_HOLIDAYS.map(h => ({
      ...h,
      xPos: getPositionFromDate(h.date, monthWidth, viewMonths)
    })).sort((a, b) => a.xPos - b.xPos);
  }, [monthWidth, viewMonths]);

  const holidayLabelPositions = useMemo(() => {
    const positions = new Array(holidayMilestones.length).fill('top');
    let lastTopX = -9999;
    let lastBottomX = -9999;
    for (let i = 0; i < holidayMilestones.length; i++) {
      const curr = holidayMilestones[i];
      if (curr.xPos < -100 || curr.xPos > viewMonths.length * monthWidth + 100) continue;
      
      if (curr.xPos - lastTopX >= 55) {
        positions[i] = 'top';
        lastTopX = curr.xPos;
      } else if (curr.xPos - lastBottomX >= 55) {
        positions[i] = 'bottom';
        lastBottomX = curr.xPos;
      } else {
        positions[i] = 'top';
      }
    }
    return positions;
  }, [holidayMilestones, viewMonths.length, monthWidth]);

  const yearBlocks = useMemo(() => {
    const blocks: {label: number, count: number}[] = [];
    let currentYear = -1;
    let count = 0;
    viewMonths.forEach(m => {
      if (m.year !== currentYear) {
        if (currentYear !== -1) blocks.push({ label: currentYear, count });
        currentYear = m.year;
        count = 1;
      } else {
        count++;
      }
    });
    if (currentYear !== -1) blocks.push({ label: currentYear, count });
    return blocks;
  }, [viewMonths]);

  const fyBlocks = useMemo(() => {
    const blocks: {label: string, count: number}[] = [];
    let currentFY = -1;
    let count = 0;
    viewMonths.forEach(m => {
      const fy = m.month >= 3 ? m.year : m.year - 1;
      if (fy !== currentFY) {
        if (currentFY !== -1) blocks.push({ label: `FY${String(currentFY).slice(2)}`, count });
        currentFY = fy;
        count = 1;
      } else {
        count++;
      }
    });
    if (currentFY !== -1) blocks.push({ label: `FY${String(currentFY).slice(2)}`, count });
    return blocks;
  }, [viewMonths]);

  const fyQuarterBlocks = useMemo(() => {
    const blocks: {label: string, count: number}[] = [];
    let currentQ = '';
    let currentFY = -1;
    let count = 0;
    viewMonths.forEach(m => {
      const fy = m.month >= 3 ? m.year + 1 : m.year;
      const q = m.fyQuarter;
      if (q !== currentQ || fy !== currentFY) {
        if (currentQ !== '') blocks.push({ label: currentQ, count });
        currentQ = q;
        currentFY = fy;
        count = 1;
      } else {
        count++;
      }
    });
    if (currentQ !== '') blocks.push({ label: currentQ, count });
    return blocks;
  }, [viewMonths]);

  const galleryLayouts = useMemo(() => {
    const layouts: { [gallery: string]: { tracks: { [id: string]: number }, maxTracks: number } } = {};
    galleries.forEach(gallery => {
      const galleryProjects = filteredExhibitions.filter(ex => ex.gallery === gallery);
      const layoutInfo = calculateTracks(galleryProjects, monthWidth, viewMonths, phaseTypes);
      layouts[gallery] = { tracks: layoutInfo.tracks, maxTracks: layoutInfo.maxTracks };
    });
    return layouts;
  }, [filteredExhibitions, galleries, monthWidth, viewMonths, phaseTypes]);

  const todayPos = useMemo(() => {
    return getPositionFromDate(toISODate(new Date()), monthWidth, viewMonths);
  }, [monthWidth, viewMonths]);

  const onBarMouseDown = (e: React.MouseEvent, project: Exhibition) => {
    if (e.button !== 0) return;
    const projectX = getPositionFromDate(project.startDate, monthWidth, viewMonths);
    const start = new Date(project.startDate + 'T12:00:00');
    const end = new Date(project.endDate + 'T12:00:00');
    const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const mouseX = e.clientX;

    longPressTimerRef.current = window.setTimeout(() => {
      setDraggingBarId(project.id);
      setDragStartMouseX(mouseX);
      setDragStartProjectX(projectX);
      setDragDurationDays(durationDays);
    }, 400);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-black flex flex-col font-sans overflow-hidden select-none antialiased ${draggingBarId ? 'cursor-grabbing' : ''}`}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-left: 1px solid #cbd5e1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
        .is-grabbing { cursor: grabbing !important; }
        
        .timeline-container {
          outline: none;
        }

        input[type="range"] {
          -webkit-appearance: none;
          background: #e2e8f0;
          height: 4px;
          border-radius: 2px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 8px;
          background: #000;
          border: 1px solid #000;
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scaleY(1.2);
        }
        
        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid black;
          outline-offset: 2px;
        }

        .project-bar-dragging {
          opacity: 0.6 !important;
          z-index: 100 !important;
          cursor: grabbing !important;
          box-shadow: 6px 6px 0 0 rgba(0,0,0,1) !important;
          transform: translateY(-2px) !important;
        }

        .gallery-lane-bg {
          background-image: repeating-linear-gradient(0deg, transparent, transparent ${TRACK_HEIGHT - 1}px, rgba(0,0,0,0.02) ${TRACK_HEIGHT - 1}px, rgba(0,0,0,0.02) ${TRACK_HEIGHT}px);
          background-position: 0 24px;
        }
      `}</style>
      
      {editMilestoneDraft && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditMilestoneDraft(null)}>
          <div className="bg-white border border-slate-300 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 text-white px-4 py-3 font-semibold tracking-widest flex justify-between items-center text-[10px]">
              <span>EDIT MILESTONE</span>
              <button aria-label="Close" onClick={() => setEditMilestoneDraft(null)} className="hover:text-red-400 transition-colors">
                <X size={14} strokeWidth={3} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Milestone Title</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded p-3 font-semibold uppercase text-sm outline-none focus:bg-slate-50 transition-colors" 
                  value={editMilestoneDraft.title} 
                  onChange={(e) => setEditMilestoneDraft({ ...editMilestoneDraft, title: e.target.value.toUpperCase() })} 
                  autoFocus 
                  placeholder="E.G. BOARD MEETING"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Date</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded p-3 font-medium uppercase text-sm outline-none focus:bg-slate-50 transition-colors" 
                  value={editMilestoneDraft.date} 
                  onChange={(e) => setEditMilestoneDraft({ ...editMilestoneDraft, date: e.target.value })} 
                />
              </div>
              
              <div className="space-y-4">
                <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Milestone Icon & Color</label>
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={() => setEditMilestoneDraft({ ...editMilestoneDraft, icon: 'diamond' })}
                    className={`flex items-center space-x-2 px-4 py-2 border-2 transition-colors ${editMilestoneDraft.icon !== 'flag' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="w-3 h-3 bg-white border border-slate-300 rotate-45" />
                    <span className="text-[10px] font-medium uppercase">Diamond</span>
                  </button>
                  <button 
                    onClick={() => setEditMilestoneDraft({ ...editMilestoneDraft, icon: 'flag' })}
                    className={`flex items-center space-x-2 px-4 py-2 border-2 transition-colors ${editMilestoneDraft.icon === 'flag' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Flag size={14} fill="white" stroke="black" strokeWidth={2} />
                    <span className="text-[10px] font-medium uppercase">Flag</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {MILESTONE_COLORS.map(c => (
                    <button 
                      key={c.value}
                      onClick={() => setEditMilestoneDraft({ ...editMilestoneDraft, color: c.value })}
                      className={`flex items-center space-x-2 px-3 py-1.5 border-2 hover:bg-slate-50 transition-colors ${editMilestoneDraft.color === c.value || (!editMilestoneDraft.color && c.value === '#dc2626') ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}
                    >
                      <div className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: c.value }} />
                      <span className="text-[8px] font-medium tracking-widest uppercase">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/10 mt-6">
                <button 
                  onClick={async () => {
                    const idToRemove = editMilestoneDraft.id;
                    setLocationMilestones(prev => prev.filter(m => m.id !== idToRemove));
                    setEditMilestoneDraft(null);
                    if (currentUser) {
                      try {
                        setSyncStatus('syncing');
                        const { deleteDoc } = await import('firebase/firestore');
                        await deleteDoc(doc(db, 'users', currentUser.uid, 'milestones', idToRemove));
                        setSyncStatus('synced');
                      } catch (err) {
                        setSyncStatus('error');
                      }
                    }
                  }} 
                  className="text-red-600 font-semibold text-[10px] uppercase tracking-widest hover:underline flex items-center"
                >
                  <Trash2 size={12} className="mr-1.5" strokeWidth={3} /> DELETE
                </button>
                <button 
                  onClick={async () => {
                    if (editMilestoneDraft.title.trim() === '') {
                      const idToRemove = editMilestoneDraft.id;
                      setLocationMilestones(prev => prev.filter(m => m.id !== idToRemove));
                      if (currentUser) {
                        try {
                          setSyncStatus('syncing');
                          const { deleteDoc } = await import('firebase/firestore');
                          await deleteDoc(doc(db, 'users', currentUser.uid, 'milestones', idToRemove));
                          setSyncStatus('synced');
                        } catch (err) {
                          setSyncStatus('error');
                        }
                      }
                    } else {
                      setLocationMilestones(prev => prev.map(m => m.id === editMilestoneDraft.id ? editMilestoneDraft : m));
                      if (currentUser) {
                        try {
                          setSyncStatus('syncing');
                          await setDoc(doc(db, 'users', currentUser.uid, 'milestones', editMilestoneDraft.id), {
                            ...editMilestoneDraft,
                            ownerId: currentUser.uid,
                            updatedAt: serverTimestamp()
                          });
                          setSyncStatus('synced');
                        } catch (err) {
                          setSyncStatus('error');
                        }
                      }
                    }
                    setEditMilestoneDraft(null);
                  }} 
                  className="bg-slate-900 text-white px-6 py-2.5 border border-slate-300 rounded font-medium uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
                >
                  SAVE OVERRIDE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProjectId && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-[90] no-print backdrop-blur-[2px]" 
            onClick={() => setSelectedProjectId(null)} 
          />
          <DetailPanel 
            key={selectedProjectId}
            exhibition={exhibitions.find(p => p.id === selectedProjectId)!} 
            onClose={() => setSelectedProjectId(null)} 
            onUpdate={handleUpdateExhibition} 
            onDelete={(id) => { setExhibitions(exhibitions.filter(x => x.id !== id)); setSelectedProjectId(null); }}
            onDuplicate={handleDuplicateProject}
            galleries={galleries}
            phaseTypes={phaseTypes}
          />
        </AnimatePresence>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'portfolio' ? (
          <>
            <header className="bg-white border-b border-slate-200 z-50 shrink-0">
      <nav className="px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
                <div className="flex items-center shrink-0 space-x-6">
                  <div className="flex flex-col">
                    <h1 className="text-[11px] font-semibold tracking-tight uppercase leading-none">{museumName}</h1>
                  </div>

                  <div className="flex items-center space-x-2 no-print border-l border-slate-200 pl-6">
                    <div className="relative group">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" />
                      <input 
                        className="h-8 pl-9 pr-4 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium uppercase outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-slate-300 transition-all w-[180px]"
                        placeholder="Search Portfolio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-1 border border-slate-200 rounded h-8 px-1.5 bg-slate-50">
                      <Filter size={12} className="text-slate-400 ml-1" />
                      <select 
                        className="bg-transparent border-none outline-none text-[9px] font-semibold uppercase cursor-pointer px-1 pr-6"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                      >
                        <option value="All">ALL STATUS</option>
                        <option value="Proposed">PROPOSED</option>
                        <option value="In Development">IN DEV</option>
                        <option value="Open to Public">OPEN</option>
                        <option value="Closed">CLOSED</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 no-print shrink-0">
                  {/* Cloud Sync Status Indicator */}
                  <div className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[8px] font-semibold uppercase tracking-tighter border transition-colors ${
                    !currentUser ? 'bg-slate-100 text-slate-400 border-slate-200' :
                    syncStatus === 'syncing' ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse' :
                    syncStatus === 'synced' ? 'bg-green-50 text-green-600 border-green-200' :
                    syncStatus === 'error' ? 'bg-red-50 text-red-600 border-red-200 shadow-[2px_2px_0_rgba(220,38,38,0.1)]' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {!currentUser ? <CloudOff size={10} /> : syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} />}
                    <span>{
                      !currentUser ? 'Local Mode' :
                      syncStatus === 'syncing' ? 'Syncing...' :
                      syncStatus === 'synced' ? 'Cloud Synced' :
                      syncStatus === 'error' ? 'Sync Error' : 'Online'
                    }</span>
                  </div>

                  {/* Auth Buttons */}
                  <div className="flex items-center mr-2 border-r border-slate-200 pr-4">
                    {currentUser ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-semibold uppercase leading-none text-slate-800">{currentUser.displayName || 'Me'}</span>
                          <span className="text-[7px] font-medium text-slate-400 leading-none mt-1">{currentUser.email}</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (window.confirm('Sign out and switch to local mode?')) {
                              logout().then(() => window.location.reload());
                            }
                          }}
                          className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 text-slate-600 hover:text-red-600 transition-colors"
                          title="Sign Out"
                        >
                          <LogOut size={16} strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={signInWithGoogle}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-300 rounded font-semibold uppercase text-[9px] hover:bg-slate-800 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <LogIn size={12} strokeWidth={3} />
                        <span>Sign In to Sync</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 border border-slate-300 rounded px-2 py-1 bg-slate-50">
                    <input aria-label="Timeline start date" type="date" value={timelineStartDate} onChange={(e) => setTimelineStartDate(e.target.value)} className="bg-transparent text-[9px] font-semibold uppercase outline-none w-[100px]" />
                    <span className="font-medium text-slate-300">-</span>
                    <input aria-label="Timeline end date" type="date" value={timelineEndDate} onChange={(e) => setTimelineEndDate(e.target.value)} className="bg-transparent text-[9px] font-semibold uppercase outline-none w-[100px]" />
                    <select aria-label="Select timeline view preset" onChange={(e) => applyPreset(parseInt(e.target.value))} className="bg-transparent text-[9px] font-semibold uppercase outline-none ml-1 border-l border-slate-200 pl-1 cursor-pointer">
                      <option value="3">PRESETS</option>
                      <option value="1">1 YEAR</option>
                      <option value="2">2 YEARS</option>
                      <option value="3">3 YEARS</option>
                      <option value="4">4 YEARS</option>
                      <option value="5">5 YEARS</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-3 border border-slate-300 rounded px-3 py-1 bg-slate-50">
                    <button 
                      aria-label="Zoom out"
                      onClick={() => setMonthWidth(prev => Math.max(40, prev - 20))} 
                      className="p-1 hover:text-slate-500 transition-colors"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <div className="flex flex-col items-center">
                      <label htmlFor="timeline-zoom" className="sr-only">Timeline Zoom Level</label>
                      <input 
                        id="timeline-zoom"
                        type="range" 
                        min="40" 
                        max="300" 
                        value={monthWidth} 
                        onChange={(e) => setMonthWidth(parseInt(e.target.value))} 
                        className="w-20 accent-black" 
                      />
                    </div>
                    <button 
                      aria-label="Zoom in"
                      onClick={() => setMonthWidth(prev => Math.min(300, prev + 20))} 
                      className="p-1 hover:text-slate-500 transition-colors"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>

                  <button 
                    aria-label="Print Timeline"
                    onClick={() => window.print()} 
                    className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-black"
                  >
                    <Printer size={16} strokeWidth={2} />
                  </button>

                  <button 
                    aria-label={showHolidays ? "Hide Provincial Holidays" : "Show Provincial Holidays"}
                    onClick={() => setShowHolidays(!showHolidays)} 
                    className={`p-1.5 border rounded transition-colors focus:ring-2 focus:ring-black ${showHolidays ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-300 text-slate-400'}`}
                    title={showHolidays ? "Hide Holidays" : "Show Holidays"}
                  >
                    {showHolidays ? <Calendar size={16} strokeWidth={2.5} /> : <CalendarOff size={16} strokeWidth={2} />}
                  </button>

                  <button 
                    aria-label="Create new exhibition project"
                    onClick={async () => {
                      const id = Math.random().toString(36).substr(2,9);
                      const now = new Date();
                      const exStart = new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000); // 12 months ahead
                      const exEnd = new Date(exStart.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // 3 months duration
                      const newEx: Exhibition = { 
                        id, 
                        exhibitionId: '',
                        title: 'NEW EXHIBITION', 
                        status: 'Proposed', 
                        startDate: toISODate(exStart), 
                        endDate: toISODate(exEnd), 
                        gallery: galleries[0], 
                        milestones: [], 
                        phases: phaseTypes.map(pt => ({
                          id: Math.random().toString(36).substr(2,9),
                          label: pt.label,
                          durationMonths: pt.isPost ? 1 : 3,
                          typeId: pt.id
                        })), 
                        description: '' 
                      };
                      setExhibitions([...exhibitions, newEx]);
                      setSelectedProjectId(id);

                      if (currentUser) {
                        try {
                          setSyncStatus('syncing');
                          await setDoc(doc(db, 'users', currentUser.uid, 'exhibitions', id), {
                            ...newEx,
                            ownerId: currentUser.uid,
                            updatedAt: serverTimestamp()
                          });
                          setSyncStatus('synced');
                        } catch (err) {
                          setSyncStatus('error');
                        }
                      }
                    }} 
                    className="px-4 py-1.5 bg-slate-900 text-white border border-slate-300 rounded font-semibold uppercase text-[9px] hover:bg-slate-800 transition-colors flex items-center"
                  >
                    <Plus size={12} className="mr-1.5" strokeWidth={3} /> NEW PROJECT
                  </button>
                  
                  <button 
                    aria-label="Open settings"
                    onClick={() => setActiveTab('settings')} 
                    className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-black"
                  >
                    <Settings size={16} strokeWidth={2} />
                  </button>
                </div>
              </nav>
            </header>

            <div className="flex-1 flex overflow-hidden timeline-root no-print-bg">
              <aside className="w-40 bg-white flex flex-col shrink-0 z-40 border-r border-slate-200 shadow-sm">
                <div style={{ height: `${HEADER_HEIGHT}px` }} className="shrink-0 bg-slate-50 border-b border-slate-200 flex flex-col justify-end p-4">
                </div>
                <div className="flex-1 overflow-hidden" ref={sidebarListRef}>
                  {showHolidays && (
                    <div style={{ height: '48px' }} className="relative border-b-[3px] border-slate-800 bg-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                      <div className="absolute top-0 left-0 w-full h-full bg-slate-50 flex items-center px-4 py-2 z-20">
                        <div className="flex flex-col">
                          {/* Labels removed as redundant */}
                        </div>
                      </div>
                    </div>
                  )}
                  {galleries.map((gallery) => {
                    const tracksCount = galleryLayouts[gallery]?.maxTracks || 1;
                    const laneHeight = Math.max(BASE_LANE_HEIGHT, tracksCount * TRACK_HEIGHT + 28);
                    const galleryProjects = filteredExhibitions.filter(ex => ex.gallery === gallery);
                    return (
                      <div key={gallery} style={{ height: `${laneHeight}px` }} className="relative border-b-[3px] border-slate-800 bg-white">
                        <div className="absolute top-0 left-0 w-full min-h-[24px] bg-slate-900 flex items-center px-4 py-1 z-20">
                          <span className="font-semibold uppercase text-[9px] tracking-widest text-white leading-tight break-words">{gallery}</span>
                        </div>
                        {galleryProjects.map(ex => {
                          const trackIndex = galleryLayouts[gallery]!.tracks[ex.id];
                          if (trackIndex === undefined) return null;
                          const topPos = 24 + (trackIndex * TRACK_HEIGHT);
                          return (
                            <div key={`title-${ex.id}`} className="absolute left-4 w-[calc(100%-1rem)] pr-2" style={{ top: topPos + 3 }}>
                              <div className="text-[9px] font-medium text-slate-800 leading-tight break-words underline decoration-slate-200 decoration-1 underline-offset-2" title={ex.title}>{ex.title}</div>
                              {ex.exhibitionId && (
                                <div className="text-[7px] font-medium text-slate-400 mt-0 uppercase tracking-tight">
                                  {ex.exhibitionId}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {galleryProjects.map(ex => {
                          const trackIndex = galleryLayouts[gallery]!.tracks[ex.id];
                          if (trackIndex === undefined || trackIndex === 0) return null;
                          return (
                            <div key={`side-div-${ex.id}`} className="absolute w-full border-t-[1.5px] border-slate-200 left-0" style={{ top: 24 + trackIndex * TRACK_HEIGHT }} />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </aside>
              
              <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                {/* Print Only Branding Header */}
                <div className="hidden print:flex justify-between items-end mb-2 pb-2 border-b-2 border-slate-300">
                  <h1 className="text-xl font-bold uppercase tracking-tight">{museumName}</h1>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Master Exhibition Timeline • {timelineStartDate} to {timelineEndDate}</p>
                </div>

                <div 
                  tabIndex={0}
                  className={`flex-1 overflow-auto relative bg-white custom-scrollbar timeline-container cursor-grab active:cursor-grabbing ${isDraggingScroll ? '!cursor-grabbing' : ''}`} 
                  ref={timelineRef} 
                  onScroll={(e) => { if (sidebarListRef.current) sidebarListRef.current.scrollTop = e.currentTarget.scrollTop; }}
                  onMouseDown={(e) => { 
                  if (e.button === 0 && !longPressTimerRef.current && !draggingBarId) { 
                    setIsDraggingScroll(true); 
                    setStartX(e.pageX - timelineRef.current!.offsetLeft); 
                    setScrollLeftState(timelineRef.current!.scrollLeft); 
                  } 
                }}
                onMouseUp={() => {
                  setIsDraggingScroll(false);
                  if (draggingBarId && dragTempStartDate && dragTempEndDate) {
                    const ex = exhibitions.find(e => e.id === draggingBarId);
                    if (ex) {
                      handleUpdateExhibition({
                        ...ex,
                        startDate: dragTempStartDate,
                        endDate: dragTempEndDate
                      });
                    }
                  }
                  setDraggingBarId(null);
                  setDragTempStartDate(null);
                  setDragTempEndDate(null);
                  clearLongPress();
                }}
                onMouseLeave={() => {
                  setIsDraggingScroll(false);
                  if (draggingBarId && dragTempStartDate && dragTempEndDate) {
                    const ex = exhibitions.find(e => e.id === draggingBarId);
                    if (ex) {
                      handleUpdateExhibition({
                        ...ex,
                        startDate: dragTempStartDate,
                        endDate: dragTempEndDate
                      });
                    }
                  }
                  setDraggingBarId(null);
                  setDragTempStartDate(null);
                  setDragTempEndDate(null);
                  clearLongPress();
                }}
                onMouseMove={(e) => {
                  clearLongPress();
                  
                  if (draggingBarId) {
                    const deltaX = e.clientX - dragStartMouseX;
                    const newProjectX = dragStartProjectX + deltaX;
                    const newStartDate = getDateFromPosition(newProjectX, monthWidth, viewMonths);
                    const start = new Date(newStartDate + 'T12:00:00');
                    const newEndDate = toISODate(new Date(start.getTime() + dragDurationDays * 24 * 60 * 60 * 1000));
                    
                    setDragTempStartDate(newStartDate);
                    setDragTempEndDate(newEndDate);
                    return;
                  }

                  if (!isDraggingScroll || !timelineRef.current) return;
                  const x = e.pageX - timelineRef.current.offsetLeft;
                  timelineRef.current.scrollLeft = scrollLeftState - (x - startX) * 1.5;
                }}
              >
                <div className="inline-flex flex-col relative min-h-full">
                  {/* Now Indicator */}
                  <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-[70] pointer-events-none" style={{ left: `${todayPos}px` }}>
                    <div className="sticky top-[6px] bg-red-600 text-white font-semibold text-[8px] px-1.5 py-0.5 uppercase transform -translate-x-1/2 shadow-sm w-max whitespace-nowrap rounded-sm">TODAY</div>
                  </div>

                  {/* Header */}
                  <div className="sticky top-0 z-[60] border-b border-slate-200 flex flex-col bg-white/95 backdrop-blur-sm overflow-hidden" style={{ height: `${HEADER_HEIGHT}px` }}>
                    {/* Header Fiscal Year Lines */}
                    <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-0">
                      {(() => {
                        let currentOffset = 0;
                        return fyBlocks.map((block, idx) => {
                          const x = currentOffset;
                          currentOffset += block.count * monthWidth;
                          if (idx === 0 && x === 0) return null;
                          return (
                            <div 
                              key={`fy-header-line-${idx}`} 
                              style={{ left: `${x}px` }} 
                              className="absolute top-0 bottom-0 w-[1px] border-l border-dashed border-orange-500/60 print:border-orange-600 print:border-opacity-100"
                            />
                          );
                        });
                      })()}
                    </div>

                    <div className="flex h-[30px] border-b border-slate-300 bg-white/70 relative z-10 print:bg-white print:border-slate-400">
                      {yearBlocks.map(block => <div key={block.label} style={{ width: `${monthWidth * block.count}px` }} className="shrink-0 h-full flex items-center px-3 font-semibold text-sm tracking-tight uppercase text-black border-r border-slate-300 print:border-slate-400">{block.label}</div>)}
                    </div>
                    <div className="flex h-[26px] border-b border-orange-200 text-orange-900 bg-orange-100/90 relative z-10 print:bg-orange-100 print:border-orange-300">
                      {fyBlocks.map((block) => (
                        <div key={block.label} style={{ width: `${monthWidth * block.count}px` }} className="shrink-0 h-full flex items-center px-3 font-medium text-[9px] uppercase tracking-widest border-r border-orange-200 print:border-orange-300">{block.label}</div>
                      ))}
                    </div>
                    <div className="flex h-[17px] border-b border-slate-200/20 bg-slate-100/70 relative z-10 print:bg-slate-100">
                      {fyQuarterBlocks.map((block, i) => <div key={`${block.label}-${i}`} style={{ width: `${monthWidth * block.count}px` }} className="shrink-0 h-full flex items-center justify-center border-r border-slate-200/20 text-[8px] font-semibold uppercase tracking-widest text-slate-500 print:text-slate-900">{block.label}</div>)}
                    </div>
                    <div className="flex h-[17px] bg-white border-b border-slate-200/30 relative z-10 print:bg-white">
                      {viewMonths.map(m => <div key={`${m.year}-${m.month}`} style={{ width: `${monthWidth}px` }} className="shrink-0 h-full flex items-center justify-center border-r border-slate-200/10 text-[8px] font-medium text-slate-600 print:text-slate-900">{m.label}</div>)}
                    </div>
                  </div>

                  {/* Grid Lines (Monthly & Fiscal) */}
                  <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-[10]">
                    {/* Monthly Dividers */}
                    {viewMonths.map((m, idx) => {
                      if (idx === 0) return null; // Skip first bit
                      const style = { left: `${idx * monthWidth}px` };
                      return (
                        <div 
                          key={`month-divider-${idx}`} 
                          style={style} 
                          className="absolute top-0 bottom-0 w-[1px] border-l border-slate-300/40 print:border-slate-400"
                        />
                      );
                    })}

                    {/* Fiscal Year Markers (Vertical Lines) */}
                    {(() => {
                      let currentOffset = 0;
                      return fyBlocks.map((block, idx) => {
                        const style = { left: `${currentOffset}px` };
                        currentOffset += block.count * monthWidth;
                        // Skip the first line if it's at position 0
                        if (idx === 0 && style.left === '0px') return null;
                        return (
                          <div 
                            key={`fy-line-${idx}`} 
                            style={style} 
                            className="absolute top-0 bottom-0 w-[1px] border-l border-dashed border-orange-600/70 z-10 print:border-orange-800 print:border-opacity-100 print:z-50"
                          />
                        );
                      });
                    })()}
                  </div>

                  {/* Grid / Lanes */}
                  <div className="relative flex-1">
                    <div className="flex flex-col">
                      {filteredExhibitions.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-20 pointer-events-none opacity-20 z-0">
                          <Search size={48} className="mb-4" />
                          <p className="text-xl font-semibold uppercase tracking-widest text-center">No Projects Found</p>
                          <p className="text-[10px] font-medium uppercase mt-2 text-center">Try adjusting your search or filters</p>
                        </div>
                      )}
                      {/* Provincial Holidays Lane */}
                      {showHolidays && (
                        <div style={{ height: '48px' }} className="border-b-[3px] border-slate-800 bg-white/40 relative overflow-visible z-10 no-print-lane">
                          <div className={`absolute inset-0 bg-slate-50/50 -z-10`} />
                          {holidayMilestones.map((holiday, i) => {
                            if (holiday.xPos < 0 || holiday.xPos > viewMonths.length * monthWidth) return null;
                            const labelPos = holidayLabelPositions[i];
                            return (
                              <div 
                                key={`holiday-${i}`}
                                className="absolute top-1/2 flex items-center justify-center pointer-events-auto"
                                style={{ left: `${holiday.xPos}px`, transform: 'translate(-50%, -50%)' }}
                              >
                                <div 
                                  className="group/holiday relative flex items-center justify-center cursor-help"
                                  title={`${holiday.label} (${holiday.type} Holiday)`}
                                >
                                  <div className={`w-2 h-2 rotate-45 border-[1.5px] border-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,0.2)] transition-transform group-hover/holiday:scale-125 ${holiday.type === 'Statutory' ? 'bg-slate-800' : 'bg-white'}`} />
                                  
                                  <div className={`absolute left-1/2 -translate-x-1/2 text-[7px] font-semibold uppercase text-slate-800 whitespace-nowrap z-30 pointer-events-none transition-all duration-200 border border-slate-200 px-1.5 py-[1px] bg-white rounded shadow-sm flex items-center gap-1 ${labelPos === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}>
                                    {holiday.label}
                                    <span className="text-[5px] text-slate-400 font-medium opacity-60">
                                      {holiday.date.split('-')[1]}/{holiday.date.split('-')[2]}
                                    </span>
                                  </div>

                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-400/0 group-hover/holiday:bg-slate-400/10 transition-colors pointer-events-none" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {galleries.map((g) => {
                         const tracksCount = galleryLayouts[g]?.maxTracks || 1;
                         const laneHeight = Math.max(BASE_LANE_HEIGHT, tracksCount * TRACK_HEIGHT + 28);
                         const galleryProjects = filteredExhibitions.filter(ex => ex.gallery === g);

                         const footprints = galleryProjects.map(ex => {
                           const startPos = getPositionFromDate(ex.startDate, monthWidth, viewMonths);
                           const endPos = getPositionFromDate(ex.endDate, monthWidth, viewMonths);
                           const prePhases = (ex.phases || []).filter(p => !phaseTypes.find(t => t.id === p.typeId)?.isPost);
                           const totalPreWidth = prePhases.reduce((acc, p) => acc + p.durationMonths * monthWidth, 0);
                           const phaseStartPos = startPos - totalPreWidth;
                           let implStartPos = startPos;
                           let currentOffset = 0;
                           for (const p of prePhases) {
                             const pWidth = p.durationMonths * monthWidth;
                             const pType = phaseTypes.find(t => t.id === p.typeId);
                             if (pType && pType.label.toUpperCase().includes('IMPLEMENT')) {
                               implStartPos = phaseStartPos + currentOffset;
                               break;
                             }
                             currentOffset += pWidth;
                           }
                           return { activeStart: implStartPos, activeEnd: endPos };
                         });

                         const overlapRegions: { startX: number, endX: number }[] = [];
                         for (let i = 0; i < footprints.length; i++) {
                           for (let j = i + 1; j < footprints.length; j++) {
                             const a = footprints[i];
                             const b = footprints[j];
                             if (Math.max(a.activeStart, b.activeStart) < Math.min(a.activeEnd, b.activeEnd)) {
                               overlapRegions.push({
                                 startX: Math.max(a.activeStart, b.activeStart),
                                 endX: Math.min(a.activeEnd, b.activeEnd)
                               });
                             }
                           }
                         }

                         const mergedOverlaps: { startX: number, endX: number }[] = [];
                         const sortedRegions = overlapRegions.sort((a,b) => a.startX - b.startX);
                         sortedRegions.forEach(region => {
                           if (mergedOverlaps.length === 0) {
                             mergedOverlaps.push({...region});
                           } else {
                             const last = mergedOverlaps[mergedOverlaps.length - 1];
                             if (region.startX <= last.endX) {
                               last.endX = Math.max(last.endX, region.endX);
                             } else {
                               mergedOverlaps.push({...region});
                             }
                           }
                         });

                         return (
                           <div key={g} style={{ height: `${laneHeight}px` }} className="border-b-[3px] border-slate-800 gallery-lane-bg relative">
                             {mergedOverlaps.map((overlap, i) => (
                               <div 
                                 key={`overlap-${i}`}
                                 className="absolute bottom-0 z-[15] bg-red-500/5 border-l-2 border-r-2 border-dashed border-red-500/50 pointer-events-none"
                                 style={{ left: overlap.startX, width: Math.max(2, overlap.endX - overlap.startX), top: '24px' }}
                               >
                                 <div className="bg-white border-2 border-red-500/50 text-red-600 font-semibold uppercase text-[8px] tracking-widest flex items-center shadow-sm w-max ml-2 mt-2" style={{ padding: '2px 4px' }}>
                                   <AlertTriangle size={10} className="mr-1.5 shrink-0" strokeWidth={3} /> CONFLICT
                                 </div>
                               </div>
                             ))}
                             <div 
                               className="absolute top-0 left-0 w-full h-[24px] bg-slate-100/50 border-b border-slate-300/5 z-20 group relative cursor-crosshair overflow-visible"
                               onDoubleClick={async (e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 const x = Math.max(0, e.clientX - rect.left + timelineRef.current!.scrollLeft);
                                 const date = getDateFromPosition(x, monthWidth, viewMonths);
                                 const id = Math.random().toString(36).substr(2,9);
                                 const newMilestone: LocationMilestone = { 
                                   id, 
                                   gallery: g, 
                                   title: 'MILESTONE', 
                                   date 
                                 };
                                 setLocationMilestones([...locationMilestones, newMilestone]);
                                 setEditMilestoneDraft(newMilestone);

                                 if (currentUser) {
                                   try {
                                     setSyncStatus('syncing');
                                     await setDoc(doc(db, 'users', currentUser.uid, 'milestones', id), {
                                       ...newMilestone,
                                       ownerId: currentUser.uid,
                                       updatedAt: serverTimestamp()
                                     });
                                     setSyncStatus('synced');
                                   } catch (err) {
                                     setSyncStatus('error');
                                   }
                                 }
                               }}
                             >
                                <div className="hidden group-hover:flex absolute left-4 h-full items-center text-[9px] text-slate-400 font-medium uppercase pointer-events-none tracking-widest gap-2">
                                  <Plus size={10} strokeWidth={3} /> DBL-CLICK TO ADD MILESTONE
                                </div>
                                {(() => {
                                  const gMilestones = locationMilestones.filter(m => m.gallery === g)
                                    .map(m => ({ ...m, xPos: getPositionFromDate(m.date, monthWidth, viewMonths) }))
                                    .sort((a, b) => a.xPos - b.xPos);

                                  const labelPositions = new Array(gMilestones.length).fill('top');
                                  let lastTopX = -9999;
                                  let lastBottomX = -9999;
                                  
                                  for (let i = 0; i < gMilestones.length; i++) {
                                    const curr = gMilestones[i];
                                    if (curr.xPos - lastTopX >= 65) {
                                      labelPositions[i] = 'top';
                                      lastTopX = curr.xPos;
                                    } else if (curr.xPos - lastBottomX >= 65) {
                                      labelPositions[i] = 'bottom';
                                      lastBottomX = curr.xPos;
                                    } else {
                                      labelPositions[i] = 'top';
                                    }
                                  }

                                  return gMilestones.map((m, idx) => {
                                    const labelPos = labelPositions[idx];
                                    return (
                                      <div 
                                        key={m.id} 
                                        className="absolute top-1/2 flex items-center justify-center pointer-events-auto"
                                        style={{ left: `${m.xPos}px`, transform: 'translate(-50%, -50%)' }}
                                      >
                                        <div 
                                          className="transform hover:scale-125 transition-transform cursor-pointer flex items-center justify-center relative z-20"
                                          title={m.date}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditMilestoneDraft(m);
                                          }}
                                        >
                                          {m.icon === 'flag' ? (
                                            <div className="relative flex items-center justify-center pointer-events-none mt-1">
                                              <Flag size={16} fill={m.color || '#dc2626'} stroke="black" strokeWidth={2} className="drop-shadow-[1px_1px_0_rgba(0,0,0,1)]" />
                                            </div>
                                          ) : (
                                            <div className="w-3.5 h-3.5 bg-white border-[1.5px] border-slate-300 rotate-45 shadow-[1px_1px_0_0_rgba(0,0,0,1)] flex items-center justify-center pointer-events-none">
                                              <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: m.color || '#dc2626' }} />
                                            </div>
                                          )}
                                        </div>
                                        <div className={`absolute left-1/2 -translate-x-1/2 text-[9px] font-medium uppercase text-slate-600 bg-white px-1.5 py-[1px] leading-tight border border-slate-200 rounded shadow-md opacity-90 transition-all hover:bg-slate-50 hover:opacity-100 whitespace-nowrap z-30 pointer-events-none ${labelPos === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}>
                                          {m.title}
                                        </div>
                                      </div>
                                  );
                                });
                              })()}
                             </div>
                             {galleryProjects.map(ex => {
                               const trackIndex = galleryLayouts[g]!.tracks[ex.id];
                               if (trackIndex === undefined || trackIndex === 0) return null;
                               return (
                                 <div key={`line-${ex.id}`} className="absolute w-full border-t-[1.5px] border-slate-300 z-10 pointer-events-none" style={{ top: 24 + trackIndex * TRACK_HEIGHT }} />
                               );
                             })}
                           </div>
                         );
                      })}
                    </div>
                    
                    <div className="absolute inset-0 flex pointer-events-none z-0">
                      {viewMonths.map((m) => <div key={`bg-${m.year}-${m.month}`} style={{ width: `${monthWidth}px` }} className={`h-full border-r border-slate-200/5 shrink-0 ${m.month === 3 ? 'border-l-2 border-dashed border-orange-500/50' : ''}`} />)}
                    </div>

                    {/* Project Bars */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {(() => {
                        let currentGalleryY = showHolidays ? 48 : 0;
                        return galleries.flatMap((gallery) => {
                          const galleryProjects = filteredExhibitions.filter(ex => ex.gallery === gallery);
                          const layout = galleryLayouts[gallery];
                          const tracksCount = layout?.maxTracks || 1;
                          const laneHeight = Math.max(BASE_LANE_HEIGHT, tracksCount * TRACK_HEIGHT + 28);
                          const galleryYOffset = currentGalleryY;
                          currentGalleryY += laneHeight;

                          return galleryProjects.map(ex => {
                            const trackIndex = layout?.tracks[ex.id] || 0;
                            const isDraggingThis = draggingBarId === ex.id;
                            
                            const effStartDate = isDraggingThis && dragTempStartDate ? dragTempStartDate : ex.startDate;
                            const effEndDate = isDraggingThis && dragTempEndDate ? dragTempEndDate : ex.endDate;

                            const startPos = getPositionFromDate(effStartDate, monthWidth, viewMonths);
                            const endPos = getPositionFromDate(effEndDate, monthWidth, viewMonths);
                            const width = Math.max(endPos - startPos, 40);
                            const trackTop = galleryYOffset + 24 + (trackIndex * TRACK_HEIGHT);

                            const prePhasesRaw = (ex.phases || []).filter(p => !phaseTypes.find(t => t.id === p.typeId)?.isPost);
                            const postPhasesRaw = (ex.phases || []).filter(p => phaseTypes.find(t => t.id === p.typeId)?.isPost);
                            
                            const totalPreWidth = prePhasesRaw.reduce((acc, p) => acc + p.durationMonths * monthWidth, 0);
                            const phaseStartPos = startPos - totalPreWidth;
                            
                            let preOffset = 0;
                            const renderedPre = prePhasesRaw.map((p, i) => {
                              const pWidth = p.durationMonths * monthWidth;
                              const pStart = phaseStartPos + preOffset;
                              const pEnd = pStart + pWidth;
                              const pY = trackTop + (i * TRACK_HEIGHT) + (TRACK_HEIGHT - PHASE_BAR_HEIGHT) / 2;
                              preOffset += pWidth;
                              return { ...p, startX: pStart, width: pWidth, endX: pEnd, y: pY, type: phaseTypes.find(t => t.id === p.typeId), i, isPost: false };
                            });

                            const mainBarY = trackTop + (prePhasesRaw.length * TRACK_HEIGHT) + (TRACK_HEIGHT - STANDARD_BAR_HEIGHT) / 2;

                            let postOffset = 0;
                            const renderedPost = postPhasesRaw.map((p, i) => {
                              const pWidth = p.durationMonths * monthWidth;
                              const pStart = endPos + postOffset;
                              const pEnd = pStart + pWidth;
                              const pY = trackTop + ((prePhasesRaw.length + 1 + i) * TRACK_HEIGHT) + (TRACK_HEIGHT - PHASE_BAR_HEIGHT) / 2;
                              postOffset += pWidth;
                              return { ...p, startX: pStart, width: pWidth, endX: pEnd, y: pY, type: phaseTypes.find(t => t.id === p.typeId), i: prePhasesRaw.length + 1 + i, isPost: true };
                            });

                            const renderedPhases = [...renderedPre, ...renderedPost];

                            return (
                              <React.Fragment key={ex.id}>
                                <div className={`absolute pointer-events-none transition-opacity duration-200 ${isDraggingThis ? 'opacity-30' : ''}`}>
                                  {renderedPhases.map((phase, idx) => {
                                    const yCenter = phase.y + PHASE_BAR_HEIGHT / 2;
                                    let nextYCenter = -1;
                                    let nextX = -1;
                                    let hasNext = true;

                                    if (!phase.isPost) {
                                      const preIdx = idx;
                                      if (preIdx < renderedPre.length - 1) {
                                        nextYCenter = renderedPre[preIdx + 1].y + PHASE_BAR_HEIGHT / 2;
                                        nextX = renderedPre[preIdx + 1].startX;
                                      } else {
                                        nextYCenter = mainBarY + STANDARD_BAR_HEIGHT / 2;
                                        nextX = startPos;
                                      }
                                    } else {
                                      const postIdx = idx - renderedPre.length;
                                      if (postIdx < renderedPost.length - 1) {
                                        nextYCenter = renderedPost[postIdx + 1].y + PHASE_BAR_HEIGHT / 2;
                                        nextX = renderedPost[postIdx + 1].startX;
                                      } else {
                                        hasNext = false;
                                      }
                                    }

                                    return (
                                      <React.Fragment key={phase.id}>
                                        <div 
                                          className="absolute border border-slate-300 rounded flex items-center px-3 shadow-sm hover:shadow-md hover:border-slate-400 bg-white transition-all hover:-translate-y-0.5 pointer-events-auto" 
                                          style={{ left: `${phase.startX}px`, top: `${phase.y}px`, width: `${phase.width - 2}px`, height: `${PHASE_BAR_HEIGHT}px`, backgroundColor: phase.type?.color || '#eee' }}
                                          title={phase.label}
                                        >
                                          <span className={`text-[7px] font-semibold uppercase truncate leading-tight ${getContrastColor(phase.type?.color || '#eee')} drop-shadow-[0_1px_0_rgba(0,0,0,0.1)]`}>{phase.label}</span>
                                        </div>
                                        {hasNext && (
                                          <svg className="absolute overflow-visible pointer-events-none z-0" style={{ left: 0, top: 0, width: 1, height: 1 }}>
                                            <path 
                                              d={`M ${phase.endX} ${yCenter} L ${phase.endX} ${yCenter + 12} L ${phase.endX - 8} ${yCenter + 12} L ${phase.endX - 8} ${nextYCenter} L ${nextX - 2} ${nextYCenter}`} 
                                              fill="none" 
                                              stroke="#94a3b8" 
                                              strokeWidth="2" 
                                            />
                                            <circle cx={phase.endX} cy={yCenter} r="2.5" fill="#94a3b8" />
                                            <polygon points={`${nextX},${nextYCenter} ${nextX-6},${nextYCenter-4} ${nextX-6},${nextYCenter+4}`} fill="#94a3b8" />
                                          </svg>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}

                                  {renderedPost.length > 0 && (() => {
                                    const nX = renderedPost[0].startX;
                                    const nYCenter = renderedPost[0].y + PHASE_BAR_HEIGHT / 2;
                                    const curYCenter = mainBarY + STANDARD_BAR_HEIGHT / 2;
                                    return (
                                      <svg className="absolute overflow-visible pointer-events-none z-0" style={{ left: 0, top: 0, width: 1, height: 1 }}>
                                        <path 
                                          d={`M ${endPos} ${curYCenter} L ${endPos} ${curYCenter + 12} L ${endPos - 8} ${curYCenter + 12} L ${endPos - 8} ${nYCenter} L ${nX - 2} ${nYCenter}`} 
                                          fill="none" 
                                          stroke="#94a3b8" 
                                          strokeWidth="2" 
                                        />
                                        <circle cx={endPos} cy={curYCenter} r="2.5" fill="#94a3b8" />
                                        <polygon points={`${nX},${nYCenter} ${nX-6},${nYCenter-4} ${nX-6},${nYCenter+4}`} fill="#94a3b8" />
                                      </svg>
                                    );
                                  })()}
                                </div>

                                <div 
                                  aria-label={`Project: ${ex.title}. Click to view details, long-press to drag.`}
                                  role="button"
                                  tabIndex={0}
                                  onMouseDown={(e) => onBarMouseDown(e, ex)}
                                  onClick={() => { if (!draggingBarId) setSelectedProjectId(ex.id); }}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedProjectId(ex.id); }}
                                  className={`absolute pointer-events-auto border rounded overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex focus:ring-2 focus:ring-blue-500/50 print:border-slate-800 print:shadow-none ${isDraggingThis ? 'project-bar-dragging ring-2 ring-blue-500' : ''}`} 
                                  style={{ 
                                    left: `${startPos}px`, 
                                    width: `${width}px`, 
                                    top: `${mainBarY}px`, 
                                    height: `${STANDARD_BAR_HEIGHT}px`,
                                    backgroundColor: getStatusStyles(ex.status).bg,
                                    borderColor: getStatusStyles(ex.status).border
                                  }}
                                >
                                  <div className="w-1.5 h-full shrink-0" style={{ backgroundColor: getStatusStyles(ex.status).accent }} />
                                  <div className="flex-1 flex flex-col justify-center px-2 min-w-0 overflow-hidden">
                                    <div className="flex items-center justify-between min-w-0 mb-[1px]">
                                      <h4 className="font-semibold truncate uppercase text-[9px] leading-tight tracking-tight text-slate-900">{ex.title}</h4>
                                      <span 
                                        className="text-[6.5px] font-semibold uppercase px-1 py-[1.5px] rounded border border-slate-300/5 ml-2 shrink-0 bg-white/50 hidden lg:block leading-none"
                                        style={{ color: getStatusStyles(ex.status).text, transform: 'translateY(-1px)' }}
                                      >
                                        {getStatusStyles(ex.status).label}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1.5 text-[7.5px] font-semibold uppercase text-slate-500/80 truncate leading-none">
                                      <span>{formatBarDate(effStartDate)}</span>
                                      <span className="opacity-40">/</span>
                                      <span>{formatBarDate(effEndDate)}</span>
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          });
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </>
        ) : (
          <div className="p-8 py-6 max-w-3xl mx-auto space-y-8 overflow-y-auto h-full bg-white no-print custom-scrollbar flex flex-col">
            <header className="space-y-3">
              <button 
                onClick={() => setActiveTab('portfolio')} 
                className="inline-flex items-center font-medium uppercase text-[9px] border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500/50"
              >
                <ArrowLeft size={12} className="mr-2" /> DASHBOARD
              </button>
              <h2 className="text-3xl font-semibold uppercase tracking-tight">SYSTEM SETTINGS</h2>
            </header>
            
            <div className="space-y-8 border-t-4 border-slate-300 pt-8">
              <section className="space-y-6">
                <div className="flex items-center text-sm font-semibold uppercase tracking-widest space-x-3 text-slate-900"><Building2 size={18} /><span>ORG STANDARDS</span></div>
                <div className="border border-slate-300 rounded p-6 bg-slate-50 shadow-sm hover:shadow-md transition-all">
                  <label htmlFor="museum-name-input" className="text-[9px] font-semibold uppercase mb-2 block text-slate-400">ORGANIZATION NAME</label>
                  <input 
                    id="museum-name-input"
                    className="w-full text-lg font-semibold bg-white border border-slate-300 rounded p-3 outline-none uppercase shadow-inner focus:border-slate-300 transition-colors" 
                    value={museumName} 
                    onChange={(e) => setMuseumName(e.target.value.toUpperCase())} 
                  />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center text-sm font-semibold uppercase tracking-widest space-x-3 text-slate-900"><Palette size={18} /><span>PHASE TYPES</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {phaseTypes.map((type, idx) => (
                    <div key={type.id} className="flex items-center space-x-3 p-3 border border-slate-300 rounded bg-white shadow-sm hover:shadow-md hover:border-slate-400 transition-all">
                      <div className="flex flex-col">
                        <label htmlFor={`phase-color-${idx}`} className="sr-only">Phase Color {idx + 1}</label>
                        <input 
                          id={`phase-color-${idx}`}
                          type="color" 
                          className="w-8 h-8 border border-slate-300 rounded bg-transparent cursor-pointer outline-none" 
                          value={type.color} 
                          onChange={(e) => {
                            const next = [...phaseTypes];
                            next[idx].color = e.target.value;
                            setPhaseTypes(next);
                          }} 
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label htmlFor={`phase-label-${idx}`} className="sr-only">Phase Label {idx + 1}</label>
                        <input 
                          id={`phase-label-${idx}`}
                          className="w-full font-medium uppercase text-[10px] outline-none border-b border-transparent focus:border-slate-300 bg-transparent" 
                          value={type.label} 
                          onChange={(e) => {
                            const next = [...phaseTypes];
                            next[idx].label = e.target.value.toUpperCase();
                            setPhaseTypes(next);
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6 pb-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-semibold uppercase tracking-widest space-x-3 text-slate-900"><MapPin size={18} /><span>LOCATIONS & GALLERIES</span></div>
                  <button 
                    onClick={handleAddGallery}
                    className="text-[9px] font-semibold uppercase bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    + ADD LOCATION
                  </button>
                </div>
                <div className="space-y-3">
                  {galleries.map((gallery, idx) => (
                    <div key={`${gallery}-${idx}`} className="flex items-center space-x-3 p-3 border border-slate-300 rounded bg-white shadow-sm hover:shadow-md transition-all">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center font-semibold text-slate-400 text-xs">{idx + 1}</div>
                      <input 
                        aria-label={`Location name ${idx + 1}`}
                        className="flex-1 font-semibold uppercase text-sm border-b-2 border-transparent focus:border-slate-300 bg-transparent outline-none py-1" 
                        value={gallery} 
                        onChange={(e) => handleUpdateGalleryName(gallery, e.target.value.toUpperCase())}
                      />
                      <button 
                        aria-label={`Remove location ${gallery}`}
                        disabled={galleries.length <= 1}
                        onClick={() => handleRemoveGallery(gallery)}
                        className={`p-2 text-slate-400 hover:text-red-600 transition-colors ${galleries.length <= 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MasterScheduler />);
}

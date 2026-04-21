import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
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
  AlertTriangle
} from 'lucide-react';

// --- Types & Constants ---

type ExhibitionStatus = 'Proposed' | 'In Development' | 'Open to Public' | 'Closed';

interface PhaseType {
  id: string;
  label: string;
  color: string;
  isPost?: boolean;
}

interface ProjectPhase {
  id: string;
  label: string;
  durationMonths: number;
  typeId: string;
}

interface LocationMilestone {
  id: string;
  gallery: string;
  title: string;
  date: string;
  color?: string;
  icon?: 'diamond' | 'flag';
}

interface Exhibition {
  id: string;
  exhibitionId: string;
  title: string;
  status: ExhibitionStatus;
  startDate: string;
  endDate: string;
  gallery: string;
  milestones: any[];
  phases: ProjectPhase[];
  description?: string;
}

const STORAGE_KEY = 'exhibition_planner_brutalist_v4';
const CONFIG_STORAGE_KEY = 'exhibition_planner_config_brutalist_v4';
const MILESTONES_STORAGE_KEY = 'exhibition_planner_milestones_v4';

const DEFAULT_GALLERIES = [
  'FEATURE GALLERY',
  'NATURAL HISTORY SOUTH',
  'HUMAN HISTORY NORTH',
  'HUMAN HISTORY SOUTH'
];

const DEFAULT_PHASE_TYPES: PhaseType[] = [
  { id: 'pt1', label: 'IDEA DEVELOPMENT', color: '#94a3b8' },
  { id: 'pt2', label: 'CONTENT DEVELOPMENT', color: '#3b82f6' },
  { id: 'pt3', label: 'DESIGN DEVELOPMENT', color: '#22c55e' },
  { id: 'pt4', label: 'IMPLEMENTATION', color: '#f97316' },
  { id: 'pt5', label: 'DEINSTALL', color: '#ef4444', isPost: true },
];

const MILESTONE_COLORS = [
  { value: '#dc2626', label: 'CRITICAL / DEFAULT' },
  { value: '#94a3b8', label: 'IDEA / PLANNING' },
  { value: '#3b82f6', label: 'CONTENT / REVIEW' },
  { value: '#22c55e', label: 'DESIGN / APPROVAL' },
  { value: '#f97316', label: 'EXECUTION / BUILD' },
  { value: '#000000', label: 'FINAL / OPENING' },
  { value: '#64748b', label: 'SECONDARY / HOLIDAY' }
];

const ALBERTA_HOLIDAYS = [
  { date: '2026-01-01', label: "New Year's Day", type: 'Statutory' },
  { date: '2026-02-16', label: 'Family Day', type: 'Statutory' },
  { date: '2026-04-03', label: 'Good Friday', type: 'Statutory' },
  { date: '2026-04-06', label: 'Easter Monday', type: 'Optional' },
  { date: '2026-05-18', label: 'Victoria Day', type: 'Statutory' },
  { date: '2026-07-01', label: 'Canada Day', type: 'Statutory' },
  { date: '2026-08-03', label: 'Heritage Day', type: 'Optional' },
  { date: '2026-09-07', label: 'Labour Day', type: 'Statutory' },
  { date: '2026-09-30', label: 'National Day for Truth and Reconciliation', type: 'Optional' },
  { date: '2026-10-12', label: 'Thanksgiving Day', type: 'Statutory' },
  { date: '2026-11-11', label: 'Remembrance Day', type: 'Statutory' },
  { date: '2026-12-25', label: 'Christmas Day', type: 'Statutory' },
  { date: '2026-12-26', label: 'Boxing Day', type: 'Optional' },
  { date: '2027-01-01', label: "New Year's Day", type: 'Statutory' },
  { date: '2027-02-15', label: 'Family Day', type: 'Statutory' },
  { date: '2027-03-26', label: 'Good Friday', type: 'Statutory' },
  { date: '2027-03-29', label: 'Easter Monday', type: 'Optional' },
  { date: '2027-05-24', label: 'Victoria Day', type: 'Statutory' },
  { date: '2027-07-01', label: 'Canada Day', type: 'Statutory' },
  { date: '2027-08-02', label: 'Heritage Day', type: 'Optional' },
  { date: '2027-09-06', label: 'Labour Day', type: 'Statutory' },
  { date: '2027-09-30', label: 'National Day for Truth and Reconciliation', type: 'Optional' },
  { date: '2027-10-11', label: 'Thanksgiving Day', type: 'Statutory' },
  { date: '2027-11-11', label: 'Remembrance Day', type: 'Statutory' },
  { date: '2027-12-25', label: 'Christmas Day', type: 'Statutory' },
  { date: '2027-12-26', label: 'Boxing Day', type: 'Optional' },
  { date: '2028-01-01', label: "New Year's Day", type: 'Statutory' },
  { date: '2028-02-21', label: 'Family Day', type: 'Statutory' },
  { date: '2028-04-14', label: 'Good Friday', type: 'Statutory' },
  { date: '2028-04-17', label: 'Easter Monday', type: 'Optional' },
  { date: '2028-05-22', label: 'Victoria Day', type: 'Statutory' },
  { date: '2028-07-01', label: 'Canada Day', type: 'Statutory' },
  { date: '2028-08-07', label: 'Heritage Day', type: 'Optional' },
  { date: '2028-09-04', label: 'Labour Day', type: 'Statutory' },
  { date: '2028-09-30', label: 'National Day for Truth and Reconciliation', type: 'Optional' },
  { date: '2028-10-09', label: 'Thanksgiving Day', type: 'Statutory' },
  { date: '2028-11-11', label: 'Remembrance Day', type: 'Statutory' },
  { date: '2028-12-25', label: 'Christmas Day', type: 'Statutory' },
  { date: '2028-12-26', label: 'Boxing Day', type: 'Optional' },
  { date: '2029-01-01', label: "New Year's Day", type: 'Statutory' },
  { date: '2029-02-19', label: 'Family Day', type: 'Statutory' },
  { date: '2029-03-30', label: 'Good Friday', type: 'Statutory' },
  { date: '2029-04-02', label: 'Easter Monday', type: 'Optional' },
  { date: '2029-05-21', label: 'Victoria Day', type: 'Statutory' },
  { date: '2029-07-01', label: 'Canada Day', type: 'Statutory' },
  { date: '2029-08-06', label: 'Heritage Day', type: 'Optional' },
  { date: '2029-09-03', label: 'Labour Day', type: 'Statutory' },
  { date: '2029-09-30', label: 'National Day for Truth and Reconciliation', type: 'Optional' },
  { date: '2029-10-08', label: 'Thanksgiving Day', type: 'Statutory' },
  { date: '2029-11-11', label: 'Remembrance Day', type: 'Statutory' },
  { date: '2029-12-25', label: 'Christmas Day', type: 'Statutory' },
  { date: '2029-12-26', label: 'Boxing Day', type: 'Optional' },
];

const INITIAL_EXHIBITIONS: Exhibition[] = [
  {
    id: '1',
    exhibitionId: 'EX-2026-001',
    title: 'THE DIGITAL RENAISSANCE',
    status: 'Open to Public',
    startDate: '2026-04-15',
    endDate: '2026-10-30',
    gallery: 'NATURAL HISTORY SOUTH',
    description: 'INTERSECTION OF CLASSICAL ART AND MODERN ALGORITHMIC GENERATION.',
    milestones: [],
    phases: [
      { id: 'p1', label: 'IDEA DEVELOPMENT', durationMonths: 2, typeId: 'pt1' },
      { id: 'p2', label: 'CONTENT DEVELOPMENT', durationMonths: 1, typeId: 'pt2' }
    ]
  },
  {
    id: '2',
    exhibitionId: 'EX-2026-002',
    title: 'OVERLAPPING VISION',
    status: 'Proposed',
    startDate: '2026-03-01',
    endDate: '2026-06-01',
    gallery: 'NATURAL HISTORY SOUTH',
    description: 'TESTING THE OVERLAP CAPABILITY WITHIN THE SAME GALLERY.',
    milestones: [],
    phases: [
      { id: 'p3', label: 'IDEA DEVELOPMENT', durationMonths: 1, typeId: 'pt1' }
    ]
  }
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const FY_QUARTERS = ['Q4', 'Q1', 'Q2', 'Q3'];
const BASE_LANE_HEIGHT = 80; 
const TRACK_HEIGHT = 44; 
const HEADER_HEIGHT = 90; 
const STANDARD_BAR_HEIGHT = 34; 
const PHASE_BAR_HEIGHT = 18;

const getStatusStyles = (status: string) => {
  switch(status) {
    case 'Open to Public': return { 
      accent: '#059669', 
      bg: '#ecfdf5', 
      border: '#10b981', 
      text: '#064e3b',
      label: '● OPEN TO PUBLIC'
    };
    case 'In Development': return { 
      accent: '#d97706', 
      bg: '#fffbeb', 
      border: '#f59e0b', 
      text: '#78350f',
      label: '◈ IN DEVELOPMENT'
    };
    case 'Proposed': return { 
      accent: '#4b5563', 
      bg: '#f9fafb', 
      border: '#d1d5db', 
      text: '#1f2937',
      label: '◌ PROPOSED'
    };
    case 'Closed': return { 
      accent: '#000000', 
      bg: '#f3f4f6', 
      border: '#1f2937', 
      text: '#000000',
      label: '■ CLOSED'
    };
    default: return { 
      accent: '#94a3b8', 
      bg: '#f8fafc', 
      border: '#e2e8f0', 
      text: '#475569',
      label: '?'
    };
  }
};

const getStatusColor = (status: string) => getStatusStyles(status).bg;

const getContrastColor = (hexcolor: string) => {
  if (!hexcolor || hexcolor.length < 7) return 'text-black';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 160) ? 'text-black' : 'text-white';
};

const toISODate = (date: Date) => {
  if (isNaN(date.getTime())) return '2026-01-01';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getPositionFromDate = (dateStr: string, monthWidth: number, vMonths: any[]) => {
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime()) || !vMonths || vMonths.length === 0) return 0;
  const start = vMonths[0];
  const startAbs = start.year * 12 + start.month;
  const targetAbs = date.getFullYear() * 12 + date.getMonth();
  const monthDiff = targetAbs - startAbs;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return (monthDiff * monthWidth) + ((date.getDate() - 1) / daysInMonth * monthWidth);
};

const getDateFromPosition = (x: number, monthWidth: number, vMonths: any[]) => {
  if (!vMonths || vMonths.length === 0) return toISODate(new Date());
  const totalMonths = x / monthWidth;
  const start = vMonths[0];
  const startAbs = start.year * 12 + start.month;
  const targetAbs = startAbs + totalMonths;
  const targetYear = Math.floor(targetAbs / 12);
  const targetMonth = Math.floor(targetAbs % 12);
  const dayFrac = targetAbs - Math.floor(targetAbs);
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.max(1, Math.min(daysInMonth, Math.round(dayFrac * daysInMonth) + 1));
  return toISODate(new Date(targetYear, targetMonth, day));
};

const formatBarDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return '---';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

// --- Collision Utility ---

const calculateTracks = (projects: Exhibition[], monthWidth: number, vMonths: any[], phaseTypes: PhaseType[]) => {
  const sorted = [...projects].sort((a, b) => {
    const prePhasesA = (a.phases || []).filter(p => !phaseTypes.find(t => t.id === p.typeId)?.isPost);
    const prePhasesB = (b.phases || []).filter(p => !phaseTypes.find(t => t.id === p.typeId)?.isPost);
    const startA = getPositionFromDate(a.startDate, monthWidth, vMonths) - prePhasesA.reduce((acc, p) => acc + (p.durationMonths * monthWidth), 0);
    const startB = getPositionFromDate(b.startDate, monthWidth, vMonths) - prePhasesB.reduce((acc, p) => acc + (p.durationMonths * monthWidth), 0);
    return startA - startB;
  });

  const tracks: { [id: string]: number } = {};
  let overallMaxTrack = 0;

  sorted.forEach(project => {
    const numSubTracks = (project.phases?.length || 0) + 1;
    tracks[project.id] = overallMaxTrack;
    overallMaxTrack += numSubTracks;
  });

  return { tracks, maxTracks: overallMaxTrack || 1 };
};

// --- Components ---

const DetailPanel = ({ 
  exhibition, 
  onClose, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  galleries,
  phaseTypes
}: { 
  exhibition: Exhibition; 
  onClose: () => void; 
  onUpdate: (ex: Exhibition) => void; 
  onDelete: (id: string) => void; 
  onDuplicate: (id: string) => void;
  galleries: string[];
  phaseTypes: PhaseType[];
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEx, setEditedEx] = useState<Exhibition>(exhibition);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [localPhaseDraft, setLocalPhaseDraft] = useState<ProjectPhase | null>(null);

  useEffect(() => { 
    setEditedEx(exhibition); 
    setIsEditing(false); 
    setEditingPhaseId(null);
  }, [exhibition]);

  const handleSaveAll = () => { onUpdate(editedEx); setIsEditing(false); };
  const handleFieldChange = (field: keyof Exhibition, value: any) => { setEditedEx(prev => ({ ...prev, [field]: value })); };

  const handleAddPhase = () => {
    const newPhase: ProjectPhase = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'NEW PHASE',
      durationMonths: 1,
      typeId: phaseTypes[0]?.id || 'pt1'
    };
    const updatedPhases = [...editedEx.phases, newPhase];
    setEditedEx(prev => ({ ...prev, phases: updatedPhases }));
    // Auto-edit new phase
    setEditingPhaseId(newPhase.id);
    setLocalPhaseDraft(newPhase);
  };

  const handleRemovePhase = (id: string) => {
    setEditedEx(prev => ({ ...prev, phases: prev.phases.filter(p => p.id !== id) }));
  };

  const handleStartEditPhase = (phase: ProjectPhase) => {
    setEditingPhaseId(phase.id);
    setLocalPhaseDraft({ ...phase });
  };

  const handleSavePhaseLocal = () => {
    if (!localPhaseDraft) return;
    const newPhases = editedEx.phases.map(p => p.id === localPhaseDraft.id ? localPhaseDraft : p);
    handleFieldChange('phases', newPhases);
    setEditingPhaseId(null);
    setLocalPhaseDraft(null);
  };

  const handleCancelPhaseLocal = () => {
    setEditingPhaseId(null);
    setLocalPhaseDraft(null);
  };

  const handleMovePhase = (idx: number, direction: 'up' | 'down') => {
    const newPhases = [...editedEx.phases];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newPhases.length) return;
    [newPhases[idx], newPhases[targetIdx]] = [newPhases[targetIdx], newPhases[idx]];
    handleFieldChange('phases', newPhases);
  };

  const totalProjectDuration = useMemo(() => {
    const start = new Date(editedEx.startDate + 'T12:00:00');
    const end = new Date(editedEx.endDate + 'T12:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const preciseMonths = diffDays / 30;
    return Math.max(0, Math.round(preciseMonths * 10) / 10);
  }, [editedEx.startDate, editedEx.endDate]);

  const handleDurationChange = (months: number) => {
    const start = new Date(editedEx.startDate + 'T12:00:00');
    if (isNaN(start.getTime())) return;
    const newEnd = new Date(start);
    newEnd.setTime(start.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
    handleFieldChange('endDate', toISODate(newEnd));
  };

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white border-l border-slate-200 z-[100] flex flex-col no-print shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/20">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
        <div className="flex-1 mr-4">
          {isEditing ? (
            <div className="flex flex-col">
              <label htmlFor="ex-title" className="text-[10px] font-bold uppercase text-slate-400">Project Title</label>
              <input 
                id="ex-title"
                className="text-lg font-bold text-slate-900 w-full bg-slate-50 border border-slate-200 rounded-md p-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                value={editedEx.title} 
                onChange={(e) => handleFieldChange('title', e.target.value.toUpperCase())} 
              />
            </div>
          ) : (
            <h2 className="text-lg font-black text-black leading-none uppercase tracking-tight">{exhibition.title}</h2>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <button 
              aria-label="Save all changes"
              onClick={handleSaveAll} 
              className="w-10 h-10 bg-black text-white border border-slate-300 rounded flex items-center justify-center hover:bg-white hover:text-black transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Check size={20} />
            </button>
          ) : (
            <button 
              aria-label="Edit project"
              onClick={() => setIsEditing(true)} 
              className="w-10 h-10 bg-white border border-slate-300 rounded text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Edit2 size={18} />
            </button>
          )}
          <button 
            aria-label="Close panel"
            onClick={onClose} 
            className="w-10 h-10 bg-white border border-slate-300 rounded text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <span id="label-status" className="text-[10px] font-black uppercase text-slate-400">PROJECT STATUS</span>
            {isEditing ? (
              <select 
                id="ex-status"
                className="w-full font-bold border border-slate-300 rounded p-2 outline-none text-sm bg-white text-black focus:bg-yellow-50" 
                value={editedEx.status} 
                onChange={(e) => handleFieldChange('status', e.target.value)}
              >
                {['Proposed', 'In Development', 'Open to Public', 'Closed'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            ) : (
              <div>
                <p 
                  className="font-black text-[10px] uppercase px-3 py-1 border rounded inline-flex items-center shadow-sm" 
                  style={{ 
                    backgroundColor: getStatusStyles(exhibition.status).bg,
                    borderColor: getStatusStyles(exhibition.status).border,
                    color: getStatusStyles(exhibition.status).text
                  }}
                >
                  {getStatusStyles(exhibition.status).label}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border border-slate-300 rounded space-y-4 bg-slate-50/50">
          <div className="space-y-1">
            <label htmlFor="ex-id" className="text-[10px] font-black uppercase text-slate-400">EXHIBITION ID</label>
            {isEditing ? (
              <input 
                id="ex-id"
                className="w-full font-bold border border-slate-300 rounded p-2 text-sm bg-white text-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/50" 
                value={editedEx.exhibitionId || ''} 
                placeholder="EX-0000-000"
                onChange={(e) => handleFieldChange('exhibitionId', e.target.value.toUpperCase())} 
              />
            ) : (
              <p className="font-bold text-sm uppercase text-blue-600 tracking-tight">{exhibition.exhibitionId || 'UNASSIGNED'}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="ex-gallery" className="text-[10px] font-black uppercase text-slate-400">GALLERY LANE</label>
            {isEditing ? (
              <select 
                id="ex-gallery"
                className="w-full font-bold border border-slate-300 rounded p-2 outline-none text-sm bg-white text-black focus:bg-yellow-50" 
                value={editedEx.gallery} 
                onChange={(e) => handleFieldChange('gallery', e.target.value)}
              >
                {galleries.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <p className="font-bold text-sm uppercase">{exhibition.gallery}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="ex-start-date" className="text-[10px] font-black uppercase text-slate-400">START DATE</label>
              {isEditing ? (
                <input 
                  id="ex-start-date"
                  type="date" 
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white text-black outline-none focus:bg-yellow-50" 
                  value={editedEx.startDate} 
                  onChange={(e) => handleFieldChange('startDate', e.target.value)} 
                />
              ) : (
                <p className="text-sm font-bold">{exhibition.startDate}</p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="ex-end-date" className="text-[10px] font-black uppercase text-slate-400">END DATE</label>
              {isEditing ? (
                <input 
                  id="ex-end-date"
                  type="date" 
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white text-black outline-none focus:bg-yellow-50" 
                  value={editedEx.endDate} 
                  onChange={(e) => handleFieldChange('endDate', e.target.value)} 
                />
              ) : (
                <p className="text-sm font-bold">{exhibition.endDate}</p>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-black/10">
            <label htmlFor="ex-duration" className="text-[10px] font-black uppercase text-slate-400 block">TOTAL PROJECT DURATION</label>
            {isEditing ? (
              <div className="flex items-center space-x-2 mt-1">
                <input 
                  id="ex-duration"
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-24 border border-slate-300 rounded bg-white text-black font-black p-2 outline-none focus:bg-yellow-50"
                  value={totalProjectDuration}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleDurationChange(val);
                  }}
                />
                <span className="text-xs font-black uppercase tracking-tight">MONTHS</span>
              </div>
            ) : (
              <p className="text-sm font-black text-black mt-1 uppercase tracking-tight">{totalProjectDuration} MONTHS</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h3 className="text-xs font-black uppercase">INTERNAL PHASING</h3>
              <button 
                aria-label="Add new phase"
                onClick={handleAddPhase} 
                className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 hover:bg-slate-700 focus:ring-2 focus:ring-black"
              >
                + ADD PHASE
              </button>
            </div>
            <div className="space-y-2">
              {editedEx.phases.map((phase, idx) => {
                const isPhaseEditing = editingPhaseId === phase.id;
                
                return (
                  <div key={phase.id} className={`border border-slate-300 rounded p-3 flex items-start justify-between bg-white shadow-sm hover:shadow-md transition-colors ${isPhaseEditing ? 'bg-yellow-50/30' : ''}`}>
                    <div className="flex items-start space-x-3 w-full">
                      <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">{idx + 1}</div>
                      <div className="flex flex-col flex-1 min-w-0">
                        {isPhaseEditing ? (
                          <div className="flex flex-col space-y-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">LABEL</label>
                              <input 
                                autoFocus
                                aria-label={`Phase ${idx + 1} Label`}
                                className="font-bold text-xs uppercase border border-slate-300 rounded outline-none bg-white text-black focus:bg-yellow-50 w-full p-2"
                                value={localPhaseDraft?.label || ''}
                                onChange={(e) => setLocalPhaseDraft(prev => prev ? { ...prev, label: e.target.value.toUpperCase() } : null)}
                              />
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">DURATION (MO)</label>
                                <input 
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  aria-label={`Phase ${idx + 1} Duration`}
                                  className="font-black text-xs uppercase border border-slate-300 rounded bg-white text-black outline-none w-20 p-2 text-center focus:bg-yellow-50"
                                  value={localPhaseDraft?.durationMonths || 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setLocalPhaseDraft(prev => prev ? { ...prev, durationMonths: isNaN(val) ? 0 : val } : null);
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">TYPE</label>
                                <select 
                                  className="font-black text-[10px] uppercase border border-slate-300 rounded bg-white text-black outline-none p-1.5 focus:bg-yellow-50"
                                  value={localPhaseDraft?.typeId || ''}
                                  onChange={(e) => setLocalPhaseDraft(prev => prev ? { ...prev, typeId: e.target.value } : null)}
                                >
                                  {phaseTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.label}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-1">
                               <button 
                                onClick={handleSavePhaseLocal}
                                className="bg-black text-white px-3 py-1.5 text-[10px] font-bold uppercase flex items-center hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
                              >
                                <Check size={14} className="mr-1.5" /> CONFIRM
                              </button>
                              <button 
                                onClick={handleCancelPhaseLocal}
                                className="bg-white border border-slate-300 rounded text-black px-3 py-1.5 text-[10px] font-bold uppercase flex items-center hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
                              >
                                <X size={14} className="mr-1.5" /> CANCEL
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                               <span className="font-bold text-xs uppercase truncate text-black">{phase.label}</span>
                               <div className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: phaseTypes.find(t => t.id === phase.typeId)?.color }} />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">{phase.durationMonths} MO</span>
                          </>
                        )}
                      </div>
                    </div>
                    {!isPhaseEditing && (
                      <div className="flex items-center space-x-1 shrink-0 ml-2 mt-1">
                        <div className="flex flex-col">
                          <button 
                            aria-label={`Move phase ${idx + 1} up`}
                            disabled={idx === 0}
                            onClick={() => handleMovePhase(idx, 'up')}
                            className={`p-0.5 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black ${idx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            aria-label={`Move phase ${idx + 1} down`}
                            disabled={idx === editedEx.phases.length - 1}
                            onClick={() => handleMovePhase(idx, 'down')}
                            className={`p-0.5 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black ${idx === editedEx.phases.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <button 
                          aria-label={`Edit phase ${idx + 1}`}
                          onClick={() => handleStartEditPhase(phase)} 
                          className="p-1 text-black hover:text-blue-600 transition-colors border border-transparent hover:border-black"
                        >
                          <Edit2 size={16}/>
                        </button>
                        <button 
                          aria-label={`Remove phase ${idx + 1}`}
                          onClick={() => handleRemovePhase(phase.id)} 
                          className="p-1 text-black hover:text-red-600 transition-colors border border-transparent hover:border-black"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="ex-description" className="text-xs font-black uppercase border-b border-slate-200 pb-1 block">NARRATIVE</label>
          <div className="p-4 border border-slate-300 rounded bg-white min-h-[120px] shadow-inner">
            {isEditing ? (
              <textarea 
                id="ex-description"
                className="w-full text-xs font-bold bg-transparent text-black border-none outline-none h-28 uppercase resize-none focus:bg-yellow-50/50" 
                value={editedEx.description} 
                onChange={(e) => handleFieldChange('description', e.target.value.toUpperCase())} 
              />
            ) : (
              <p className="text-xs font-bold uppercase leading-relaxed text-slate-700">
                {exhibition.description || "NO PROJECT DESCRIPTION PROVIDED."}
              </p>
            )}
          </div>
        </div>
      </div>

          <div className="p-4 border-t border-slate-200 flex gap-3 bg-white shrink-0">
        {isEditing ? (
          <>
            <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-white border border-slate-300 rounded font-black uppercase text-xs hover:bg-slate-100 focus:ring-2 focus:ring-black">DISCARD</button>
            <button onClick={handleSaveAll} className="flex-1 py-2 bg-black text-white border border-slate-300 rounded font-black uppercase text-xs hover:bg-slate-800 focus:ring-2 focus:ring-black">SAVE ALL</button>
          </>
        ) : (
          <>
            <button 
              aria-label="Duplicate this project"
              onClick={() => onDuplicate(exhibition.id)} 
              className="flex-1 py-2 bg-white border border-slate-300 rounded font-black uppercase text-[10px] flex items-center justify-center hover:bg-slate-100 focus:ring-2 focus:ring-black transition-colors"
            >
              <Copy size={13} className="mr-2" /> DUPLICATE
            </button>
            <button 
              aria-label="Delete this project"
              onClick={() => onDelete(exhibition.id)} 
              className="flex-1 py-2 bg-white border border-slate-300 rounded font-black uppercase text-[10px] flex items-center justify-center hover:bg-red-500 hover:text-white focus:ring-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 size={13} className="mr-2" /> REMOVE
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

// --- Main App ---

export default function MasterScheduler() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_EXHIBITIONS;
    } catch { return INITIAL_EXHIBITIONS; }
  });

  const [museumName, setMuseumName] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      return saved ? JSON.parse(saved).museumName : 'NATIONAL HERITAGE TRUST';
    } catch { return 'NATIONAL HERITAGE TRUST'; }
  });

  const [galleries, setGalleries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      return saved ? JSON.parse(saved).galleries : DEFAULT_GALLERIES;
    } catch { return DEFAULT_GALLERIES; }
  });

  const [phaseTypes, setPhaseTypes] = useState<PhaseType[]>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!saved) return DEFAULT_PHASE_TYPES;
      const parsed = JSON.parse(saved);
      const existing = (parsed.phaseTypes || []).filter((pt: PhaseType) => pt.label !== 'PRODUCTION / FAB');
      const merged = [...existing];
      DEFAULT_PHASE_TYPES.forEach(dpt => {
        if (!merged.find(pt => pt.label === dpt.label)) {
          merged.push(dpt);
        }
      });
      return merged;
    } catch { return DEFAULT_PHASE_TYPES; }
  });

  const [locationMilestones, setLocationMilestones] = useState<LocationMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(MILESTONES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [monthWidth, setMonthWidth] = useState(120); 
  const [activeTab, setActiveTab] = useState<'portfolio' | 'settings'>('portfolio');
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  
  const [draggingBarId, setDraggingBarId] = useState<string | null>(null);
  const [dragStartMouseX, setDragStartMouseX] = useState(0);
  const [dragStartProjectX, setDragStartProjectX] = useState(0);
  const [dragDurationDays, setDragDurationDays] = useState(0);
  const longPressTimerRef = useRef<number | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);

  const [timelineStartDate, setTimelineStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
  });

  const [editMilestoneDraft, setEditMilestoneDraft] = useState<LocationMilestone | null>(null);

  const [timelineEndDate, setTimelineEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    d.setMonth(d.getMonth() + 6);
    return toISODate(new Date(d.getFullYear(), d.getMonth(), 0));
  });

  const applyPreset = (years: number) => {
    if (isNaN(years)) return;
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    setTimelineStartDate(toISODate(new Date(d.getFullYear(), d.getMonth(), 1)));
    const e = new Date(d);
    e.setFullYear(e.getFullYear() + years);
    setTimelineEndDate(toISODate(new Date(e.getFullYear(), e.getMonth(), 0)));
  };

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
      const galleryProjects = exhibitions.filter(ex => ex.gallery === gallery);
      const layoutInfo = calculateTracks(galleryProjects, monthWidth, viewMonths, phaseTypes);
      layouts[gallery] = { tracks: layoutInfo.tracks, maxTracks: layoutInfo.maxTracks };
    });
    return layouts;
  }, [exhibitions, galleries, monthWidth, viewMonths, phaseTypes]);

  useEffect(() => {
    if (draggingBarId) return; // Prevent blocking the main thread with synchronous I/O during drag
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exhibitions));
    }, 300);
    return () => clearTimeout(timeout);
  }, [exhibitions, draggingBarId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(locationMilestones));
    }, 300);
    return () => clearTimeout(timeout);
  }, [locationMilestones]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ museumName, galleries, phaseTypes }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [museumName, galleries, phaseTypes]);

  const handleUpdateExhibition = (updatedEx: Exhibition) => {
    setExhibitions(prev => prev.map(ex => (ex.id === updatedEx.id ? updatedEx : ex)));
  };

  const handleUpdateGalleryName = (oldName: string, newName: string) => {
    if (!newName || newName.trim() === '' || oldName === newName) return;
    if (galleries.includes(newName)) return;
    setGalleries(prev => prev.map(g => g === oldName ? newName : g));
    setExhibitions(prev => prev.map(ex => ex.gallery === oldName ? { ...ex, gallery: newName } : ex));
    setLocationMilestones(prev => prev.map(m => m.gallery === oldName ? { ...m, gallery: newName } : m));
  };

  const handleAddGallery = () => {
    const newName = `NEW LOCATION ${galleries.length + 1}`;
    if (galleries.includes(newName)) return;
    setGalleries([...galleries, newName]);
  };

  const handleRemoveGallery = (name: string) => {
    if (galleries.length <= 1) return;
    const remaining = galleries.filter(g => g !== name);
    setGalleries(remaining);
    setExhibitions(prev => prev.map(ex => ex.gallery === name ? { ...ex, gallery: remaining[0] } : ex));
    setLocationMilestones(prev => prev.filter(m => m.gallery !== name));
  };

  const handleDuplicateProject = (id: string) => {
    const source = exhibitions.find(ex => ex.id === id);
    if (!source) return;
    const copy = { 
      ...source, 
      id: Math.random().toString(36).substr(2, 9), 
      title: `${source.title} (COPY)`, 
      phases: [...source.phases.map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) }))] 
    };
    setExhibitions([...exhibitions, copy]);
  };

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
    <div className={`min-h-screen bg-slate-50 text-black flex flex-col font-mono overflow-hidden select-none antialiased ${draggingBarId ? 'cursor-grabbing' : ''}`}>
      <style>{`
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-left: 2px solid #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #000; }
        .is-grabbing { cursor: grabbing !important; }
        @media print { .no-print { display: none !important; } }
        
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
          background-image: repeating-linear-gradient(0deg, transparent, transparent 63px, rgba(0,0,0,0.02) 63px, rgba(0,0,0,0.02) 64px);
        }
      `}</style>
      
      {editMilestoneDraft && (
        <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditMilestoneDraft(null)}>
          <div className="bg-white border border-slate-300 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-black text-white px-4 py-3 font-black tracking-widest flex justify-between items-center text-[10px]">
              <span>EDIT MILESTONE</span>
              <button aria-label="Close" onClick={() => setEditMilestoneDraft(null)} className="hover:text-red-400 transition-colors">
                <X size={14} strokeWidth={3} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Milestone Title</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded p-3 font-black uppercase text-sm outline-none focus:bg-slate-50 transition-colors" 
                  value={editMilestoneDraft.title} 
                  onChange={(e) => setEditMilestoneDraft({ ...editMilestoneDraft, title: e.target.value.toUpperCase() })} 
                  autoFocus 
                  placeholder="E.G. BOARD MEETING"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Date</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded p-3 font-bold uppercase text-sm outline-none focus:bg-slate-50 transition-colors" 
                  value={editMilestoneDraft.date} 
                  onChange={(e) => setEditMilestoneDraft({ ...editMilestoneDraft, date: e.target.value })} 
                />
              </div>
              
              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Milestone Icon & Color</label>
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={() => setEditMilestoneDraft({ ...editMilestoneDraft, icon: 'diamond' })}
                    className={`flex items-center space-x-2 px-4 py-2 border-2 transition-colors ${editMilestoneDraft.icon !== 'flag' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="w-3 h-3 bg-white border border-black rotate-45" />
                    <span className="text-[10px] font-bold uppercase">Diamond</span>
                  </button>
                  <button 
                    onClick={() => setEditMilestoneDraft({ ...editMilestoneDraft, icon: 'flag' })}
                    className={`flex items-center space-x-2 px-4 py-2 border-2 transition-colors ${editMilestoneDraft.icon === 'flag' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Flag size={14} fill="white" stroke="black" strokeWidth={2} />
                    <span className="text-[10px] font-bold uppercase">Flag</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {MILESTONE_COLORS.map(c => (
                    <button 
                      key={c.value}
                      onClick={() => setEditMilestoneDraft({ ...editMilestoneDraft, color: c.value })}
                      className={`flex items-center space-x-2 px-3 py-1.5 border-2 hover:bg-slate-50 transition-colors ${editMilestoneDraft.color === c.value || (!editMilestoneDraft.color && c.value === '#dc2626') ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}
                    >
                      <div className="w-3 h-3 rounded-full border border-black" style={{ backgroundColor: c.value }} />
                      <span className="text-[8px] font-bold tracking-widest uppercase">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/10 mt-6">
                <button 
                  onClick={() => {
                    setLocationMilestones(prev => prev.filter(m => m.id !== editMilestoneDraft.id));
                    setEditMilestoneDraft(null);
                  }} 
                  className="text-red-600 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center"
                >
                  <Trash2 size={12} className="mr-1.5" strokeWidth={3} /> DELETE
                </button>
                <button 
                  onClick={() => {
                    if (editMilestoneDraft.title.trim() === '') {
                      setLocationMilestones(prev => prev.filter(m => m.id !== editMilestoneDraft.id));
                    } else {
                      setLocationMilestones(prev => prev.map(m => m.id === editMilestoneDraft.id ? editMilestoneDraft : m));
                    }
                    setEditMilestoneDraft(null);
                  }} 
                  className="bg-black text-white px-6 py-2.5 border border-slate-300 rounded font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
                >
                  SAVE OVERRIDE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProjectId && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[90] no-print backdrop-blur-[1px]" onClick={() => setSelectedProjectId(null)} />
          <DetailPanel 
            exhibition={exhibitions.find(p => p.id === selectedProjectId)!} 
            onClose={() => setSelectedProjectId(null)} 
            onUpdate={handleUpdateExhibition} 
            onDelete={(id) => { setExhibitions(exhibitions.filter(x => x.id !== id)); setSelectedProjectId(null); }}
            onDuplicate={handleDuplicateProject}
            galleries={galleries}
            phaseTypes={phaseTypes}
          />
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'portfolio' ? (
          <>
            <header className="bg-white border-b border-slate-200 z-50 shrink-0">
              <nav className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex flex-col">
                    <h1 className="text-[11px] font-black tracking-tight uppercase leading-none">{museumName}</h1>
                  </div>
                </div>

                <div className="flex items-center space-x-4 no-print">
                  <div className="flex items-center space-x-2 border border-slate-300 rounded px-2 py-1 bg-slate-50">
                    <input aria-label="Timeline start date" type="date" value={timelineStartDate} onChange={(e) => setTimelineStartDate(e.target.value)} className="bg-transparent text-[9px] font-black uppercase outline-none w-[100px]" />
                    <span className="font-bold text-slate-300">-</span>
                    <input aria-label="Timeline end date" type="date" value={timelineEndDate} onChange={(e) => setTimelineEndDate(e.target.value)} className="bg-transparent text-[9px] font-black uppercase outline-none w-[100px]" />
                    <select aria-label="Select timeline view preset" onChange={(e) => applyPreset(parseInt(e.target.value))} className="bg-transparent text-[9px] font-black uppercase outline-none ml-1 border-l border-slate-200 pl-1 cursor-pointer">
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
                    aria-label="Create new exhibition project"
                    onClick={() => {
                      const id = Math.random().toString(36).substr(2,9);
                      const now = new Date();
                      const exStart = new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000); // 12 months ahead
                      const exEnd = new Date(exStart.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // 3 months duration
                      setExhibitions([...exhibitions, { 
                        id, 
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
                      }]);
                      setSelectedProjectId(id);
                    }} 
                    className="px-4 py-1.5 bg-black text-white border border-slate-300 rounded font-black uppercase text-[9px] hover:bg-slate-800 transition-colors flex items-center"
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
                  <div style={{ height: '50px' }} className="relative border-b-[3px] border-slate-800 bg-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="absolute top-0 left-0 w-full h-full bg-slate-50 flex items-center px-4 py-2 z-20">
                      <div className="flex flex-col">
                        {/* Labels removed as redundant */}
                      </div>
                    </div>
                  </div>
                  {galleries.map((gallery) => {
                    const tracksCount = galleryLayouts[gallery]?.maxTracks || 1;
                    const laneHeight = Math.max(BASE_LANE_HEIGHT, tracksCount * TRACK_HEIGHT + 50);
                    const galleryProjects = exhibitions.filter(ex => ex.gallery === gallery);
                    return (
                      <div key={gallery} style={{ height: `${laneHeight}px` }} className="relative border-b-[3px] border-slate-800 bg-white">
                        <div className="absolute top-0 left-0 w-full min-h-[36px] bg-slate-900 flex items-center px-4 py-2 z-20">
                          <span className="font-black uppercase text-[10px] tracking-widest text-white leading-tight break-words">{gallery}</span>
                        </div>
                        {galleryProjects.map(ex => {
                          const trackIndex = galleryLayouts[gallery]!.tracks[ex.id];
                          if (trackIndex === undefined) return null;
                          const topPos = 46 + (trackIndex * TRACK_HEIGHT);
                          return (
                            <div key={`title-${ex.id}`} className="absolute left-4 w-[calc(100%-1rem)] pr-2" style={{ top: topPos + 10 }}>
                              <div className="text-[10px] font-bold text-slate-800 leading-tight whitespace-normal break-words underline decoration-slate-200 decoration-1 underline-offset-2">{ex.title}</div>
                              {ex.exhibitionId && (
                                <div className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">
                                  {ex.exhibitionId}
                                </div>
                              )}
                              {ex.phases && ex.phases.length > 0 && (
                                <div className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">
                                  {ex.phases.length} Phases
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {galleryProjects.map(ex => {
                          const trackIndex = galleryLayouts[gallery]!.tracks[ex.id];
                          if (trackIndex === undefined || trackIndex === 0) return null;
                          return (
                            <div key={`side-div-${ex.id}`} className="absolute w-full border-t-[1.5px] border-slate-200 left-0" style={{ top: 46 + trackIndex * TRACK_HEIGHT }} />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </aside>
              
              <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                {/* Print Only Branding Header */}
                <div className="hidden print:block mb-4 p-8 border-b-4 border-black">
                  <h1 className="text-4xl font-black uppercase tracking-tighter">{museumName}</h1>
                  <p className="text-sm font-black uppercase tracking-[0.2em] mt-2 text-slate-500">Master Exhibition Timeline • {timelineStartDate} to {timelineEndDate}</p>
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
                  setDraggingBarId(null);
                  clearLongPress();
                }}
                onMouseLeave={() => {
                  setIsDraggingScroll(false);
                  setDraggingBarId(null);
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
                    
                    setExhibitions(prev => prev.map(ex => 
                      ex.id === draggingBarId ? { ...ex, startDate: newStartDate, endDate: newEndDate } : ex
                    ));
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
                    <div className="sticky top-[6px] bg-red-600 text-white font-black text-[8px] px-1.5 py-0.5 uppercase transform -translate-x-1/2 shadow-sm w-max whitespace-nowrap rounded-sm">TODAY</div>
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
                      {yearBlocks.map(block => <div key={block.label} style={{ width: `${monthWidth * block.count}px` }} className="shrink-0 h-full flex items-center px-3 font-black text-sm tracking-tight uppercase text-black border-r border-slate-300 print:border-slate-400">{block.label}</div>)}
                    </div>
                    <div className="flex h-[26px] border-b border-orange-200 text-orange-900 bg-orange-100/90 relative z-10 print:bg-orange-100 print:border-orange-300">
                      {fyBlocks.map((block) => (
                        <div key={block.label} style={{ width: `${monthWidth * block.count}px` }} className="shrink-0 h-full flex items-center px-3 font-bold text-[9px] uppercase tracking-widest border-r border-orange-200 print:border-orange-300">{block.label}</div>
                      ))}
                    </div>
                    <div className="flex h-[17px] border-b border-slate-200/20 bg-slate-100/70 relative z-10 print:bg-slate-100">
                      {fyQuarterBlocks.map((block, i) => <div key={`${block.label}-${i}`} style={{ width: `${monthWidth * block.count}px` }} className="shrink-0 h-full flex items-center justify-center border-r border-slate-200/20 text-[8px] font-black uppercase tracking-widest text-slate-500 print:text-slate-900">{block.label}</div>)}
                    </div>
                    <div className="flex h-[17px] bg-white border-b border-slate-200/30 relative z-10 print:bg-white">
                      {viewMonths.map(m => <div key={`${m.year}-${m.month}`} style={{ width: `${monthWidth}px` }} className="shrink-0 h-full flex items-center justify-center border-r border-slate-200/10 text-[8px] font-bold text-slate-600 print:text-slate-900">{m.label}</div>)}
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
                      {/* Provincial Holidays Lane */}
                      <div style={{ height: '50px' }} className="border-b-[3px] border-slate-800 bg-white/40 relative overflow-visible z-10 no-print-lane">
                        <div className="absolute inset-0 bg-slate-50/50 -z-10" />
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
                                
                                <div className={`absolute left-1/2 -translate-x-1/2 text-[7px] font-black uppercase text-slate-800 whitespace-nowrap z-30 pointer-events-none transition-all duration-200 border border-slate-200 px-1.5 py-[1px] bg-white rounded shadow-sm flex items-center gap-1 ${labelPos === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
                                  {holiday.label}
                                  <span className="text-[5px] text-slate-400 font-bold opacity-60">
                                    {holiday.date.split('-')[1]}/{holiday.date.split('-')[2]}
                                  </span>
                                </div>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-400/0 group-hover/holiday:bg-slate-400/10 transition-colors pointer-events-none" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {galleries.map((g) => {
                         const tracksCount = galleryLayouts[g]?.maxTracks || 1;
                         const laneHeight = Math.max(BASE_LANE_HEIGHT, tracksCount * TRACK_HEIGHT + 50);
                         const galleryProjects = exhibitions.filter(ex => ex.gallery === g);

                         const footprints = galleryProjects.map(ex => {
                           const startPos = getPositionFromDate(ex.startDate, monthWidth, viewMonths);
                           const endPos = getPositionFromDate(ex.endDate, monthWidth, viewMonths);
                           const totalPhaseWidth = (ex.phases || []).reduce((acc, p) => acc + p.durationMonths * monthWidth, 0);
                           const phaseStartPos = startPos - totalPhaseWidth;
                           let implStartPos = startPos;
                           let currentOffset = 0;
                           for (const p of (ex.phases || [])) {
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
                                 style={{ left: overlap.startX, width: Math.max(2, overlap.endX - overlap.startX), top: '36px' }}
                               >
                                 <div className="bg-white border-2 border-red-500/50 text-red-600 font-black uppercase text-[8px] tracking-widest flex items-center shadow-sm w-max ml-2 mt-2" style={{ padding: '2px 4px' }}>
                                   <AlertTriangle size={10} className="mr-1.5 shrink-0" strokeWidth={3} /> CONFLICT
                                 </div>
                               </div>
                             ))}
                             <div 
                               className="absolute top-0 left-0 w-full h-[36px] bg-slate-100/50 border-b border-black/5 z-20 group relative cursor-crosshair overflow-visible"
                               onDoubleClick={(e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 const x = Math.max(0, e.clientX - rect.left + timelineRef.current!.scrollLeft);
                                 const date = getDateFromPosition(x, monthWidth, viewMonths);
                                 const newMilestone: LocationMilestone = { 
                                   id: Math.random().toString(36).substr(2,9), 
                                   gallery: g, 
                                   title: 'MILESTONE', 
                                   date 
                                 };
                                 setLocationMilestones([...locationMilestones, newMilestone]);
                                 setEditMilestoneDraft(newMilestone);
                               }}
                             >
                                <div className="hidden group-hover:flex absolute left-4 h-full items-center text-[9px] text-slate-400 font-bold uppercase pointer-events-none tracking-widest gap-2">
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
                                            <div className="w-3.5 h-3.5 bg-white border-[1.5px] border-black rotate-45 shadow-[1px_1px_0_0_rgba(0,0,0,1)] flex items-center justify-center pointer-events-none">
                                              <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: m.color || '#dc2626' }} />
                                            </div>
                                          )}
                                        </div>
                                        <div className={`absolute left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase text-slate-600 bg-white px-1.5 py-[1px] leading-tight border border-slate-200 rounded shadow-md opacity-90 transition-all hover:bg-slate-50 hover:opacity-100 whitespace-nowrap z-30 pointer-events-none ${labelPos === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}>
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
                                 <div key={`line-${ex.id}`} className="absolute w-full border-t-[1.5px] border-slate-300 z-10 pointer-events-none" style={{ top: 46 + trackIndex * TRACK_HEIGHT }} />
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
                        let currentGalleryY = 0;
                        return galleries.flatMap((gallery) => {
                          const galleryProjects = exhibitions.filter(ex => ex.gallery === gallery);
                          const layout = galleryLayouts[gallery];
                          const tracksCount = layout?.maxTracks || 1;
                          const laneHeight = Math.max(BASE_LANE_HEIGHT, tracksCount * TRACK_HEIGHT + 50);
                          const galleryYOffset = currentGalleryY;
                          currentGalleryY += laneHeight;

                          return galleryProjects.map(ex => {
                            const trackIndex = layout?.tracks[ex.id] || 0;
                            const startPos = getPositionFromDate(ex.startDate, monthWidth, viewMonths);
                            const endPos = getPositionFromDate(ex.endDate, monthWidth, viewMonths);
                            const width = Math.max(endPos - startPos, 40);
                            const isDraggingThis = draggingBarId === ex.id;
                            const trackTop = galleryYOffset + 46 + (trackIndex * TRACK_HEIGHT);

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
                                          <span className={`text-[9px] font-black uppercase whitespace-normal break-words leading-none ${getContrastColor(phase.type?.color || '#eee')} drop-shadow-sm`}>{phase.label}</span>
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
                                  <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-black whitespace-normal break-words uppercase text-[10px] leading-tight tracking-tight text-slate-900 line-clamp-1">{ex.title}</h4>
                                      <span 
                                        className="text-[7px] font-black uppercase px-1 py-0.5 rounded border border-black/10 ml-2 shrink-0 bg-white/50"
                                        style={{ color: getStatusStyles(ex.status).text }}
                                      >
                                        {getStatusStyles(ex.status).label}
                                      </span>
                                    </div>
                                    <div className="flex items-center mt-0.5 space-x-1.5 text-[8px] font-black uppercase text-slate-600">
                                      <span>{formatBarDate(ex.startDate)}</span>
                                      <span className="opacity-40">/</span>
                                      <span>{formatBarDate(ex.endDate)}</span>
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
                className="inline-flex items-center font-bold uppercase text-[9px] border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-50 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500/50"
              >
                <ArrowLeft size={12} className="mr-2" /> DASHBOARD
              </button>
              <h2 className="text-3xl font-black uppercase tracking-tight">SYSTEM SETTINGS</h2>
            </header>
            
            <div className="space-y-8 border-t-4 border-black pt-8">
              <section className="space-y-6">
                <div className="flex items-center text-sm font-black uppercase tracking-widest space-x-3 text-slate-900"><Building2 size={18} /><span>ORG STANDARDS</span></div>
                <div className="border border-slate-300 rounded p-6 bg-slate-50 shadow-sm hover:shadow-md transition-all">
                  <label htmlFor="museum-name-input" className="text-[9px] font-black uppercase mb-2 block text-slate-400">ORGANIZATION NAME</label>
                  <input 
                    id="museum-name-input"
                    className="w-full text-lg font-black bg-white border border-slate-300 rounded p-3 outline-none uppercase shadow-inner focus:border-black transition-colors" 
                    value={museumName} 
                    onChange={(e) => setMuseumName(e.target.value.toUpperCase())} 
                  />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center text-sm font-black uppercase tracking-widest space-x-3 text-slate-900"><Palette size={18} /><span>PHASE TYPES</span></div>
                <div className="grid grid-cols-2 gap-4">
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
                          className="w-full font-bold uppercase text-[10px] outline-none border-b border-transparent focus:border-black bg-transparent" 
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
                  <div className="flex items-center text-sm font-black uppercase tracking-widest space-x-3 text-slate-900"><MapPin size={18} /><span>LOCATIONS & GALLERIES</span></div>
                  <button 
                    onClick={handleAddGallery}
                    className="text-[9px] font-black uppercase bg-black text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    + ADD LOCATION
                  </button>
                </div>
                <div className="space-y-3">
                  {galleries.map((gallery, idx) => (
                    <div key={`${gallery}-${idx}`} className="flex items-center space-x-3 p-3 border border-slate-300 rounded bg-white shadow-sm hover:shadow-md transition-all">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center font-black text-slate-400 text-xs">{idx + 1}</div>
                      <input 
                        aria-label={`Location name ${idx + 1}`}
                        className="flex-1 font-black uppercase text-sm border-b-2 border-transparent focus:border-black bg-transparent outline-none py-1" 
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

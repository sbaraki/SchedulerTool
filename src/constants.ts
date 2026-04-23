import { PhaseType } from './types';

export const STORAGE_KEY = 'exhibition_planner_brutalist_v4';
export const CONFIG_STORAGE_KEY = 'exhibition_planner_config_v5';
export const MILESTONES_STORAGE_KEY = 'exhibition_planner_milestones_v4';

export const DEFAULT_GALLERIES = [
  'FEATURE GALLERY',
  'NATURAL HISTORY SOUTH',
  'HUMAN HISTORY NORTH',
  'HUMAN HISTORY SOUTH'
];

export const DEFAULT_PHASE_TYPES: PhaseType[] = [
  { id: 'pt1', label: 'IDEA DEVELOPMENT', color: '#94a3b8' },
  { id: 'pt2', label: 'CONTENT DEVELOPMENT', color: '#3b82f6' },
  { id: 'pt3', label: 'DESIGN DEVELOPMENT', color: '#a3cc39' },
  { id: 'pt4', label: 'IMPLEMENTATION', color: '#fba84a' },
  { id: 'pt5', label: 'DEINSTALL', color: '#fba84a', isPost: true },
];

export const MILESTONE_COLORS = [
  { value: '#dc2626', label: 'CRITICAL / DEFAULT' },
  { value: '#94a3b8', label: 'IDEA / PLANNING' },
  { value: '#3b82f6', label: 'CONTENT / REVIEW' },
  { value: '#22c55e', label: 'DESIGN / APPROVAL' },
  { value: '#f97316', label: 'EXECUTION / BUILD' },
  { value: '#000000', label: 'FINAL / OPENING' },
  { value: '#64748b', label: 'SECONDARY / HOLIDAY' }
];

export const ALBERTA_HOLIDAYS = [
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
  { date: '2027-12-26', label: 'Boxing Day', type: 'Optional' }
];

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const FY_QUARTERS = ['Q4', 'Q1', 'Q2', 'Q3'];
export const BASE_LANE_HEIGHT = 120; 
export const TRACK_HEIGHT = 56; 
export const HEADER_HEIGHT = 100; 
export const STANDARD_BAR_HEIGHT = 24; 
export const PHASE_BAR_HEIGHT = 12;

export const getStatusStyles = (status: string) => {
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

export const getContrastColor = (hexcolor: string) => {
  if (!hexcolor || hexcolor.length < 7) return 'text-black';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 160) ? 'text-black' : 'text-white';
};

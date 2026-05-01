import fs from 'fs';

let code = fs.readFileSync('index.tsx', 'utf8');

// 1. Add new imports
if(!code.includes("import { useStore }")) {
  code = `import { useStore } from './src/store/useStore';
import { useMuseumSync } from './src/hooks/useMuseumSync';
import { useMuseumActions } from './src/hooks/useMuseumActions';
import { getStatusStyles, getContrastColor, ALBERTA_HOLIDAYS, MONTHS, FY_QUARTERS, BASE_LANE_HEIGHT, TRACK_HEIGHT, HEADER_HEIGHT, STANDARD_BAR_HEIGHT, PHASE_BAR_HEIGHT, MILESTONE_COLORS } from './src/constants';
import { toISODate, getPositionFromDate, getDateFromPosition, formatBarDate } from './src/lib/dateUtils';
import { calculateTracks } from './src/lib/layoutEngine';
import { Exhibition, PhaseType, LocationMilestone, ProjectPhase, ExhibitionStatus } from './src/types';
` + code;
}

// 2. Strip out definitions that moved to files (up to Main App marker), we only want to do this safely.
// We'll look for "type ExhibitionStatus =" and delete everything up to "// --- Components ---"
const stripPattern = /(type ExhibitionStatus = 'Proposed'.*?\/\/ --- Components ---)/s;
code = code.replace(stripPattern, '// --- Components ---\n');

// 3. Replace the MasterScheduler states + UI states up to applyPreset.
const replaceStateDef = `export default function MasterScheduler() {
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
  };`;

const oldStateStart = "export default function MasterScheduler() {";
const oldStateEnd = "const filteredExhibitions = useMemo(() => {";

const sIdx = code.indexOf(oldStateStart);
const eIdx = code.indexOf(oldStateEnd);

if (sIdx !== -1 && eIdx !== -1) {
  code = code.slice(0, sIdx) + replaceStateDef + "\n\n  " + code.slice(eIdx);
}

// 4. Strip the raw sync logic that moved to useMuseumActions / useMuseumSync
// We look for the exact string sequences.
const cleanupStart = "useEffect(() => {\n    if (draggingBarId) return;";
const cleanupEnd = "const todayPos = useMemo(() => {";

const cIdxStart = code.lastIndexOf(cleanupStart);
const cIdxEnd = code.lastIndexOf(cleanupEnd);

if(cIdxStart !== -1 && cIdxEnd !== -1) {
  code = code.slice(0, cIdxStart) + code.slice(cIdxEnd);
}

// Write the file back
fs.writeFileSync('index.tsx', code, 'utf8');
console.log("Refactoring pass completed.");

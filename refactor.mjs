import fs from 'fs';

let code = fs.readFileSync('index.tsx', 'utf8');

// 1. Remove the old imports that are no longer needed 
// Note: We don't want to blindly regex delete, we just need to add our hook imports.
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

// Strip out the definitions that moved to files:
const stripPattern = /(type ExhibitionStatus = 'Proposed'.*?\/\/ --- Components ---)/s;
code = code.replace(stripPattern, '// --- Components ---\n');

// Replace the MasterScheduler states
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
  const { handleUpdateExhibition, handleRemoveExhibition, handleUpdateGalleryName, handleAddGallery, handleRemoveGallery, handleDuplicateProject } = useMuseumActions(currentUser, setSyncStatus);`;

const oldStateStart = "export default function MasterScheduler() {";
const oldStateEnd = "const todayPos = useMemo(() => {";

const sIdx = code.indexOf(oldStateStart);
const eIdx = code.indexOf(oldStateEnd);

if (sIdx !== -1 && eIdx !== -1) {
  code = code.slice(0, sIdx) + replaceStateDef + "\n\n  " + code.slice(eIdx);
}

// Clean up some residual unused code from the top if needed
code = code.replace(/import \{ ExhibitionStatus \} from '\.\/src\/types';\n/g, "");

fs.writeFileSync('index.tsx', code, 'utf8');
console.log("Refactoring index.tsx hooks completed.");

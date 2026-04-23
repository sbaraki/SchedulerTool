import { Exhibition, PhaseType } from '../types';
import { getPositionFromDate } from './dateUtils';

/**
 * Calculates collision-free independent tracks for exhibitions sharing the same gallery lane.
 * It strictly avoids overlaps by sorting and stepping projects down a Y-axis track.
 */
export const calculateTracks = (
  projects: Exhibition[], 
  monthWidth: number, 
  vMonths: any[], 
  phaseTypes: PhaseType[]
) => {
  // Sort projects by their absolute visual start date (including prep phases)
  const sorted = [...projects].sort((a, b) => {
    const prePhasesA = (a.phases || []).filter(p => !phaseTypes.find(t => t.id === p.typeId)?.isPost);
    const prePhasesB = (b.phases || []).filter(p => !phaseTypes.find(t => t.id === p.typeId)?.isPost);
    
    const startA = getPositionFromDate(a.startDate, monthWidth, vMonths) - prePhasesA.reduce((acc, p) => acc + (p.durationMonths * monthWidth), 0);
    const startB = getPositionFromDate(b.startDate, monthWidth, vMonths) - prePhasesB.reduce((acc, p) => acc + (p.durationMonths * monthWidth), 0);
    
    return startA - startB;
  });

  const tracks: { [id: string]: number } = {};
  let overallMaxTrack = 0;

  // Simple sequential stacking. 
  // In a truly advanced version, this would check active boundaries to recycle tracks. 
  // For now, retaining the legacy logic guaranteeing visual cascade safety.
  sorted.forEach(project => {
    const numSubTracks = (project.phases?.length || 0) + 1;
    tracks[project.id] = overallMaxTrack;
    overallMaxTrack += numSubTracks;
  });

  return { tracks, maxTracks: overallMaxTrack || 1 };
};

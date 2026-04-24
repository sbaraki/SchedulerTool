import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { CONFIG_STORAGE_KEY, MILESTONES_STORAGE_KEY, STORAGE_KEY, DEFAULT_PHASE_TYPES, DEFAULT_GALLERIES } from '../constants';
import { Exhibition, LocationMilestone, PhaseType } from '../types';
import { getGistData, updateGistData } from '../lib/githubGist';

export interface GithubUser {
  pat: string;
  gistId: string;
  displayName: string;
  email: string;
}

const normalizePhaseTypes = (phaseTypes: PhaseType[] = []): PhaseType[] => {
  const normalizedDefaults = DEFAULT_PHASE_TYPES.map((defaultType) => {
    const matched = phaseTypes.find((phaseType) => (
      phaseType.id === defaultType.id || phaseType.label === defaultType.label
    ));
    if (!matched) return defaultType;
    return {
      ...defaultType,
      ...matched,
      id: defaultType.id,
      isPost: defaultType.isPost,
      isActive: defaultType.isActive
    };
  });
  const customTypes = phaseTypes
    .filter((phaseType) => !DEFAULT_PHASE_TYPES.find((defaultType) => (
      defaultType.id === phaseType.id || defaultType.label === phaseType.label
    )))
    .map((phaseType) => ({
      ...phaseType,
      isPost: phaseType.isPost ?? false,
      isActive: phaseType.isActive ?? false
    }));
  return [...normalizedDefaults, ...customTypes];
};

export const useMuseumSync = () => {
  const [currentUser, setCurrentUser] = useState<GithubUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Track last synced state to prevent redundant saves
  const lastSyncedStateRef = useRef<string | null>(null);

  const { 
    exhibitions, setExhibitions,
    museumName, setMuseumName,
    galleries, setGalleries,
    phaseTypes, setPhaseTypes,
    locationMilestones, setLocationMilestones
  } = useStore();

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const savedEx = localStorage.getItem(STORAGE_KEY);
      if (savedEx) setExhibitions(JSON.parse(savedEx));
      
      const savedMs = localStorage.getItem(MILESTONES_STORAGE_KEY);
      if (savedMs) setLocationMilestones(JSON.parse(savedMs));

      const savedCfg = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedCfg) {
        const parsedCfg = JSON.parse(savedCfg);
        if (parsedCfg.museumName) setMuseumName(parsedCfg.museumName);
        if (parsedCfg.galleries) setGalleries(parsedCfg.galleries);
        const parsedPhaseTypes = (parsedCfg.phaseTypes || []).filter((phaseType: PhaseType) => phaseType.label !== 'PRODUCTION / FAB');
        setPhaseTypes(normalizePhaseTypes(parsedPhaseTypes));
      }

      // Check for GitHub auth
      const savedPat = localStorage.getItem('github_pat');
      const savedGistId = localStorage.getItem('github_gist_id');
      if (savedPat && savedGistId) {
        setCurrentUser({ pat: savedPat, gistId: savedGistId, displayName: 'GitHub Sync', email: 'Active' });
      }
    } catch (e) {
      console.error("Local load error", e);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  // 2. Continuous LocalStorage Backup
  useEffect(() => {
    if (isInitialLoad) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exhibitions));
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(locationMilestones));
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ museumName, galleries, phaseTypes }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [exhibitions, locationMilestones, museumName, galleries, phaseTypes, isInitialLoad]);

  // 3. GitHub Gist Initial Data Pull
  useEffect(() => {
    if (!currentUser || isInitialLoad) return;

    const pullData = async () => {
      try {
        setSyncStatus('syncing');
        const data = await getGistData(currentUser.gistId, currentUser.pat);
        if (data) {
          if (data.museumName) setMuseumName(data.museumName);
          if (data.galleries) setGalleries(data.galleries);
          if (data.phaseTypes) setPhaseTypes(normalizePhaseTypes(data.phaseTypes));
          if (data.exhibitions) setExhibitions(data.exhibitions);
          if (data.locationMilestones) setLocationMilestones(data.locationMilestones);
          
          lastSyncedStateRef.current = JSON.stringify({
            museumName: data.museumName || 'NATIONAL HERITAGE TRUST',
            galleries: data.galleries || DEFAULT_GALLERIES,
            phaseTypes: normalizePhaseTypes(data.phaseTypes || []),
            exhibitions: data.exhibitions || [],
            locationMilestones: data.locationMilestones || []
          });
        }
        setSyncStatus('synced');
      } catch (err) {
        console.error("Gist pull error", err);
        setSyncStatus('error');
      }
    };
    
    // Only pull once when user authenticates
    pullData();
  }, [currentUser]); // Deliberately omit everything else to only run on auth change

  // 4. Auto-save to GitHub Gist when state changes
  useEffect(() => {
    if (!currentUser || isInitialLoad) return;

    const currentState = {
      museumName,
      galleries,
      phaseTypes,
      exhibitions,
      locationMilestones
    };
    const serializedState = JSON.stringify(currentState);
    
    // Don't save if state hasn't changed from last sync
    if (lastSyncedStateRef.current === serializedState) return;

    const timeout = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        await updateGistData(currentUser.gistId, currentUser.pat, currentState);
        lastSyncedStateRef.current = serializedState;
        setSyncStatus('synced');
      } catch (err) {
        console.error("Gist save error", err);
        setSyncStatus('error');
      }
    }, 1500); // 1.5s debounce to avoid spamming GitHub API

    return () => clearTimeout(timeout);
  }, [currentUser, museumName, galleries, phaseTypes, exhibitions, locationMilestones, isInitialLoad]);

  return {
    currentUser,
    setCurrentUser,
    syncStatus,
    setSyncStatus,
    isInitialLoad
  };
};

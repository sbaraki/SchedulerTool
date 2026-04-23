import { useState, useEffect } from 'react';
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
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { auth, db, serverTimestamp } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { CONFIG_STORAGE_KEY, MILESTONES_STORAGE_KEY, STORAGE_KEY, DEFAULT_PHASE_TYPES, DEFAULT_GALLERIES } from '../constants';
import { Exhibition, PhaseType } from '../types';

export const useMuseumSync = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { 
    exhibitions, setExhibitions,
    museumName, setMuseumName,
    galleries, setGalleries,
    phaseTypes, setPhaseTypes,
    locationMilestones, setLocationMilestones
  } = useStore();

  // Load Initial State from LocalStorage
  useEffect(() => {
    try {
      const savedEx = localStorage.getItem(STORAGE_KEY);
      if (savedEx) setExhibitions(JSON.parse(savedEx));
      
      const savedMs = localStorage.getItem(MILESTONES_STORAGE_KEY);
      if (savedMs) setLocationMilestones(JSON.parse(savedMs));

      const savedCfg = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedCfg) {
        const parsedCfg = JSON.parse(savedCfg);
        setMuseumName(parsedCfg.museumName || 'NATIONAL HERITAGE TRUST');
        setGalleries(parsedCfg.galleries || DEFAULT_GALLERIES);
        
        const existingPts = (parsedCfg.phaseTypes || []).filter((pt: PhaseType) => pt.label !== 'PRODUCTION / FAB').map((pt: PhaseType) => {
          if (pt.label === 'DEINSTALL' && pt.color === '#ef4444') return { ...pt, color: '#fba84a' };
          if (pt.label === 'IMPLEMENTATION' && pt.color === '#f97316') return { ...pt, color: '#fba84a' };
          return pt;
        });
        const mergedOpts = [...existingPts];
        DEFAULT_PHASE_TYPES.forEach(dpt => {
          if (!mergedOpts.find(pt => pt.label === dpt.label)) mergedOpts.push(dpt);
        });
        setPhaseTypes(mergedOpts);
      }
    } catch (e) {
      console.error("Local load error", e);
    }
  }, []);

  // Save Config to LocalStorage (debounced)
  useEffect(() => {
    if (isInitialLoad && !currentUser) return; // Prevent overwriting on mount
    const timeout = setTimeout(() => {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ museumName, galleries, phaseTypes }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [museumName, galleries, phaseTypes]);

  // Save Milestones to LocalStorage
  useEffect(() => {
    if (isInitialLoad && !currentUser) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(locationMilestones));
    }, 300);
    return () => clearTimeout(timeout);
  }, [locationMilestones]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setSyncStatus('syncing');
      } else {
        setSyncStatus('idle');
      }
    });
    return unsubscribe;
  }, []);

  // Real-time Firebase Sync
  useEffect(() => {
    if (!currentUser) {
      if (!isInitialLoad) setIsInitialLoad(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const exhibitionsColRef = collection(db, 'users', currentUser.uid, 'exhibitions');
    const milestonesColRef = collection(db, 'users', currentUser.uid, 'milestones');

    let profileUnsub: () => void;
    let exhibitsUnsub: () => void;
    let milestonesUnsub: () => void;

    const initData = async () => {
      try {
        const pSnap = await getDoc(userDocRef);
        if (!pSnap.exists()) {
          console.log("No cloud profile found, creating & migrating local data...");
          setSyncStatus('syncing');
          const batch = writeBatch(db);
          batch.set(userDocRef, {
            museumName,
            galleries,
            phaseTypes,
            email: currentUser.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          if (exhibitions.length > 0) {
            exhibitions.forEach(ex => {
              batch.set(doc(db, 'users', currentUser.uid, 'exhibitions', ex.id), {
                ...ex,
                ownerId: currentUser.uid,
                updatedAt: serverTimestamp()
              });
            });
          }
          if (locationMilestones.length > 0) {
            locationMilestones.forEach(m => {
              batch.set(doc(db, 'users', currentUser.uid, 'milestones', m.id), {
                ...m,
                ownerId: currentUser.uid,
                updatedAt: serverTimestamp()
              });
            });
          }
          await batch.commit();
          setSyncStatus('synced');
        }

        profileUnsub = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.museumName) setMuseumName(data.museumName);
            if (data.galleries) setGalleries(data.galleries);
            if (data.phaseTypes) {
              const migratedPt = data.phaseTypes.map((pt: any) => {
                if (pt.label === 'DEINSTALL' && pt.color === '#ef4444') return { ...pt, color: '#fba84a' };
                if (pt.label === 'IMPLEMENTATION' && pt.color === '#f97316') return { ...pt, color: '#fba84a' };
                return pt;
              });
              setPhaseTypes(migratedPt);
            }
          }
        }, err => console.error("Profile sync error", err));

        exhibitsUnsub = onSnapshot(query(exhibitionsColRef), (snapshot) => {
          const freshExs: Exhibition[] = [];
          snapshot.forEach(d => freshExs.push(d.data() as Exhibition));
          setExhibitions(freshExs);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshExs));
          setSyncStatus('synced');
        }, err => {
             console.error("Exhibits sync error", err);
             setSyncStatus('error');
        });

        milestonesUnsub = onSnapshot(query(milestonesColRef), (snapshot) => {
           const freshMs: LocationMilestone[] = [];
           snapshot.forEach(d => freshMs.push(d.data() as LocationMilestone));
           setLocationMilestones(freshMs);
           localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(freshMs));
        }, err => console.error("Milestone sync error", err));

      } catch (err) {
        console.error("Init Error", err);
        setSyncStatus('error');
      } finally {
        setIsInitialLoad(false);
      }
    };

    initData();

    return () => {
      if (profileUnsub) profileUnsub();
      if (exhibitsUnsub) exhibitsUnsub();
      if (milestonesUnsub) milestonesUnsub();
    };
  }, [currentUser]); 
  // Deliberately minimizing dependency array so we don't spam getDoc on every local change

  return {
    currentUser,
    syncStatus,
    setSyncStatus,
    isInitialLoad
  };
};

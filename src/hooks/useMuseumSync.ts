import { useState, useEffect, useRef } from 'react';
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
import { Exhibition, LocationMilestone, PhaseType } from '../types';

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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSyncedProfileRef = useRef<string | null>(null);

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

        const parsedPhaseTypes = (parsedCfg.phaseTypes || []).filter((phaseType: PhaseType) => phaseType.label !== 'PRODUCTION / FAB');
        setPhaseTypes(normalizePhaseTypes(parsedPhaseTypes));
      }
    } catch (e) {
      console.error("Local load error", e);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  // Save projects to LocalStorage
  useEffect(() => {
    if (isInitialLoad) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exhibitions));
    }, 300);
    return () => clearTimeout(timeout);
  }, [exhibitions, isInitialLoad]);

  // Save Config to LocalStorage (debounced)
  useEffect(() => {
    if (isInitialLoad) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ museumName, galleries, phaseTypes }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [museumName, galleries, phaseTypes, isInitialLoad]);

  // Save Milestones to LocalStorage
  useEffect(() => {
    if (isInitialLoad) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(locationMilestones));
    }, 300);
    return () => clearTimeout(timeout);
  }, [locationMilestones, isInitialLoad]);

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
              setPhaseTypes(normalizePhaseTypes(data.phaseTypes));
            }

            lastSyncedProfileRef.current = JSON.stringify({
              museumName: data.museumName || 'NATIONAL HERITAGE TRUST',
              galleries: data.galleries || DEFAULT_GALLERIES,
              phaseTypes: normalizePhaseTypes(data.phaseTypes || [])
            });
          }
        }, err => console.error("Profile sync error", err));

        exhibitsUnsub = onSnapshot(query(exhibitionsColRef), (snapshot) => {
          const freshExs: Exhibition[] = [];
          snapshot.forEach(d => freshExs.push(d.data() as Exhibition));
          setExhibitions(freshExs);
          setSyncStatus('synced');
        }, err => {
             console.error("Exhibits sync error", err);
             setSyncStatus('error');
        });

        milestonesUnsub = onSnapshot(query(milestonesColRef), (snapshot) => {
           const freshMs: LocationMilestone[] = [];
           snapshot.forEach(d => freshMs.push(d.data() as LocationMilestone));
           setLocationMilestones(freshMs);
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

  useEffect(() => {
    if (!currentUser || isInitialLoad) return;

    const nextProfile = {
      museumName,
      galleries,
      phaseTypes
    };
    const serializedProfile = JSON.stringify(nextProfile);
    if (lastSyncedProfileRef.current === serializedProfile) return;

    const timeout = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        await setDoc(doc(db, 'users', currentUser.uid), {
          ...nextProfile,
          email: currentUser.email,
          updatedAt: serverTimestamp()
        }, { merge: true });
        lastSyncedProfileRef.current = serializedProfile;
        setSyncStatus('synced');
      } catch (err) {
        console.error("Profile save error", err);
        setSyncStatus('error');
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [currentUser, galleries, isInitialLoad, museumName, phaseTypes]);

  return {
    currentUser,
    syncStatus,
    setSyncStatus,
    isInitialLoad
  };
};

import { useStore } from '../store/useStore';
import { db, serverTimestamp } from '../lib/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { Exhibition } from '../types';
import { FirebaseUser } from 'firebase/auth';

export const useMuseumActions = (
  currentUser: FirebaseUser | null,
  setSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error') => void
) => {
  const { 
    exhibitions, setExhibitions,
    galleries, setGalleries,
    locationMilestones, setLocationMilestones 
  } = useStore();

  const handleUpdateExhibition = async (updatedEx: Exhibition) => {
    setExhibitions(prev => prev.map(ex => (ex.id === updatedEx.id ? updatedEx : ex)));
    if (currentUser) {
      try {
        setSyncStatus('syncing');
        await setDoc(doc(db, 'users', currentUser.uid, 'exhibitions', updatedEx.id), {
          ...updatedEx,
          ownerId: currentUser.uid,
          updatedAt: serverTimestamp()
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error("Cloud update error:", err);
        setSyncStatus('error');
      }
    }
  };

  const handleRemoveExhibition = async (id: string) => {
    if (!window.confirm('PERMANENTLY DELETE THIS PROJECT?')) return;
    setExhibitions(prev => prev.filter(ex => ex.id !== id));
    if (currentUser) {
      try {
        setSyncStatus('syncing');
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', currentUser.uid, 'exhibitions', id));
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
      }
    }
  };

  const handleUpdateGalleryName = async (oldName: string, newName: string) => {
    if (!newName || newName.trim() === '' || oldName === newName || galleries.includes(newName)) return;
    
    setGalleries(prev => prev.map(g => g === oldName ? newName : g));
    setExhibitions(prev => prev.map(ex => ex.gallery === oldName ? { ...ex, gallery: newName } : ex));
    setLocationMilestones(prev => prev.map(m => m.gallery === oldName ? { ...m, gallery: newName } : m));

    if (currentUser) {
      try {
        setSyncStatus('syncing');
        const batch = writeBatch(db);
        
        batch.update(doc(db, 'users', currentUser.uid), {
          galleries: galleries.map(g => g === oldName ? newName : g),
          updatedAt: serverTimestamp()
        });

        exhibitions.filter(ex => ex.gallery === oldName).forEach(ex => {
          batch.update(doc(db, 'users', currentUser.uid, 'exhibitions', ex.id), {
            gallery: newName,
            updatedAt: serverTimestamp()
          });
        });

        locationMilestones.filter(m => m.gallery === oldName).forEach(m => {
          batch.update(doc(db, 'users', currentUser.uid, 'milestones', m.id), {
            gallery: newName,
            updatedAt: serverTimestamp()
          });
        });

        await batch.commit();
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
      }
    }
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

  return {
    handleUpdateExhibition,
    handleRemoveExhibition,
    handleUpdateGalleryName,
    handleAddGallery,
    handleRemoveGallery,
    handleDuplicateProject
  };
};

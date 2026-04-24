import { useStore } from '../store/useStore';
import { Exhibition } from '../types';

export const useMuseumActions = () => {
  const { 
    exhibitions, setExhibitions,
    galleries, setGalleries,
    locationMilestones, setLocationMilestones 
  } = useStore();

  const createId = () => Math.random().toString(36).slice(2, 11);

  const handleUpdateExhibition = (updatedEx: Exhibition) => {
    setExhibitions(prev => prev.map(ex => (ex.id === updatedEx.id ? updatedEx : ex)));
  };

  const handleRemoveExhibition = (id: string) => {
    if (!window.confirm('PERMANENTLY DELETE THIS PROJECT?')) return;
    setExhibitions(prev => prev.filter(ex => ex.id !== id));
  };

  const handleUpdateGalleryName = (oldName: string, newName: string) => {
    if (!newName || newName.trim() === '' || oldName === newName || galleries.includes(newName)) return;
    
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
    const fallbackGallery = remaining[0];
    setGalleries(remaining);
    setExhibitions(prev => prev.map(ex => ex.gallery === name ? { ...ex, gallery: fallbackGallery } : ex));
    setLocationMilestones(prev => prev.map(m => m.gallery === name ? { ...m, gallery: fallbackGallery } : m));
  };

  const handleDuplicateProject = (id: string) => {
    const source = exhibitions.find(ex => ex.id === id);
    if (!source) return;
    const copy = { 
      ...source, 
      id: createId(), 
      title: `${source.title} (COPY)`, 
      phases: [...source.phases.map(p => ({ ...p, id: createId() }))] 
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

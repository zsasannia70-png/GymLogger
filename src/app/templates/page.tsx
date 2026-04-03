'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Template } from '@/types';
import { getTemplates, deleteTemplate, saveTemplate, addEntriesToWorkout, getWorkoutByDate } from '@/lib/firestore';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { SkeletonList } from '@/components/ui/Skeleton';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null | 'new'>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getTemplates(user.uid);
    setTemplates(data);
    setLoading(false);
  };

  const handleLoad = async (t: Template) => {
    if (!user) return;
    setLoadingId(t.id);
    const todayStr = new Date().toISOString().split('T')[0];
    const newEntries = t.entries.map(e => ({ ...e, notes: '' }));
    await addEntriesToWorkout(user.uid, todayStr, newEntries);
    // show success briefly
    setTimeout(() => {
      setLoadingId(null);
      router.push('/');
    }, 1200);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('Delete template?')) {
      await deleteTemplate(user.uid, id);
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleSaveEditor = async (templateData: any) => {
    if (!user) return;
    await saveTemplate(user.uid, templateData);
    setEditingTemplate(null);
    await loadTemplates();
  };

  const handleSaveCurrentAsTemplate = async () => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const w = await getWorkoutByDate(user.uid, todayStr);
    
    if (w && w.entries.length > 0) {
      const templateEntries = w.entries.map(e => ({
        movementName: e.movementName,
        reps: e.reps,
        weight: e.weight,
        unit: e.unit
      }));
      setEditingTemplate({
        name: `Workout - ${todayStr}`,
        entries: templateEntries,
        createdAt: Date.now(),
        order: templates.length,
      } as any);
    } else {
      alert("No exercises in today's workout to save!");
    }
  };

  if (editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate === 'new' ? null : editingTemplate}
        onSave={handleSaveEditor}
        onCancel={() => setEditingTemplate(null)}
      />
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <button 
          onClick={() => setEditingTemplate('new')}
          className="bg-accent/20 text-accent font-bold px-4 py-2 rounded-xl active:bg-accent/30"
        >
          + New
        </button>
      </div>
      
      {loading ? (
        <div className="mt-8"><SkeletonList /></div>
      ) : templates.length === 0 ? (
        <p className="text-text-tertiary text-center mt-10">You have no templates yet.</p>
      ) : (
        <StaggeredList>
          {templates.map(t => (
            <div key={t.id} className="card-depth p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{t.name}</h3>
                <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-1 rounded-full uppercase tracking-wider">{t.entries.length} Exercises</span>
              </div>
              
              <p className="text-sm text-text-secondary mb-4 truncate">
                {t.entries.slice(0, 3).map(e => `${e.movementName}`).join(', ')}
                {t.entries.length > 3 && '...'}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoad(t)}
                  disabled={loadingId === t.id}
                  className="flex-1 bg-accent text-text-on-accent font-bold py-2.5 rounded-xl active:scale-95 transition-transform"
                >
                  {loadingId === t.id ? 'Loading...' : 'Load'}
                </button>
                <button
                  onClick={() => setEditingTemplate(t)}
                  className="px-4 py-2.5 bg-bg-tertiary text-text-primary font-bold rounded-xl active:scale-95 transition-transform"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="px-4 py-2.5 bg-danger/10 text-danger font-bold rounded-xl active:scale-95 transition-transform"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </StaggeredList>
      )}

      <button
        onClick={handleSaveCurrentAsTemplate}
        className="mt-8 w-full bg-bg-secondary border border-border text-center text-text-primary font-bold py-4 rounded-xl shadow-sm hover:shadow-card-hover active:shadow-card-pressed"
      >
        Save Current Workout as Template
      </button>
    </div>
  );
}

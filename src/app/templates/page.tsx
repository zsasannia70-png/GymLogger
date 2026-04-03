'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Template } from '@/types';
import { useTemplates } from '@/hooks/useTemplates';
import { useTodayWorkout } from '@/hooks/useTodayWorkout';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { SkeletonList } from '@/components/ui/Skeleton';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function TemplatesPage() {
  const { user, seedInitialTemplates } = useAuth();
  const router = useRouter();
  
  const { templates, loading: templatesLoading, addTemplate, removeTemplate, updateOrders, refresh: refreshTemplates } = useTemplates();
  const { workout: todayWorkout, addEntry: addTodayEntry } = useTodayWorkout();
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null | 'new'>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleLoad = async (t: Template) => {
    if (!user) return;
    setLoadingId(t.id);
    
    // Add all entries from template to today's workout
    for (const e of t.entries) {
      await addTodayEntry({
        movementName: e.movementName,
        reps: e.reps,
        weight: e.weight,
        unit: e.unit,
        notes: ''
      });
    }

    // show success briefly
    setTimeout(() => {
      setLoadingId(null);
      router.push('/');
    }, 1200);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('Delete template?')) {
      await removeTemplate(id);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!user) return;
    const newTemplates = [...templates];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= templates.length) return;
    
    // Swap
    [newTemplates[index], newTemplates[newIndex]] = [newTemplates[newIndex], newTemplates[index]];
    
    await updateOrders(newTemplates);
  };

  const handleSaveEditor = async (templateData: Template | Omit<Template, 'id'>) => {
    if (!user) return;
    await addTemplate(templateData);
    setEditingTemplate(null);
  };

  const handleSaveCurrentAsTemplate = async () => {
    if (!user) return;
    
    if (todayWorkout && todayWorkout.entries.length > 0) {
      const templateEntries = todayWorkout.entries.map(e => ({
        movementName: e.movementName,
        reps: e.reps,
        weight: e.weight,
        unit: e.unit
      }));
      
      const todayStr = new Date().toISOString().split('T')[0];
      setEditingTemplate({
        name: `Workout - ${todayStr}`,
        entries: templateEntries,
        createdAt: Date.now(),
        order: templates.length,
      } as Template);
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
      
      {templatesLoading ? (
        <div className="mt-8"><SkeletonList /></div>
      ) : templates.length === 0 ? (
        <div className="text-center mt-12 p-8 card-depth rounded-2xl bg-bg-secondary/50">
          <p className="text-text-tertiary mb-6">You have no templates yet.</p>
          <button 
            onClick={async () => {
              await seedInitialTemplates();
              await refreshTemplates();
            }}
            className="bg-accent text-text-on-accent font-bold px-6 py-3 rounded-xl active:scale-95 transition-transform"
          >
            Seed Majestic Templates
          </button>
        </div>
      ) : (
        <StaggeredList>
          {templates.map((t, index) => (
            <div key={t.id} className="card-depth p-4 mb-4 flex gap-4">
              {/* Sort Handles */}
              <div className="flex flex-col gap-1">
                <button 
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1.5 text-text-tertiary disabled:opacity-20 active:text-accent"
                >
                  <ArrowUp size={18} />
                </button>
                <button 
                  disabled={index === templates.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1.5 text-text-tertiary disabled:opacity-20 active:text-accent"
                >
                  <ArrowDown size={18} />
                </button>
              </div>

              <div className="flex-1">
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

'use client';

import React, { useState } from 'react';
import { TemplateEntry, Template } from '@/types';
import { Trash2, Copy } from 'lucide-react';
import { useMovements } from '@/hooks/useMovements';

interface TemplateEditorProps {
  template: Template | null;
  onSave: (template: Template | Omit<Template, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const { movements, loading: loadingMovements } = useMovements();
  const [name, setName] = useState(template?.name || '');
  const [entries, setEntries] = useState<TemplateEntry[]>(template?.entries || []);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const suggestions = React.useMemo(() => {
    if (!search) return [];
    const lowerQ = search.toLowerCase();
    return movements
      .filter(m => m.name.toLowerCase().includes(lowerQ))
      .slice(0, 8);
  }, [search, movements]);

  const handleAddMovement = (movementName: string) => {
    setEntries(prev => [...prev, { movementName, reps: 0, weight: 0, unit: 'kg' }]);
    setSearch('');
  };

  const handleUpdateEntry = (index: number, updates: Partial<TemplateEntry>) => {
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateEntry = (index: number) => {
    setEntries(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...copy[index] });
      return copy;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    await onSave({
      ...(template ? { id: template.id } : {}),
      name,
      entries,
      createdAt: template?.createdAt || Date.now(),
      order: template?.order || 0
    });
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary absolute inset-0 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-glass-bg backdrop-blur-md border-b border-border px-4 py-4 flex justify-between items-center z-10">
        <button onClick={onCancel} className="text-text-secondary active:text-text-primary">Cancel</button>
        <h2 className="font-bold text-lg">{template ? 'Edit Template' : 'New Template'}</h2>
        <button 
          onClick={handleSave} 
          disabled={!name.trim() || isSaving}
          className="text-accent font-bold active:text-accent-active disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Name Input */}
        <div>
          <label className="text-xs font-bold text-text-tertiary uppercase mb-1 block">Template Name</label>
          <input
            type="text"
            className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-lg outline-none focus:border-accent"
            placeholder="e.g. Pull Day"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Entries List */}
        <div>
          <label className="text-xs font-bold text-text-tertiary uppercase mb-2 block">Exercises</label>
          <div className="space-y-3">
            {entries.length === 0 ? (
              <p className="text-text-tertiary text-sm italic">No exercises added yet.</p>
            ) : (
              entries.map((entry, idx) => (
                <div key={idx} className="card-depth p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-2">{entry.movementName}</h3>
                    <div className="flex gap-2">
                      <div className="flex items-center bg-bg-tertiary rounded px-2">
                        <input 
                          type="number" 
                          className="w-12 bg-transparent text-center py-1 outline-none" 
                          placeholder="Wt"
                          value={entry.weight || ''}
                          onChange={e => handleUpdateEntry(idx, { weight: Number(e.target.value) })}
                        />
                        <span className="text-xs text-text-tertiary">kg</span>
                      </div>
                      <span className="text-text-tertiary self-center">×</span>
                      <div className="flex items-center bg-bg-tertiary rounded px-2">
                        <input 
                          type="number" 
                          className="w-12 bg-transparent text-center py-1 outline-none" 
                          placeholder="Reps"
                          value={entry.reps || ''}
                          onChange={e => handleUpdateEntry(idx, { reps: Number(e.target.value) })}
                        />
                        <span className="text-xs text-text-tertiary">reps</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 border-l border-border pl-2">
                    <button onClick={() => handleDuplicateEntry(idx)} className="p-1.5 text-text-tertiary active:bg-bg-tertiary rounded">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDeleteEntry(idx)} className="p-1.5 text-danger active:bg-bg-tertiary rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Movement Search */}
        <div className="relative z-0">
          <label className="text-xs font-bold text-text-tertiary uppercase mb-1 block">Add Exercise</label>
          <input
            type="text"
            className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-accent"
            placeholder="Search movements..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className="absolute bottom-full mb-1 left-0 w-full bg-bg-secondary border border-border mt-1 rounded-xl shadow-card-lg overflow-hidden">
              {suggestions.map(m => (
                <li 
                  key={m.id}
                  className="px-4 py-3 border-b border-border last:border-0 active:bg-accent-light active:text-text-primary"
                  onClick={() => handleAddMovement(m.name)}
                >
                  {m.name}
                  <span className="text-xs text-text-tertiary ml-2">({m.category})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

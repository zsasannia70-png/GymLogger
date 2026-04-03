'use client';

import React, { useState } from 'react';
import { WorkoutEntry } from '@/types';
import { Trash2, Copy, Edit2, Check } from 'lucide-react';
import { StaggeredList } from '@/components/ui/StaggeredList';

interface WorkoutListProps {
  entries: WorkoutEntry[];
  onDeleteEntry: (entryId: string) => void;
  onDeleteMovement: (movementName: string) => void;
  onDuplicateEntry: (entry: WorkoutEntry) => void;
  onUpdateEntry: (entryId: string, updates: Partial<WorkoutEntry>) => void;
  // If true, enables inline editing and duplicate controls. If false, it's just a readonly view (for history collapsed, etc)
  interactive?: boolean; 
}

export function WorkoutList({ 
  entries, onDeleteEntry, onDeleteMovement, onDuplicateEntry, onUpdateEntry, interactive = true 
}: WorkoutListProps) {
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReps, setEditReps] = useState<number | ''>('');
  const [editWeight, setEditWeight] = useState<number | ''>('');

  // Group by movement name
  const groups: Record<string, WorkoutEntry[]> = {};
  entries.forEach(e => {
    if (!groups[e.movementName]) groups[e.movementName] = [];
    groups[e.movementName].push(e);
  });

  const handleStartEdit = (entry: WorkoutEntry) => {
    if (!interactive) return;
    setEditingId(entry.id);
    setEditReps(entry.reps);
    setEditWeight(entry.weight);
  };

  const handleSaveEdit = (entry: WorkoutEntry) => {
    onUpdateEntry(entry.id, {
      reps: Number(editReps),
      weight: Number(editWeight)
    });
    setEditingId(null);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-text-tertiary">
        <p>No sets logged yet.</p>
        <p className="text-sm mt-1">Start your workout above!</p>
      </div>
    );
  }

  return (
    <StaggeredList>
      {Object.entries(groups).map(([movementName, sets]) => (
        <div key={movementName} className="card-depth overflow-hidden">
          {/* Header */}
          <div className="bg-bg-tertiary px-4 py-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-text-primary">{movementName}</h3>
              <p className="text-xs text-text-secondary">{sets.length} {sets.length === 1 ? 'set' : 'sets'}</p>
            </div>
            {interactive && (
              <button 
                onClick={() => onDeleteMovement(movementName)}
                className="text-text-tertiary hover:text-danger active:text-danger p-2"
                aria-label="Delete all sets for movement"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          
          {/* Sets list */}
          <div className="divide-y divide-border-color">
            {sets.map((set, i) => {
              const isEditing = editingId === set.id;
              
              return (
                <div key={set.id} className="px-4 py-3 flex items-center justify-between">
                  {/* Left: Set number */}
                  <div className="w-8 flex-shrink-0">
                    <span className="w-6 h-6 rounded bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-secondary">
                      {i + 1}
                    </span>
                  </div>

                  {/* Center: Values */}
                  <div className="flex-1 flex justify-center items-center font-mono text-lg space-x-2">
                    {isEditing ? (
                      <>
                        <input 
                          type="number" 
                          className="w-16 bg-bg-primary border border-accent rounded p-1 text-center" 
                          value={editWeight} 
                          onChange={e => setEditWeight(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                        <span className="text-text-tertiary">kg</span>
                        <span className="text-text-tertiary px-2">×</span>
                        <input 
                          type="number" 
                          className="w-14 bg-bg-primary border border-accent rounded p-1 text-center" 
                          value={editReps} 
                          onChange={e => setEditReps(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </>
                    ) : (
                      <span onClick={() => handleStartEdit(set)} className={interactive ? 'cursor-pointer active:opacity-50' : ''}>
                        <span className="font-bold">{set.weight}</span>
                        <span className="text-text-tertiary text-sm ml-1">kg</span>
                        <span className="text-text-tertiary mx-3">×</span>
                        <span className="font-bold">{set.reps}</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Actions */}
                  {interactive && (
                    <div className="flex space-x-1 flex-shrink-0">
                      {isEditing ? (
                        <button 
                          onClick={() => handleSaveEdit(set)}
                          className="text-success p-2 active:bg-bg-tertiary rounded-full"
                        >
                          <Check size={18} />
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleStartEdit(set)}
                            className="text-text-tertiary hover:text-accent p-2 active:bg-bg-tertiary rounded-full"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onDuplicateEntry(set)}
                            className="text-text-tertiary hover:text-accent p-2 active:bg-bg-tertiary rounded-full"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteEntry(set.id)}
                            className="text-text-tertiary hover:text-danger p-2 active:bg-bg-tertiary rounded-full"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </StaggeredList>
  );
}

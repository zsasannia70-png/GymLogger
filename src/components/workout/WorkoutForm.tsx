'use client';

import React, { useState, useRef } from 'react';
import { WorkoutEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useMovements } from '@/hooks/useMovements';

interface WorkoutFormProps {
  onLogSet: (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => Promise<void>;
  lastEntry?: WorkoutEntry | null; // The very last entry added in this session globally
  sessionEntries?: WorkoutEntry[]; // To find the last set of the same movement
}

export function WorkoutForm({ onLogSet, lastEntry, sessionEntries }: WorkoutFormProps) {
  const { user } = useAuth();
  const { movements, loading: loadingMovements } = useMovements();
  
  const [movementName, setMovementName] = useState('');
  const [reps, setReps] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  
  const [showNotes, setShowNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus ref for auto focus
  const movementInputRef = useRef<HTMLInputElement>(null);

  // Handle autocomplete filtering - derived state to avoid synchronous setState in effect
  const suggestions = React.useMemo(() => {
    if (!movementName) return [];
    const lowerQ = movementName.toLowerCase();
    return movements
      .filter(m => m.name.toLowerCase().includes(lowerQ))
      .slice(0, 8);
  }, [movementName, movements]);

  // Smart defaults: prefill based on selected movement name
  const handleSelectMovement = (name: string) => {
    setMovementName(name);
    
    // Find last set of this movement in the current session
    if (sessionEntries) {
      const lastSame = [...sessionEntries].reverse().find(e => e.movementName === name);
      if (lastSame) {
        setReps(lastSame.reps);
        setWeight(lastSame.weight);
      }
    }
  };

  const handleLogSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementName || reps === '' || weight === '') return;
    
    setIsSubmitting(true);
    await onLogSet({
      movementName,
      reps: Number(reps),
      weight: Number(weight),
      unit: 'kg', // Fallback, would normally pull from settings
      notes
    });
    
    // reset form but keep movementName (or clear it? "re-focus the movement input for fast logging")
    setMovementName('');
    setReps('');
    setWeight('');
    setNotes('');
    setShowNotes(false);
    setIsSubmitting(false);
    
    movementInputRef.current?.focus();
  };

  const handleRepeatLast = async () => {
    if (!lastEntry || isSubmitting) return;
    setIsSubmitting(true);
    await onLogSet({
      movementName: lastEntry.movementName,
      reps: lastEntry.reps,
      weight: lastEntry.weight,
      unit: lastEntry.unit,
      notes: ''
    });
    setIsSubmitting(false);
  };

  return (
    <div className="card-depth p-4 mb-6">
      <form onSubmit={handleLogSet} className="space-y-4">
        
        <div className="relative z-10">
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Movement</label>
          <input
            ref={movementInputRef}
            type="text"
            className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3.5 text-lg outline-none focus:border-accent"
            placeholder="e.g. Bench Press"
            value={movementName}
            onChange={e => setMovementName(e.target.value)}
            required
            autoComplete="off"
          />
          
          {suggestions.length > 0 && movementName !== suggestions[0]?.name && (
            <ul className="absolute top-full left-0 w-full bg-bg-secondary border border-border mt-1 rounded-xl shadow-card-lg overflow-hidden">
              {suggestions.map(m => (
                <li 
                  key={m.id}
                  className="px-4 py-3 border-b border-border last:border-0 active:bg-accent-light active:text-text-primary"
                  onClick={() => handleSelectMovement(m.name)}
                >
                  {m.name}
                  <span className="text-xs text-text-tertiary ml-2">({m.category})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Weight</label>
            <input
              type="number"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3.5 text-lg outline-none focus:border-accent"
              placeholder="0"
              value={weight}
              onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Reps</label>
            <input
              type="number"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3.5 text-lg outline-none focus:border-accent"
              placeholder="0"
              value={reps}
              onChange={e => setReps(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
        </div>

        {showNotes ? (
          <div>
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Notes</label>
            <input
              type="text"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-accent"
              placeholder="Felt easy..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        ) : (
          <button 
            type="button" 
            className="text-sm text-text-tertiary active:text-accent"
            onClick={() => setShowNotes(true)}
          >
            + Add Notes
          </button>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !movementName || reps === '' || weight === ''}
            className="w-full bg-accent text-text-on-accent font-bold py-3.5 rounded-xl shadow-btn hover:shadow-btn-hover active:shadow-btn-pressed disabled:opacity-50 disabled:shadow-none"
          >
            {isSubmitting ? 'Logging...' : 'Log Set'}
          </button>

          {lastEntry && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRepeatLast}
              className="w-full bg-bg-tertiary text-text-secondary font-bold py-3.5 rounded-xl active:bg-border-color"
            >
              Repeat: {lastEntry.movementName} ({lastEntry.reps} × {lastEntry.weight})
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutEntry } from '@/types';
import { useTodayWorkout } from '@/hooks/useTodayWorkout';
import { WorkoutForm } from '@/components/workout/WorkoutForm';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { SkeletonList } from '@/components/ui/Skeleton';

export default function HomePage() {
  const { user } = useAuth();
  const { 
    workout, 
    loading, 
    addEntry, 
    updateEntry, 
    removeEntry, 
    removeMovementFromWorkout, 
    finalizeWorkout,
    refresh
  } = useTodayWorkout();
  
  const [showUndo, setShowUndo] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<{ movementName: string, entries: WorkoutEntry[] } | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const handleLogSet = async (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addEntry(entry);
  };

  const handleDuplicateSet = async (entry: WorkoutEntry) => {
    if (!user) return;
    await addEntry({
      movementName: entry.movementName,
      reps: entry.reps,
      weight: entry.weight,
      unit: entry.unit,
      notes: ''
    });
  };

  const handleUpdateSet = async (entryId: string, updates: Partial<WorkoutEntry>) => {
    if (!user || !workout) return;
    await updateEntry(workout.id, entryId, updates);
  };

  const handleDeleteSet = async (entryId: string) => {
    if (!user || !workout) return;
    await removeEntry(workout.id, entryId);
  };

  const handleDeleteMovement = async (movementName: string) => {
    if (!user || !workout) return;
    
    const targeted = workout.entries.filter(e => e.movementName === movementName);
    
    // Save state for undo
    setPendingDeletions({ movementName, entries: targeted });
    setShowUndo(true);
    
    await removeMovementFromWorkout(workout.id, movementName);
    
    // Hide toast after 5s
    setTimeout(() => {
      setShowUndo(false);
      setPendingDeletions(null);
    }, 5000);
  };

  const handleUndoDelete = async () => {
    if (!user || !pendingDeletions) return;
    setShowUndo(false);
    
    for (const e of pendingDeletions.entries) {
      await addEntry({
        movementName: e.movementName,
        reps: e.reps,
        weight: e.weight,
        unit: e.unit,
        notes: e.notes || ''
      });
    }
    setPendingDeletions(null);
  };

  const handleFinish = async () => {
    if (!confirmFinish) {
      setConfirmFinish(true);
      setTimeout(() => setConfirmFinish(false), 3000);
      return;
    }
    if (user && workout) {
      await finalizeWorkout(workout.id);
      setConfirmFinish(false);
    }
  };

  if (loading) return <div className="mt-8"><SkeletonList /></div>;

  const entries = workout?.entries || [];
  const volume = entries.reduce((acc, e) => acc + (e.reps * e.weight), 0);

  return (
    <div className="animate-fade-in relative pb-10">
      <div className="flex justify-between items-end mb-4">
        <h1 className="text-2xl font-bold">Today&apos;s Workout</h1>
        <span className="text-sm text-text-tertiary">{entries.length} sets • {volume}kg total</span>
      </div>

      <WorkoutForm 
        onLogSet={handleLogSet} 
        lastEntry={entries.length > 0 ? entries[entries.length - 1] : null}
        sessionEntries={entries}
      />

      <div className="mt-8">
        <WorkoutList 
          entries={entries}
          onDeleteEntry={handleDeleteSet}
          onDeleteMovement={handleDeleteMovement}
          onDuplicateEntry={handleDuplicateSet}
          onUpdateEntry={handleUpdateSet}
          interactive={true}
        />
      </div>

      {entries.length > 0 && (
        <div className="mt-8 mb-4">
          <button
            onClick={handleFinish}
            className={`w-full py-4 rounded-xl font-bold shadow-btn transition-colors ${
              confirmFinish ? 'bg-success text-white' : 'bg-bg-tertiary text-text-primary active:bg-border-color shadow-none'
            }`}
          >
            {confirmFinish ? 'Tap again to confirm finish' : 'Finish Workout'}
          </button>
        </div>
      )}

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up flex justify-between items-center bg-bg-secondary border border-border px-4 py-3 rounded-xl shadow-card-lg max-w-lg mx-auto">
          <span className="text-sm font-medium">Deleted {pendingDeletions?.movementName}</span>
          <button onClick={handleUndoDelete} className="text-accent font-bold text-sm uppercase px-2 py-1 active:bg-accent-light rounded">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

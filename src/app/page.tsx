'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Workout, WorkoutEntry } from '@/types';
import { getWorkoutByDate, addEntryToWorkout, updateWorkoutEntry, deleteWorkoutEntry, deleteMovementFromWorkout, finishWorkout } from '@/lib/firestore';
import { WorkoutForm } from '@/components/workout/WorkoutForm';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Check } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUndo, setShowUndo] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<{ movementName: string, entries: WorkoutEntry[] } | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadTodayWorkout();
    }
  }, [user]);

  const loadTodayWorkout = async () => {
    if (!user) return;
    setLoading(true);
    const w = await getWorkoutByDate(user.uid, todayStr);
    setWorkout(w);
    setLoading(false);
  };

  const handleLogSet = async (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    // Optimistic UI could be here, but simpler to just re-fetch or push to state
    const newW = await addEntryToWorkout(user.uid, todayStr, entry);
    setWorkout(newW);
  };

  const handleDuplicateSet = async (entry: WorkoutEntry) => {
    if (!user) return;
    const newEntry = {
      movementName: entry.movementName,
      reps: entry.reps,
      weight: entry.weight,
      unit: entry.unit,
      notes: ''
    };
    const newW = await addEntryToWorkout(user.uid, todayStr, newEntry);
    setWorkout(newW);
  };

  const handleUpdateSet = async (entryId: string, updates: Partial<WorkoutEntry>) => {
    if (!user || !workout) return;
    // Optimistic
    const copy = { ...workout, entries: workout.entries.map(e => e.id === entryId ? { ...e, ...updates } : e) };
    setWorkout(copy);
    await updateWorkoutEntry(user.uid, workout.id, entryId, updates);
  };

  const handleDeleteSet = async (entryId: string) => {
    if (!user || !workout) return;
    const copy = { ...workout, entries: workout.entries.filter(e => e.id !== entryId) };
    setWorkout(copy);
    await deleteWorkoutEntry(user.uid, workout.id, entryId);
  };

  const handleDeleteMovement = async (movementName: string) => {
    if (!user || !workout) return;
    
    const targeted = workout.entries.filter(e => e.movementName === movementName);
    const remaining = workout.entries.filter(e => e.movementName !== movementName);
    
    // Save state for undo
    setPendingDeletions({ movementName, entries: targeted });
    setShowUndo(true);
    
    // Optimistic remove
    setWorkout({ ...workout, entries: remaining });
    await deleteMovementFromWorkout(user.uid, workout.id, movementName);
    
    // Hide toast after 5s
    setTimeout(() => {
      setShowUndo(false);
      setPendingDeletions(null);
    }, 5000);
  };

  const handleUndoDelete = async () => {
    if (!user || !pendingDeletions) return;
    setShowUndo(false);
    
    // Re-add to firestore
    for (const e of pendingDeletions.entries) {
      await addEntryToWorkout(user.uid, todayStr, {
        movementName: e.movementName,
        reps: e.reps,
        weight: e.weight,
        unit: e.unit,
        notes: e.notes || ''
      });
    }
    await loadTodayWorkout();
    setPendingDeletions(null);
  };

  const handleFinish = async () => {
    if (!confirmFinish) {
      setConfirmFinish(true);
      setTimeout(() => setConfirmFinish(false), 3000);
      return;
    }
    if (user && workout) {
      await finishWorkout(user.uid, workout.id);
      // Optional: show a big success checkmark overlay
      setConfirmFinish(false);
    }
  };

  if (loading) return <div className="mt-8"><SkeletonList /></div>;

  const entries = workout?.entries || [];
  const volume = entries.reduce((acc, e) => acc + (e.reps * e.weight), 0);

  return (
    <div className="animate-fade-in relative pb-10">
      <div className="flex justify-between items-end mb-4">
        <h1 className="text-2xl font-bold">Today's Workout</h1>
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

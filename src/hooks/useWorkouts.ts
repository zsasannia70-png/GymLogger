'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Workout, WorkoutEntry } from '@/types';
import { getWorkouts, deleteWorkout as apiDeleteWorkout, updateWorkoutEntry as apiUpdateEntry, deleteWorkoutEntry as apiDeleteEntry, deleteMovementFromWorkout as apiDeleteMovementFromWorkout } from '@/lib/firestore';
import { MockFirestore } from '@/lib/mockFirestore';

export function useWorkouts() {
  const { user, isDemoMode } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let data: Workout[];
      if (isDemoMode) {
        data = await MockFirestore.getWorkouts(user.uid);
      } else {
        data = await getWorkouts(user.uid);
      }
      setWorkouts(data);
    } catch (err: any) {
      console.error('Error loading workouts:', err);
      setError(err.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const removeWorkout = async (id: string) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.deleteWorkout(user.uid, id);
      } else {
        await apiDeleteWorkout(user.uid, id);
      }
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      console.error('Error deleting workout:', err);
      throw err;
    }
  };

  const updateEntry = async (workoutId: string, entryId: string, updates: Partial<WorkoutEntry>) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.updateWorkoutEntry(user.uid, workoutId, entryId, updates);
      } else {
        await apiUpdateEntry(user.uid, workoutId, entryId, updates);
      }
      await loadData();
    } catch (err: any) {
      console.error('Error updating entry:', err);
      throw err;
    }
  };

  const removeEntry = async (workoutId: string, entryId: string) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.deleteWorkoutEntry(user.uid, workoutId, entryId);
      } else {
        await apiDeleteEntry(user.uid, workoutId, entryId);
      }
      await loadData();
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      throw err;
    }
  };

  const removeMovementFromWorkout = async (workoutId: string, movementName: string) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.deleteMovementFromWorkout(user.uid, workoutId, movementName);
      } else {
        await apiDeleteMovementFromWorkout(user.uid, workoutId, movementName);
      }
      await loadData();
    } catch (err: any) {
      console.error('Error deleting movement from workout:', err);
      throw err;
    }
  };

  return {
    workouts,
    loading,
    error,
    removeWorkout,
    updateEntry,
    removeEntry,
    removeMovementFromWorkout,
    refresh: loadData
  };
}

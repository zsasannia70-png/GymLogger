'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Workout, WorkoutEntry } from '@/types';
import { getWorkoutByDate, addEntriesToWorkout as apiAddEntries, updateWorkoutEntry as apiUpdateEntry, deleteWorkoutEntry as apiDeleteEntry, deleteMovementFromWorkout as apiDeleteMovementFromWorkout, finishWorkout as apiFinishWorkout } from '@/lib/firestore';
import { MockFirestore } from '@/lib/mockFirestore';

export function useTodayWorkout() {
  const { user, isDemoMode } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadTodayWorkout = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let w: Workout | null;
      if (isDemoMode) {
        w = await MockFirestore.getWorkoutByDate(user.uid, todayStr);
      } else {
        w = await getWorkoutByDate(user.uid, todayStr);
      }
      setWorkout(w);
    } catch (err: any) {
      console.error('Error loading today workout:', err);
      setError(err.message || 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode, todayStr]);

  useEffect(() => {
    loadTodayWorkout();
  }, [loadTodayWorkout]);

  const addEntry = async (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      let newW: Workout;
      if (isDemoMode) {
        newW = await MockFirestore.addEntriesToWorkout(user.uid, todayStr, [entry]);
      } else {
        newW = await apiAddEntries(user.uid, todayStr, [entry]);
      }
      setWorkout(newW);
      return newW;
    } catch (err: any) {
      console.error('Error adding entry:', err);
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
      // Update local state
      setWorkout(prev => {
        if (!prev) return null;
        return {
          ...prev,
          entries: prev.entries.map(e => e.id === entryId ? { ...e, ...updates } : e)
        };
      });
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
      // Update local state
      setWorkout(prev => {
        if (!prev) return null;
        const newEntries = prev.entries.filter(e => e.id !== entryId);
        if (newEntries.length === 0) return null; // Or keep as empty workout depending on desired UI
        return { ...prev, entries: newEntries };
      });
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
      setWorkout(prev => {
        if (!prev) return null;
        const remaining = prev.entries.filter(e => e.movementName !== movementName);
        if (remaining.length === 0) return null;
        return { ...prev, entries: remaining };
      });
    } catch (err: any) {
      console.error('Error deleting movement from workout:', err);
      throw err;
    }
  };

  const finalizeWorkout = async (workoutId: string) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.finishWorkout(user.uid, workoutId);
      } else {
        await apiFinishWorkout(user.uid, workoutId);
      }
      setWorkout(prev => prev ? { ...prev, completed: true } : null);
    } catch (err: any) {
      console.error('Error finishing workout:', err);
      throw err;
    }
  };

  return {
    workout,
    loading,
    error,
    addEntry,
    updateEntry,
    removeEntry,
    removeMovementFromWorkout,
    finalizeWorkout,
    refresh: loadTodayWorkout
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Movement } from '@/types';
import { getMovements, setMovements as apiSetMovements, deleteMovement as apiDeleteMovement } from '@/lib/firestore';
import { MockFirestore } from '@/lib/mockFirestore';

export function useMovements() {
  const { user, isDemoMode } = useAuth();
  const [movements, setMvmts] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let data: Movement[];
      if (isDemoMode) {
        data = await MockFirestore.getMovements(user.uid);
      } else {
        data = await getMovements(user.uid);
      }
      // Sort alphabetically
      data.sort((a, b) => a.name.localeCompare(b.name));
      setMvmts(data);
    } catch (err: any) {
      console.error('Error loading movements:', err);
      setError(err.message || 'Failed to load movements');
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addMovements = async (newMovements: Omit<Movement, 'id'>[]) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.setMovements(user.uid, newMovements);
      } else {
        await apiSetMovements(user.uid, newMovements);
      }
      await loadData();
    } catch (err: any) {
      console.error('Error adding movements:', err);
      throw err;
    }
  };

  const removeMovement = async (id: string) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.deleteMovement(user.uid, id);
      } else {
        await apiDeleteMovement(user.uid, id);
      }
      setMvmts(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      console.error('Error deleting movement:', err);
      throw err;
    }
  };

  return {
    movements,
    loading,
    error,
    addMovements,
    removeMovement,
    refresh: loadData
  };
}

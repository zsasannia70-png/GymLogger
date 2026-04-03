'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Template } from '@/types';
import { getTemplates, saveTemplate as apiSaveTemplate, deleteTemplate as apiDeleteTemplate, updateTemplateOrders as apiUpdateTemplateOrders } from '@/lib/firestore';
import { MockFirestore } from '@/lib/mockFirestore';

export function useTemplates() {
  const { user, isDemoMode } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let data: Template[];
      if (isDemoMode) {
        data = await MockFirestore.getTemplates(user.uid);
      } else {
        data = await getTemplates(user.uid);
      }
      setTemplates(data);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addTemplate = async (template: Omit<Template, 'id'> | Template) => {
    if (!user) return;
    try {
      let result: Template;
      if (isDemoMode) {
        result = await MockFirestore.saveTemplate(user.uid, template);
      } else {
        result = await apiSaveTemplate(user.uid, template);
      }
      await loadData();
      return result;
    } catch (err: any) {
      console.error('Error saving template:', err);
      throw err;
    }
  };

  const removeTemplate = async (id: string) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.deleteTemplate(user.uid, id);
      } else {
        await apiDeleteTemplate(user.uid, id);
      }
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const updateOrders = async (templatesToUpdate: Template[]) => {
    if (!user) return;
    try {
      if (isDemoMode) {
        await MockFirestore.updateTemplateOrders(user.uid, templatesToUpdate);
      } else {
        await apiUpdateTemplateOrders(user.uid, templatesToUpdate);
      }
      setTemplates(templatesToUpdate);
    } catch (err: any) {
      console.error('Error updating template orders:', err);
      throw err;
    }
  };

  return {
    templates,
    loading,
    error,
    addTemplate,
    removeTemplate,
    updateOrders,
    refresh: loadData
  };
}

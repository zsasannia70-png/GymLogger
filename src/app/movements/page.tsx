'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMovements } from '@/hooks/useMovements';
import { Movement, Category } from '@/types';
import { SkeletonList } from '@/components/ui/Skeleton';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { Trash2, Search } from 'lucide-react';

const CATEGORIES: Category[] = ['Legs', 'Back', 'Chest', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

export default function MovementsPage() {
  const { user } = useAuth();
  const { movements, loading, addMovements, removeMovement, refresh } = useMovements();
  
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newMovementName, setNewMovementName] = useState('');
  const [newMovementCategory, setNewMovementCategory] = useState<Category>('Other');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMovementName.trim()) return;
    setIsAdding(true);
    
    // Check duplicate
    if (movements.some(m => m.name.toLowerCase() === newMovementName.trim().toLowerCase())) {
      alert("Movement already exists!");
      setIsAdding(false);
      return;
    }

    const newM: Omit<Movement, 'id'> = {
      name: newMovementName.trim(),
      category: newMovementCategory,
      isCustom: true
    };
    
    await addMovements([newM]);
    
    setNewMovementName('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!user) return;
    if (confirm(`Delete ${name}?`)) {
      await removeMovement(id);
    }
  };

  const filtered = movements.filter(m => {
    const matchesCat = activeCategory === 'All' || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="animate-fade-in pb-10">
      <h1 className="text-2xl font-bold mb-6">Movements Engine</h1>

      {/* Add new movement */}
      <form onSubmit={handleAdd} className="card-depth p-4 mb-6 space-y-3">
        <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Create Custom Exercise</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-bg-primary border border-border rounded-xl px-4 py-2 outline-none focus:border-accent"
            placeholder="Exercise Name"
            value={newMovementName}
            onChange={e => setNewMovementName(e.target.value)}
            required
          />
          <select 
            className="bg-bg-primary border border-border text-sm rounded-xl px-2 outline-none focus:border-accent"
            value={newMovementCategory}
            onChange={e => setNewMovementCategory(e.target.value as Category)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button 
          disabled={isAdding || !newMovementName.trim()}
          className="w-full bg-bg-secondary border border-border text-accent disabled:text-text-tertiary font-bold py-2 rounded-xl shadow-sm active:bg-bg-tertiary"
        >
          {isAdding ? 'Adding...' : 'Add Exercise'}
        </button>
      </form>

      {/* Filters */}
      <div className="mb-4">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            className="w-full bg-bg-secondary border border-border rounded-full pl-10 pr-4 py-2 outline-none focus:border-accent"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex overflow-x-auto skinny-scrollbars pb-2 gap-2">
          {['All', ...CATEGORIES].map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c as Category | 'All')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === c 
                  ? 'bg-accent text-text-on-accent shadow-btn' 
                  : 'bg-bg-secondary border border-border text-text-secondary active:bg-bg-tertiary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-8"><SkeletonList /></div>
      ) : (
        <StaggeredList>
          {filtered.map(m => (
            <div key={m.id} className="card-depth px-4 py-3 mb-2 flex justify-between items-center group">
              <div>
                <p className="font-bold">{m.name}</p>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">
                    {m.category}
                  </span>
                  {m.isCustom && (
                    <span className="text-[10px] uppercase font-bold text-accent bg-accent-light px-2 py-0.5 rounded-full">
                      Custom
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(m.id, m.name)}
                className="text-text-tertiary hover:text-danger active:text-danger p-2"
                aria-label="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-center text-text-tertiary mt-8">No exercises found.</p>
          )}
        </StaggeredList>
      )}
    </div>
  );
}

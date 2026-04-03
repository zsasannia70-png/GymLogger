'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Workout } from '@/types';
import { getWorkouts, deleteWorkout, deleteMovementFromWorkout, deleteWorkoutEntry, updateWorkoutEntry } from '@/lib/firestore';
import { WorkoutList } from '@/components/workout/WorkoutList';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { StaggeredList } from '@/components/ui/StaggeredList';

export default function HistoryPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadWorkouts();
  }, [user]);

  const loadWorkouts = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getWorkouts(user.uid);
    setWorkouts(data);
    setLoading(false);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user) return;
    if (confirm('Delete entire workout?')) {
      await deleteWorkout(user.uid, workoutId);
      setWorkouts(w => w.filter(x => x.id !== workoutId));
    }
  };

  // Provide callbacks for inline editing in history
  const handleDeleteEntry = async (workoutId: string, entryId: string) => {
    if (!user) return;
    await deleteWorkoutEntry(user.uid, workoutId, entryId);
    loadWorkouts(); // Refresh
  };

  const handleDeleteMovement = async (workoutId: string, movementName: string) => {
    if (!user) return;
    if (confirm(`Delete all sets of ${movementName}?`)) {
      await deleteMovementFromWorkout(user.uid, workoutId, movementName);
      loadWorkouts(); // Refresh
    }
  };

  const handleUpdateEntry = async (workoutId: string, entryId: string, updates: any) => {
    if (!user) return;
    await updateWorkoutEntry(user.uid, workoutId, entryId, updates);
    loadWorkouts();
  };

  if (loading) return <div className="mt-8"><SkeletonList /></div>;

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-text-tertiary">
        <Calendar size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">No History Yet</h2>
        <p>Your logged workouts will appear here.</p>
      </div>
    );
  }

  // Very simplistic grouping by month/week placeholder - just listing for MVP
  return (
    <div className="animate-fade-in pb-10">
      <h1 className="text-2xl font-bold mb-6">History</h1>
      
      <StaggeredList>
        {workouts.map(w => {
          const isExpanded = expandedId === w.id;
          const displayDate = new Date(w.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
          const movementsPreview = Array.from(new Set(w.entries.map(e => e.movementName))).join(', ');
          
          return (
            <div key={w.id} className="card-depth overflow-hidden mb-4">
              <div 
                className="p-4 cursor-pointer active:bg-bg-tertiary"
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
              >
                <div className="flex items-center justify-between pointer-events-none">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-accent flex items-center gap-2">
                      {displayDate}
                      {w.completed && <span className="bg-success text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Done</span>}
                    </h3>
                    <p className="text-sm text-text-secondary truncate pr-4 mt-1">{movementsPreview}</p>
                    <p className="text-xs text-text-tertiary mt-2">{w.entries.length} sets</p>
                  </div>
                  <div className="flex items-center text-text-tertiary pointer-events-auto gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteWorkout(w.id); }} 
                      className="text-text-tertiary hover:text-danger active:text-danger p-2 rounded-full"
                    >
                      Delete
                    </button>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 pt-0 border-t border-border animate-slide-up">
                  <div className="mt-4">
                    <WorkoutList 
                      entries={w.entries}
                      onDeleteEntry={(entryId) => handleDeleteEntry(w.id, entryId)}
                      onDeleteMovement={(mName) => handleDeleteMovement(w.id, mName)}
                      onDuplicateEntry={() => alert('Duplicating straight from history not actively supported.')}
                      onUpdateEntry={(entryId, updates) => handleUpdateEntry(w.id, entryId, updates)}
                      interactive={true}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </StaggeredList>
    </div>
  );
}

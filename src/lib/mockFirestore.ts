import { Workout, WorkoutEntry, Movement, Template, UserSettings } from '@/types';

const STORAGE_KEYS = {
  WORKOUTS: 'gym_logger_workouts',
  MOVEMENTS: 'gym_logger_movements',
  TEMPLATES: 'gym_logger_templates',
  SETTINGS: 'gym_logger_settings'
};

function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}

function setLocal<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const MockFirestore = {
  // Workouts
  async getWorkouts(_userId: string): Promise<Workout[]> {
    return getLocal<Workout[]>(STORAGE_KEYS.WORKOUTS, []).sort((a, b) => b.createdAt - a.createdAt);
  },

  async getWorkoutByDate(_userId: string, dateStr: string): Promise<Workout | null> {
    const workouts = await this.getWorkouts(_userId);
    return workouts.find(w => w.date === dateStr) || null;
  },

  async addEntriesToWorkout(
    userId: string,
    dateStr: string,
    newEntries: Omit<WorkoutEntry, 'id' | 'createdAt'>[]
  ): Promise<Workout> {
    let workouts = await this.getWorkouts(userId);
    let workout = workouts.find(w => w.date === dateStr);
    
    const entriesWithMeta: WorkoutEntry[] = newEntries.map(e => ({
      ...e,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    }));

    if (!workout) {
      workout = {
        id: crypto.randomUUID(),
        date: dateStr,
        entries: entriesWithMeta,
        createdAt: Date.now(),
        completed: false,
      };
      workouts.push(workout);
    } else {
      workout.entries = [...workout.entries, ...entriesWithMeta];
      workouts = workouts.map(w => w.id === workout!.id ? workout! : w);
    }
    
    setLocal(STORAGE_KEYS.WORKOUTS, workouts);
    return workout;
  },

  async updateWorkoutEntry(userId: string, workoutId: string, entryId: string, updates: Partial<WorkoutEntry>): Promise<void> {
    const workouts = await this.getWorkouts(userId);
    const updated = workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          entries: w.entries.map(e => e.id === entryId ? { ...e, ...updates } : e)
        };
      }
      return w;
    });
    setLocal(STORAGE_KEYS.WORKOUTS, updated);
  },

  async deleteWorkoutEntry(userId: string, workoutId: string, entryId: string): Promise<void> {
    const workouts = await this.getWorkouts(userId);
    const updated = workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          entries: w.entries.filter(e => e.id !== entryId)
        };
      }
      return w;
    }).filter(w => w.entries.length > 0);
    setLocal(STORAGE_KEYS.WORKOUTS, updated);
  },

  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    const workouts = await this.getWorkouts(userId);
    setLocal(STORAGE_KEYS.WORKOUTS, workouts.filter(w => w.id !== workoutId));
  },

  async deleteMovementFromWorkout(userId: string, workoutId: string, movementName: string): Promise<void> {
    const workouts = await this.getWorkouts(userId);
    const updated = workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          entries: w.entries.filter(e => e.movementName !== movementName)
        };
      }
      return w;
    }).filter(w => w.entries.length > 0);
    setLocal(STORAGE_KEYS.WORKOUTS, updated);
  },

  async finishWorkout(userId: string, workoutId: string): Promise<void> {
    const workouts = await this.getWorkouts(userId);
    const updated = workouts.map(w => w.id === workoutId ? { ...w, completed: true } : w);
    setLocal(STORAGE_KEYS.WORKOUTS, updated);
  },

  // Movements
  async getMovements(_userId: string): Promise<Movement[]> {
    return getLocal<Movement[]>(STORAGE_KEYS.MOVEMENTS, []);
  },

  async setMovements(userId: string, movements: Omit<Movement, 'id'>[]): Promise<void> {
    const movementsWithIds = movements.map(m => ({ ...m, id: crypto.randomUUID() }));
    setLocal(STORAGE_KEYS.MOVEMENTS, movementsWithIds);
  },

  async deleteMovement(userId: string, movementId: string): Promise<void> {
    const movements = await this.getMovements(userId);
    setLocal(STORAGE_KEYS.MOVEMENTS, movements.filter(m => m.id !== movementId));
  },

  // Templates
  async getTemplates(_userId: string): Promise<Template[]> {
    return getLocal<Template[]>(STORAGE_KEYS.TEMPLATES, []).sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async saveTemplate(userId: string, template: Omit<Template, 'id'> | Template): Promise<Template> {
    const templates = await this.getTemplates(userId);
    let newTemplate: Template;
    
    if ('id' in template && template.id) {
      newTemplate = template as Template;
      const index = templates.findIndex(t => t.id === newTemplate.id);
      if (index > -1) {
        templates[index] = newTemplate;
      } else {
        templates.push(newTemplate);
      }
    } else {
      newTemplate = { ...template, id: crypto.randomUUID() } as Template;
      templates.push(newTemplate);
    }
    
    setLocal(STORAGE_KEYS.TEMPLATES, templates);
    return newTemplate;
  },

  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    const templates = await this.getTemplates(userId);
    setLocal(STORAGE_KEYS.TEMPLATES, templates.filter(t => t.id !== templateId));
  },

  async updateTemplateOrders(userId: string, templates: Template[]): Promise<void> {
    const updated = templates.map((t, idx) => ({ ...t, order: idx }));
    setLocal(STORAGE_KEYS.TEMPLATES, updated);
  },

  // Settings
  async getUserSettings(_userId: string): Promise<UserSettings> {
    return getLocal<UserSettings>(STORAGE_KEYS.SETTINGS, { unit: 'kg', theme: 'system' });
  },

  async saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const current = await this.getUserSettings(userId);
    setLocal(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
  }
};

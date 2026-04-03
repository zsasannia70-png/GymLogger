import { db, IS_MOCK_MODE } from './firebase';
import { MockFirestore } from './mockFirestore';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc,
  deleteDoc, query, orderBy, where
} from 'firebase/firestore';
import { Workout, WorkoutEntry, Movement, Template, UserSettings } from '@/types';

// Workouts
export async function getWorkouts(userId: string): Promise<Workout[]> {
  if (IS_MOCK_MODE) return MockFirestore.getWorkouts(userId);
  const workoutsRef = collection(db, `users/${userId}/workouts`);
  const q = query(workoutsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const workouts: Workout[] = [];
  snapshot.forEach(doc => {
    const data = doc.data() as Workout;
    // ensure entries exists and filter out empty ones
    if (data.entries && data.entries.length > 0) {
      workouts.push({ ...data, id: doc.id });
    }
  });
  return workouts;
}

export async function getWorkoutByDate(userId: string, dateStr: string): Promise<Workout | null> {
  if (IS_MOCK_MODE) return MockFirestore.getWorkoutByDate(userId, dateStr);
  const workoutsRef = collection(db, `users/${userId}/workouts`);
  const q = query(workoutsRef, where('date', '==', dateStr));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const docSnap = snapshot.docs[0];
  const data = docSnap.data() as Workout;
  return { ...data, id: docSnap.id };
}

export async function addEntriesToWorkout(
  userId: string,
  dateStr: string,
  newEntries: Omit<WorkoutEntry, 'id' | 'createdAt'>[]
): Promise<Workout> {
  if (IS_MOCK_MODE) return MockFirestore.addEntriesToWorkout(userId, dateStr, newEntries);
  let workout = await getWorkoutByDate(userId, dateStr);
  
  const entriesWithMeta: WorkoutEntry[] = newEntries.map(e => ({
    ...e,
    id: crypto.randomUUID(),
    createdAt: Date.now()
  }));

  if (!workout) {
    const newDocRef = doc(collection(db, `users/${userId}/workouts`));
    workout = {
      id: newDocRef.id,
      date: dateStr,
      entries: entriesWithMeta,
      createdAt: Date.now(),
      completed: false,
    };
    await setDoc(newDocRef, workout);
  } else {
    workout.entries = [...workout.entries, ...entriesWithMeta];
    await updateDoc(doc(db, `users/${userId}/workouts/${workout.id}`), {
      entries: workout.entries
    });
  }
  
  return workout;
}

export async function addEntryToWorkout(
  userId: string,
  dateStr: string,
  entry: Omit<WorkoutEntry, 'id' | 'createdAt'>
): Promise<Workout> {
  return addEntriesToWorkout(userId, dateStr, [entry]);
}

export async function updateWorkoutEntry(
  userId: string,
  workoutId: string,
  entryId: string,
  updates: Partial<WorkoutEntry>
): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.updateWorkoutEntry(userId, workoutId, entryId, updates);
  const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`);
  const workoutSnap = await getDoc(workoutRef);
  
  if (workoutSnap.exists()) {
    const data = workoutSnap.data() as Workout;
    const updatedEntries = data.entries.map(e => 
      e.id === entryId ? { ...e, ...updates } : e
    );
    await updateDoc(workoutRef, { entries: updatedEntries });
  }
}

export async function deleteWorkoutEntry(
  userId: string,
  workoutId: string,
  entryId: string
): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.deleteWorkoutEntry(userId, workoutId, entryId);
  const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`);
  const workoutSnap = await getDoc(workoutRef);
  
  if (workoutSnap.exists()) {
    const data = workoutSnap.data() as Workout;
    const updatedEntries = data.entries.filter(e => e.id !== entryId);
    
    if (updatedEntries.length === 0) {
      await deleteDoc(workoutRef); // Delete document entirely
    } else {
      await updateDoc(workoutRef, { entries: updatedEntries });
    }
  }
}

export async function deleteWorkout(userId: string, workoutId: string): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.deleteWorkout(userId, workoutId);
  await deleteDoc(doc(db, `users/${userId}/workouts/${workoutId}`));
}

export async function deleteMovementFromWorkout(
  userId: string,
  workoutId: string,
  movementName: string
): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.deleteMovementFromWorkout(userId, workoutId, movementName);
  const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`);
  const workoutSnap = await getDoc(workoutRef);
  
  if (workoutSnap.exists()) {
    const data = workoutSnap.data() as Workout;
    const updatedEntries = data.entries.filter(e => e.movementName !== movementName);
    
    if (updatedEntries.length === 0) {
      await deleteDoc(workoutRef);
    } else {
      await updateDoc(workoutRef, { entries: updatedEntries });
    }
  }
}

export async function finishWorkout(userId: string, workoutId: string): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.finishWorkout(userId, workoutId);
  const workoutRef = doc(db, `users/${userId}/workouts/${workoutId}`);
  await updateDoc(workoutRef, { completed: true });
}

// Movements
export async function getMovements(userId: string): Promise<Movement[]> {
  if (IS_MOCK_MODE) return MockFirestore.getMovements(userId);
  const snapshot = await getDocs(collection(db, `users/${userId}/movements`));
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Movement));
}

export async function setMovements(userId: string, movements: Omit<Movement, 'id'>[]): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.setMovements(userId, movements);
  const batch = movements.map(async m => {
    const newRef = doc(collection(db, `users/${userId}/movements`));
    await setDoc(newRef, { ...m, id: newRef.id });
  });
  await Promise.all(batch);
}

export async function deleteMovement(userId: string, movementId: string): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.deleteMovement(userId, movementId);
  await deleteDoc(doc(db, `users/${userId}/movements/${movementId}`));
}

// Templates
export async function getTemplates(userId: string): Promise<Template[]> {
  if (IS_MOCK_MODE) return MockFirestore.getTemplates(userId);
  const q = query(collection(db, `users/${userId}/templates`), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Template));
}

export async function saveTemplate(userId: string, template: Omit<Template, 'id'> | Template): Promise<Template> {
  if (IS_MOCK_MODE) return MockFirestore.saveTemplate(userId, template);
  if ('id' in template && template.id) {
    const ref = doc(db, `users/${userId}/templates/${template.id}`);
    await setDoc(ref, template);
    return template;
  } else {
    const ref = doc(collection(db, `users/${userId}/templates`));
    const newTemplate = { ...template, id: ref.id };
    await setDoc(ref, newTemplate);
    return newTemplate;
  }
}

export async function deleteTemplate(userId: string, templateId: string): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.deleteTemplate(userId, templateId);
  await deleteDoc(doc(db, `users/${userId}/templates/${templateId}`));
}

export async function updateTemplateOrders(userId: string, templates: Template[]): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.updateTemplateOrders(userId, templates);
  const batch = templates.map((t, idx) => {
    return updateDoc(doc(db, `users/${userId}/templates/${t.id}`), { order: idx });
  });
  await Promise.all(batch);
}

// Settings
export async function getUserSettings(userId: string): Promise<UserSettings> {
  if (IS_MOCK_MODE) return MockFirestore.getUserSettings(userId);
  const ref = doc(db, `users/${userId}/settings/current`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  // defaults
  return { unit: 'kg', theme: 'system' };
}

export async function saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  if (IS_MOCK_MODE) return MockFirestore.saveUserSettings(userId, settings);
  const ref = doc(db, `users/${userId}/settings/current`);
  await setDoc(ref, settings, { merge: true });
}

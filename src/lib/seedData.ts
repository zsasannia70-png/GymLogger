import { Movement, Template } from "@/types";

export const DEFAULT_MOVEMENTS: Omit<Movement, 'id'>[] = [
  // Legs
  { name: 'Squat', category: 'Legs', isCustom: false },
  { name: 'Front Squat', category: 'Legs', isCustom: false },
  { name: 'Hack Squat', category: 'Legs', isCustom: false },
  { name: 'Leg Press', category: 'Legs', isCustom: false },
  { name: 'Romanian Deadlift', category: 'Legs', isCustom: false },
  { name: 'Walking Lunge', category: 'Legs', isCustom: false },
  { name: 'Bulgarian Split Squat', category: 'Legs', isCustom: false },
  { name: 'Leg Extension', category: 'Legs', isCustom: false },
  { name: 'Leg Curl', category: 'Legs', isCustom: false },
  { name: 'Hip Thrust', category: 'Legs', isCustom: false },
  { name: 'Calf Raise', category: 'Legs', isCustom: false },
  { name: 'Goblet Squat', category: 'Legs', isCustom: false },

  // Back
  { name: 'Deadlift', category: 'Back', isCustom: false },
  { name: 'Barbell Row', category: 'Back', isCustom: false },
  { name: 'Dumbbell Row', category: 'Back', isCustom: false },
  { name: 'Seated Cable Row', category: 'Back', isCustom: false },
  { name: 'T-Bar Row', category: 'Back', isCustom: false },
  { name: 'Pull-Up', category: 'Back', isCustom: false },
  { name: 'Chin-Up', category: 'Back', isCustom: false },
  { name: 'Lat Pulldown', category: 'Back', isCustom: false },
  { name: 'Face Pull', category: 'Back', isCustom: false },
  { name: 'Shrug', category: 'Back', isCustom: false },

  // Chest
  { name: 'Bench Press', category: 'Chest', isCustom: false },
  { name: 'Incline Bench Press', category: 'Chest', isCustom: false },
  { name: 'Dumbbell Bench Press', category: 'Chest', isCustom: false },
  { name: 'Incline Dumbbell Press', category: 'Chest', isCustom: false },
  { name: 'Cable Fly', category: 'Chest', isCustom: false },
  { name: 'Dumbbell Fly', category: 'Chest', isCustom: false },
  { name: 'Chest Dip', category: 'Chest', isCustom: false },
  { name: 'Push-Up', category: 'Chest', isCustom: false },
  { name: 'Machine Chest Press', category: 'Chest', isCustom: false },

  // Shoulders
  { name: 'Overhead Press', category: 'Shoulders', isCustom: false },
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders', isCustom: false },
  { name: 'Arnold Press', category: 'Shoulders', isCustom: false },
  { name: 'Lateral Raise', category: 'Shoulders', isCustom: false },
  { name: 'Front Raise', category: 'Shoulders', isCustom: false },
  { name: 'Reverse Fly', category: 'Shoulders', isCustom: false },
  { name: 'Upright Row', category: 'Shoulders', isCustom: false },

  // Arms
  { name: 'Barbell Curl', category: 'Arms', isCustom: false },
  { name: 'Dumbbell Curl', category: 'Arms', isCustom: false },
  { name: 'Hammer Curl', category: 'Arms', isCustom: false },
  { name: 'Preacher Curl', category: 'Arms', isCustom: false },
  { name: 'Cable Curl', category: 'Arms', isCustom: false },
  { name: 'Tricep Pushdown', category: 'Arms', isCustom: false },
  { name: 'Overhead Tricep Extension', category: 'Arms', isCustom: false },
  { name: 'Skull Crusher', category: 'Arms', isCustom: false },
  { name: 'Close-Grip Bench Press', category: 'Arms', isCustom: false },
  { name: 'Tricep Dip', category: 'Arms', isCustom: false },

  // Core
  { name: 'Plank', category: 'Core', isCustom: false },
  { name: 'Hanging Leg Raise', category: 'Core', isCustom: false },
  { name: 'Cable Crunch', category: 'Core', isCustom: false },
  { name: 'Ab Wheel Rollout', category: 'Core', isCustom: false },
  { name: 'Dead Bug', category: 'Core', isCustom: false },
  { name: 'Russian Twist', category: 'Core', isCustom: false },
  { name: 'Decline Sit-Up', category: 'Core', isCustom: false },

  // Cardio
  { name: 'Running', category: 'Cardio', isCustom: false },
  { name: 'Rowing Machine', category: 'Cardio', isCustom: false },
  { name: 'Stationary Bike', category: 'Cardio', isCustom: false },
  { name: 'Jump Rope', category: 'Cardio', isCustom: false },
  { name: 'Stair Climber', category: 'Cardio', isCustom: false },
];

export const DEFAULT_TEMPLATES: Omit<Template, 'id'>[] = [
  {
    name: 'Majestic Full Body A',
    order: 0,
    createdAt: Date.now(),
    entries: [
      { movementName: 'Squat', reps: 5, weight: 60, unit: 'kg' },
      { movementName: 'Bench Press', reps: 5, weight: 40, unit: 'kg' },
      { movementName: 'Barbell Row', reps: 5, weight: 40, unit: 'kg' },
    ]
  },
  {
    name: 'Majestic Full Body B',
    order: 1,
    createdAt: Date.now(),
    entries: [
      { movementName: 'Deadlift', reps: 5, weight: 80, unit: 'kg' },
      { movementName: 'Overhead Press', reps: 5, weight: 30, unit: 'kg' },
      { movementName: 'Pull-Up', reps: 8, weight: 0, unit: 'kg' },
    ]
  },
  {
    name: 'Majestic Full Body C',
    order: 2,
    createdAt: Date.now(),
    entries: [
      { movementName: 'Front Squat', reps: 8, weight: 40, unit: 'kg' },
      { movementName: 'Incline Bench Press', reps: 8, weight: 35, unit: 'kg' },
      { movementName: 'Dumbbell Row', reps: 10, weight: 20, unit: 'kg' },
    ]
  }
];

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { setMovements, saveTemplate } from '@/lib/firestore';
import { DEFAULT_MOVEMENTS, DEFAULT_TEMPLATES } from '@/lib/seedData';
import { useState } from 'react';

export default function SeedPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await setMovements(user.uid, DEFAULT_MOVEMENTS);
      for (const t of DEFAULT_TEMPLATES) {
        await saveTemplate(user.uid, t);
      }
      alert('Data seeded successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to seed data.');
    }
    setSeeding(false);
  };

  if (!user) return <div className="p-8 text-center text-text-tertiary">Log in first.</div>;

  return (
    <div className="flex flex-col items-center justify-center p-8 mt-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Development Utilities</h1>
      <p className="text-text-secondary mb-8">Manually re-seed default movements and templates.</p>
      
      <button 
        onClick={handleSeed}
        disabled={seeding}
        className="w-full max-w-sm bg-accent text-text-on-accent font-bold py-4 rounded-xl shadow-btn active:shadow-btn-pressed disabled:opacity-50"
      >
        {seeding ? 'Seeding...' : 'Seed Data'}
      </button>
    </div>
  );
}

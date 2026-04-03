'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useWorkouts } from '@/hooks/useWorkouts';

export default function SettingsPage() {
  const { user, logout, seedInitialData } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { workouts: allWorkouts } = useWorkouts();

  const handleExportCSV = async () => {
    if (!user) return;
    try {
      const rows = [
        ['Date', 'Movement', 'Weight', 'Unit', 'Reps', 'Notes']
      ];
      
      allWorkouts.forEach(w => {
        w.entries.forEach(e => {
          rows.push([
            w.date,
            `"${e.movementName}"`, // Escape quotes
            e.weight.toString(),
            e.unit,
            e.reps.toString(),
            `"${e.notes || ''}"`
          ]);
        });
      });

      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      const today = new Date().toISOString().split('T')[0];
      
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `gym-log-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        
        {/* Profile Card */}
        <div className="card-depth p-4">
          <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4">Profile</h2>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold truncate text-text-primary">{user?.displayName || 'Gym Logger User'}</p>
              <p className="text-sm text-text-secondary truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full bg-danger/10 text-danger font-bold py-3 rounded-xl active:bg-danger/20 transition-colors"
          >
            Log Out
          </button>
        </div>

        {/* Preferences */}
        <div className="card-depth p-4">
          <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4">Appearance</h2>
          
          <div className="grid grid-cols-3 gap-2 bg-bg-tertiary p-1 rounded-xl">
            {(['system', 'light', 'dark'] as const).map(t => (
              <button
                key={t}
                onClick={() => updateSettings({ theme: t })}
                className={`py-2 text-sm font-bold rounded-lg capitalize transition-all ${
                  settings.theme === t 
                    ? 'bg-bg-secondary text-accent shadow-card-pressed' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="card-depth p-4">
          <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4">Weight Unit</h2>
          
          <div className="grid grid-cols-2 gap-2 bg-bg-tertiary p-1 rounded-xl">
            {(['kg', 'lbs'] as const).map(u => (
              <button
                key={u}
                onClick={() => updateSettings({ unit: u })}
                className={`py-2 text-sm font-bold rounded-lg transition-all ${
                  settings.unit === u 
                    ? 'bg-bg-secondary text-accent shadow-card-pressed' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div className="card-depth p-4 space-y-3">
          <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-4">Data Management</h2>
          <button 
            onClick={handleExportCSV}
            className="w-full bg-bg-secondary border border-border text-text-primary font-bold py-3 rounded-xl shadow-sm active:bg-bg-tertiary transition-colors"
          >
            Export Workout Logger as CSV
          </button>
          
          <button 
            onClick={async () => {
              if (confirm('Verify: Restoration of default movements and majestic templates?')) {
                await seedInitialData();
                alert('Defaults restored successfully!');
              }
            }}
            className="w-full bg-accent/10 border border-accent/20 text-accent font-bold py-3 rounded-xl shadow-sm active:bg-accent/20 transition-colors"
          >
            Restore Default Data (Majestic)
          </button>
        </div>

      </div>

      <p className="text-center text-xs text-text-tertiary mt-10">
        Gym Logger • Built with Next.js & Firebase
      </p>
    </div>
  );
}

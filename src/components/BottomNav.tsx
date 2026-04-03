'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, ClipboardList, Dumbbell, BarChart2, Settings } from 'lucide-react';

const TABS = [
  { name: 'Workout', path: '/', icon: Activity },
  { name: 'Templates', path: '/templates', icon: ClipboardList },
  { name: 'Movements', path: '/movements', icon: Dumbbell },
  { name: 'History', path: '/history', icon: BarChart2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isDemoMode } = useAuth();
  
  // Do not show navigation on login page
  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50">
      {isDemoMode && (
        <div className="flex justify-center mb-2">
          <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full backdrop-blur-md">
            <span className="text-[10px] font-black text-orange-500 tracking-widest uppercase">Demo Mode • Local Storage</span>
          </div>
        </div>
      )}
      <div className="max-w-lg mx-auto bg-glass-bg backdrop-blur-xl border-t border-border"
           style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
        <div className="flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)]">
          {TABS.map((tab) => {
            const isActive = pathname === tab.path;
            const Icon = tab.icon;

            return (
              <Link 
                key={tab.path} 
                href={tab.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-90 transition-transform ${
                  isActive ? 'text-accent scale-105 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-text-tertiary hover:text-accent/70'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.name}</span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState('');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionState('opacity-0');
      // A small delay to allow fade out, then swap and fade in.
      // Next.js App Router navigations are fast, so keep this minimal.
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionState('animate-fade-in');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, children, displayChildren]);

  return (
    <div className={`transition-opacity duration-100 ${transitionState}`}>
      {displayChildren}
    </div>
  );
}

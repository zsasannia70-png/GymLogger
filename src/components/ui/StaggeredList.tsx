import React from 'react';

export function StaggeredList({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <div
            className="animate-stagger-in opacity-0"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

// Skeleton.tsx
export function SkeletonCard() {
  return (
    <div className="card-depth h-24 w-full skeleton mb-4"></div>
  );
}

export function SkeletonList() {
  return (
    <div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

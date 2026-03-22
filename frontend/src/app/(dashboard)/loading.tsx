export default function PageLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-muted/50 rounded-xl" />
        <div className="h-72 bg-muted/50 rounded-xl" />
      </div>
    </div>
  );
}

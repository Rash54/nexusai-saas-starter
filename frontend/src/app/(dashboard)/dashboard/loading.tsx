export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-muted rounded-lg" />
          <div className="h-4 w-56 bg-muted rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dash-card h-24 bg-muted/50" />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 dash-card h-48 bg-muted/50" />
        <div className="dash-card h-48 bg-muted/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="dash-card h-56 bg-muted/50" />
        ))}
      </div>
    </div>
  );
}

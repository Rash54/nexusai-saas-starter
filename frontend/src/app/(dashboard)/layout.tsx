import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { NexuAIChat } from "@/components/ai/NexuAIChat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto">
          {/* Add bottom padding on mobile for bottom nav */}
          <div className="p-4 md:p-6 pb-24 md:pb-6 page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* NEXU AI Chat Panel */}
      <NexuAIChat />
    </div>
  );
}

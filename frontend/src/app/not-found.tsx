import Link from "next/link";
import { NexuLogo } from "@/components/ui/NexuLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center gap-6">
      <NexuLogo size="lg" />
      <div>
        <p className="text-8xl font-display font-bold text-primary/20">404</p>
        <h1 className="text-2xl font-display font-bold mt-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mt-2">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link href="/dashboard" className="btn-primary px-8">
        Back to Dashboard
      </Link>
    </div>
  );
}

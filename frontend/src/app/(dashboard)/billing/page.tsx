import { ProGate } from "@/components/ui/ProGate";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your plan, usage, and payment details
        </p>
      </div>
      <ProGate
        feature="Billing & Plans — Pro Feature"
        description="Upgrade to NexusAI Pro for full billing management, subscription tracking, and usage monitoring."
        bullets={[
          "Plan management: Starter, Pro, Enterprise",
          "Invoice history and download",
          "Usage tracking: AI requests, uploads, team seats",
          "Stripe-powered subscription management",
        ]}
      />
    </div>
  );
}

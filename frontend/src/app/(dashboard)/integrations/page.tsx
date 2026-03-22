import { ProGate } from "@/components/ui/ProGate";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect your revenue, analytics, CRM, and banking tools
        </p>
      </div>
      <ProGate
        feature="Native Integrations — Pro Feature"
        description="Connect NexusAI directly to your existing stack. Data syncs automatically — no manual exports needed."
        bullets={[
          "Stripe — MRR, subscriptions, churn, payment events",
          "HubSpot — contacts, deals, pipeline, lifecycle stages",
          "Google Analytics 4 — traffic, acquisition, conversions",
          "PostHog & Mixpanel — user events, funnels, retention",
          "Plaid & Mercury — bank balances and cash flow",
          "OpenAI & Anthropic — AI cost tracking and token logs",
        ]}
      />
    </div>
  );
}

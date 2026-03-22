import { ProGate } from "@/components/ui/ProGate";

export default function AIInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">AI Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI-powered benchmarks, anomaly detection, and scenario modelling
        </p>
      </div>
      <ProGate
        feature="AI Insights — Pro Feature"
        description="Get deep AI analysis of your SaaS metrics: industry benchmarks, anomaly alerts, what-if scenarios, and health scoring."
        bullets={[
          "Industry SaaS benchmarks by ARR band (OpenView, ChartMogul data)",
          "Real-time anomaly detection with z-score alerts",
          "What-if scenario modelling across 10 variables",
          "AI health score with actionable grading (A/B/C/D)",
          "Customer segmentation and cohort analysis",
        ]}
      />
    </div>
  );
}

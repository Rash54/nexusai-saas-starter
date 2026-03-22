import { ProGate } from "@/components/ui/ProGate";

export default function CorrelationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Ad Correlations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect ad spend to revenue with Pearson correlation analysis
        </p>
      </div>
      <ProGate
        feature="Ad Correlations — Pro Feature"
        description="Discover exactly which ad campaigns drive revenue. Upload your campaign data and get Pearson-correlated insights across all platforms."
        bullets={[
          "Ad spend ↔ revenue Pearson correlation engine",
          "Campaign-level scoring: Scale / Optimize / Pause / Test",
          "Platform breakdown: Google, Facebook, Instagram, TikTok",
          "ROAS and CTR analysis across all campaigns",
          "AI-generated budget reallocation recommendations",
        ]}
      />
    </div>
  );
}

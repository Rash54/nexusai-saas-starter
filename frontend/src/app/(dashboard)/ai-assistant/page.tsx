import { ProGate } from "@/components/ui/ProGate";

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Full AI assistant with persistent history</p>
      </div>
      <ProGate
        feature="AI Assistant — Pro Feature"
        description="Ask anything about your business data. The Pro AI assistant has full context of your metrics, integrations, and history."
        bullets={[
          "Unlimited AI conversations with full context",
          "Answers grounded in your live metric data",
          "OpenAI GPT-4 + Anthropic Claude routing",
          "Web intelligence enrichment (HN, Reddit, SaaS blogs)",
          "Conversation history and export",
        ]}
      />
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ListTodo, Lock, ArrowRight, Zap } from "lucide-react";

const SAMPLE_TASKS = [
  { id: 1, title: "Review Q1 MRR report", status: "todo", priority: "high" },
  { id: 2, title: "Set up Stripe integration", status: "in_progress", priority: "high" },
  { id: 3, title: "Analyse churn cohort", status: "todo", priority: "medium" },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10",
  medium: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
  low: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-blue-600 dark:text-blue-400",
  done: "text-emerald-600 dark:text-emerald-400",
};

export default function TasksPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sample tasks — read only in Community Edition
          </p>
        </div>

        <div className="dash-card">
          <div className="space-y-2">
            {SAMPLE_TASKS.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <ListTodo className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium flex-1">{task.title}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                <span className={`text-xs font-medium flex-shrink-0 ${STATUS_COLORS[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="dash-card border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-2">Full task management in Pro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-3">
                {[
                  "Create, edit and assign tasks",
                  "AI-powered priority scoring",
                  "Link tasks to metrics and goals",
                  "Team collaboration and comments",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-primary flex-shrink-0" />
                    {item}
                  </p>
                ))}
              </div>
              <a
                href="https://yusuf545.gumroad.com/l/ttazrg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                Upgrade to Pro <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
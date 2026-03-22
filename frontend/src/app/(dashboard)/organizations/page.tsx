"use client";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Organizations</h1>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dash-card flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm font-medium">Organization management</p>
        <p className="text-xs text-muted-foreground mt-1">Create and switch between multiple organizations</p>
        <button className="btn-primary mt-6">Create Organization</button>
      </motion.div>
    </div>
  );
}

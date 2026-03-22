"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Lock, ArrowRight, Zap, Loader2, X, CheckCircle2 } from "lucide-react";
import { useUploadFile, useUploads } from "@/hooks/useApi";
import toast from "react-hot-toast";

const ACCEPTED = [".csv", ".xlsx", ".xls"];
const MAX_MB = 5;

function formatBytes(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function statusStyle(status: string): string {
  if (status === "done" || status === "complete")
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
  if (status === "error")
    return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  if (status === "processing")
    return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
}

interface UploadRecord {
  id: string;
  original_filename?: string;
  status: string;
  row_count?: number;
  upload_type?: string;
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState("auto");

  const uploadMutation = useUploadFile();
  const { data: uploads, refetch } = useUploads();

  const validateAndSet = (file: File) => {
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      toast.error("Only CSV and Excel files (.csv, .xlsx, .xls) are supported");
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_MB) {
      toast.error(`File too large (${sizeMB.toFixed(1)} MB). Limit is ${MAX_MB} MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        hint: selectedType !== "auto" ? selectedType : undefined,
      });
      setSelectedFile(null);
      refetch();
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Upload Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Community Edition — up to {MAX_MB} MB / 500 rows per file
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-accent/30"
            }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragging ? "bg-primary/20" : "bg-accent"
              }`}>
              <Upload className={`w-6 h-6 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {dragging ? "Drop to upload" : "Drop your file here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .csv, .xlsx, .xls — max {MAX_MB} MB
              </p>
            </div>
            <label
              onClick={(e) => e.stopPropagation()}
              className="btn-primary text-sm px-6 py-2 cursor-pointer mt-1"
            >
              Browse file
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
              />
            </label>
          </div>
        </div>

        {selectedFile && (
          <div className="dash-card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="input-base h-8 text-xs w-36 flex-shrink-0"
            >
              <option value="auto">Auto-detect</option>
              <option value="revenue_mrr">Revenue / MRR</option>
              <option value="ad_platform">Ad campaigns</option>
              <option value="google_analytics">Google Analytics</option>
              <option value="custom">Custom data</option>
            </select>
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="btn-primary h-8 text-xs px-4 flex-shrink-0 gap-1.5 disabled:opacity-60 flex items-center"
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload</>
              )}
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploads && (uploads as UploadRecord[]).length > 0 && (
          <div className="dash-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Recent uploads
            </p>
            <div className="space-y-2">
              {(uploads as UploadRecord[]).slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.original_filename ?? "Unnamed file"}
                    </p>
                    {u.upload_type && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {u.upload_type.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                  {u.row_count != null && u.row_count > 0 && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {u.row_count.toLocaleString()} rows
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 flex items-center gap-1 ${statusStyle(u.status)}`}>
                    {(u.status === "done" || u.status === "complete") && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {u.status === "done" ? "Done" : u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dash-card border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-2">Unlock full upload power with Pro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-3">
                {[
                  "Up to 50 MB files, unlimited rows",
                  "AI-powered column detection",
                  "Automatic insight generation",
                  "Ad campaign metric parsing",
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
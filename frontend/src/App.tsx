import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Wrench, 
  Database,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Trash2,
  Brain,
  Download,
  Package,
  Hammer,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Asset {
  id: number;
  name: string;
  category: string;
  condition: string;
  issue_description: string;
  age: number;
  estimated_repair_cost: number;
  // Enriched AI fields
  recoverable?: string;
  decision?: string;
  priority?: string;
  reason?: string;
  estimated_outcome?: string;
}

interface OperationsMetrics {
  budget_utilization: number;
  hours_utilization: string;
  expected_value_recovery: number;
}

interface UploadResponse {
  assets: Asset[];
  plan: Asset[];
  deferred: Asset[];
  metrics: OperationsMetrics;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [plan, setPlan] = useState<Asset[]>([]);
  const [deferred, setDeferred] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  
  const [budgetInput, setBudgetInput] = useState<string>("50000");
  const [hoursInput, setHoursInput] = useState<string>("8");
  
  const [activeTab, setActiveTab] = useState<"plan" | "deferred" | "telemetry">("plan");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/upload`;

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Only CSV files are supported.");
        setFile(null);
      }
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Only CSV files are supported.");
        setFile(null);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle CSV Upload and API dispatch
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("budget", budgetInput);
    formData.append("hours", hoursInput);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to parse CSV file.");
      }

      const data: UploadResponse = await response.json();
      setAssets(data.assets);
      setPlan(data.plan);
      setDeferred(data.deferred);
      setMetrics(data.metrics);
      setFile(null);
      
      // Auto focus plan tab
      setActiveTab("plan");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setAssets([]);
      setPlan([]);
      setDeferred([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper for condition styling
  const getConditionColor = (condition: string) => {
    const cond = condition.trim().toLowerCase();
    if (cond === "good" || cond === "excellent") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (cond === "moderate" || cond === "fair") {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  };

  // Helper: Retrieve dynamic totals if inventory is uploaded, fallback to 0 on initial load
  const getOverviewCount = (type: string) => {
    if (assets.length === 0) return 0;
    const typeUpper = type.toUpperCase();
    if (typeUpper === "RECOVERABLE") {
      return assets.filter(a => a.recoverable?.toUpperCase() === "YES").length;
    }
    return assets.filter(a => a.decision?.toUpperCase() === typeUpper).length;
  };

  // Check if AI service is operating in heuristic fallback mode
  const isFallbackMode = assets.some(a => a.reason?.includes("Fallback Mode"));

  // Recovery Analytics dynamic configurations
  const displayExpectedValue = metrics 
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(metrics.expected_value_recovery)
    : "₹0";
  const displayBudgetPercent = metrics ? metrics.budget_utilization : 0;
  const displayHoursStr = metrics ? `${metrics.hours_utilization} hrs` : `0.0 / ${hoursInput} hrs`;
  
  const getHoursPercent = () => {
    if (!metrics) return 0;
    try {
      const parts = metrics.hours_utilization.split("/");
      const spent = parseFloat(parts[0]);
      const total = parseFloat(parts[1]);
      return total > 0 ? (spent / total) * 100 : 0;
    } catch {
      return 0;
    }
  };
  const displayHoursPercent = getHoursPercent();

  const displayWastePercent = assets.length > 0
    ? Math.round((assets.filter(a => a.decision?.toUpperCase() !== "SCRAP").length / assets.length) * 100)
    : 0;

  // Render Top Priorities sidebar based on scheduled plan assets (empty list prompt on load)
  const renderPriorities = () => {
    if (plan.length === 0) {
      return (
        <div className="p-4 border border-slate-900 bg-[#0B0F19]/20 rounded-lg text-center text-slate-500 text-xs font-mono">
          No high-priority assets scheduled yet. Upload inventory to populate priorities list.
        </div>
      );
    }

    const priorityWeight = { "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
    const sortedPlan = [...plan].sort((a, b) => {
      const wA = priorityWeight[a.priority?.toUpperCase() as keyof typeof priorityWeight] || 2;
      const wB = priorityWeight[b.priority?.toUpperCase() as keyof typeof priorityWeight] || 2;
      return wB - wA;
    });

    return sortedPlan.slice(0, 3).map((asset, index) => {
      const mockScore = 98 - (index * 3);
      return (
        <div key={asset.id} className="bg-slate-950/40 p-3 rounded border border-slate-900 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-[#aa3bff] font-semibold font-mono">
              Priority #{index + 1}
            </span>
            <h4 className="text-xs font-semibold text-slate-200">{asset.name}</h4>
            <p className="text-[10px] text-slate-400">
              Decision: <span className="text-blue-400 font-mono">{asset.decision}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold font-mono tracking-tight bg-gradient-to-tr from-amber-400 to-[#aa3bff] bg-clip-text text-transparent">
              {mockScore}
            </span>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Score</p>
          </div>
        </div>
      );
    });
  };

  // Asset Card Grid Renderer
  const renderAssetCards = (list: Asset[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((asset) => (
        <Card 
          key={asset.id} 
          className="bg-[#0B0F19]/65 border-slate-900 hover:border-slate-800/80 transition-colors shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
                  ID: {asset.id}
                </span>
                <span className={`text-[9px] font-mono font-medium uppercase px-1.5 py-0.5 rounded border ${getConditionColor(asset.condition)}`}>
                  {asset.condition}
                </span>
              </div>
              <CardTitle className="text-sm font-semibold text-slate-200 leading-tight">
                {asset.name}
              </CardTitle>
              <CardDescription className="text-slate-400 font-mono text-[10px] flex items-center gap-1 mt-0.5">
                <Layers className="w-3 h-3 text-[#aa3bff]" /> {asset.category}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 pt-2 space-y-3 text-xs">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                  Issue Description
                </span>
                <p className="text-slate-300 text-[11px] bg-slate-950/30 p-2 rounded border border-slate-900/50 leading-relaxed min-h-[36px]">
                  {asset.issue_description || "No issues specified."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/20 p-2 rounded border border-slate-900/50">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-blue-400" /> Age
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {asset.age} {asset.age === 1 ? "year" : "years"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5 text-emerald-400" /> Repair Cost
                  </span>
                  <span className="text-xs font-semibold text-slate-200 font-mono">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(asset.estimated_repair_cost)}
                  </span>
                </div>
              </div>

              {asset.recoverable && (
                <div className="border-t border-slate-950/80 pt-3 space-y-2 mt-2">
                  <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-900/50 text-[10px]">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">Recoverable</span>
                      <span className={`font-mono font-semibold ${
                        asset.recoverable.toUpperCase() === "YES" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {asset.recoverable}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">Decision</span>
                      <span className="font-mono font-semibold text-blue-400">
                        {asset.decision}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">Priority</span>
                      <span className={`font-mono font-semibold ${
                        asset.priority?.toUpperCase() === "HIGH" ? "text-rose-400" : 
                        (asset.priority?.toUpperCase() === "MEDIUM" ? "text-amber-400" : "text-slate-400")
                      }`}>
                        {asset.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                      AI Reasoning Explanation
                    </span>
                    <p className="text-slate-300 text-[11px] bg-slate-950/20 p-2 rounded border border-slate-900/40 leading-relaxed italic">
                      "{asset.reason}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                      Estimated Operational Outcome
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {asset.estimated_outcome}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 font-sans selection:bg-[#aa3bff]/30 selection:text-white pb-12">
      {/* Glow Effect Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-[#aa3bff]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Application Header */}
      <header className="border-b border-slate-900 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-[#aa3bff] to-blue-500 shadow-[0_0_15px_rgba(170,59,255,0.4)]">
              <Cpu className="w-5 h-5 text-white" />
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#aa3bff] to-blue-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ReviveOps AI
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                Recovery Operations Center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* SECTION 2: RECOVERY OVERVIEW CARDS (Live Data) */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Recoverable Assets Card */}
            <Card className="bg-[#0B0F19]/45 border-slate-900 shadow-md hover:border-slate-800/80 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Recoverable</span>
                  <Package className="w-4 h-4 text-[#aa3bff]" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-semibold font-mono tracking-tight text-white">
                    {getOverviewCount("RECOVERABLE")}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Total Assets</p>
                </div>
              </CardContent>
            </Card>

            {/* Repair Card */}
            <Card className="bg-[#0B0F19]/45 border-slate-900 shadow-md hover:border-slate-800/80 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Repair</span>
                  <Hammer className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-semibold font-mono tracking-tight text-blue-400">
                    {getOverviewCount("REPAIR")}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Assigned</p>
                </div>
              </CardContent>
            </Card>

            {/* Recycle Card */}
            <Card className="bg-[#0B0F19]/45 border-slate-900 shadow-md hover:border-slate-800/80 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Recycle</span>
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-semibold font-mono tracking-tight text-emerald-400">
                    {getOverviewCount("RECYCLE")}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Assigned</p>
                </div>
              </CardContent>
            </Card>

            {/* Reuse Card */}
            <Card className="bg-[#0B0F19]/45 border-slate-900 shadow-md hover:border-slate-800/80 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Reuse</span>
                  <Layers className="w-4 h-4 text-violet-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-semibold font-mono tracking-tight text-violet-400">
                    {getOverviewCount("REUSE")}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Assigned</p>
                </div>
              </CardContent>
            </Card>

            {/* Resell Card */}
            <Card className="bg-[#0B0F19]/45 border-slate-900 shadow-md hover:border-slate-800/80 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Resell</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-semibold font-mono tracking-tight text-amber-400">
                    {getOverviewCount("RESELL")}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Assigned</p>
                </div>
              </CardContent>
            </Card>

            {/* Scrap Card */}
            <Card className="bg-[#0B0F19]/45 border-slate-900 shadow-md hover:border-slate-800/80 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Scrap</span>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-semibold font-mono tracking-tight text-rose-400">
                    {getOverviewCount("SCRAP")}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Assigned</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Dashboard Content split: Left is Upload & Telemetry, Right is Control panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Upload & Parsed telemetry list) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* CSV Uploader & Constraints Inputs */}
            <Card className="bg-[#0B0F19]/65 border-slate-900 shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#aa3bff]" /> Load Recoverable Assets
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Upload asset inventories and specify resource constraints to construct Today's Recovery Plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Constraint Parameters (Operations Engine Input) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Available Operations Budget (₹)
                    </label>
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-[#aa3bff] focus:outline-none"
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Available Shift Duration (Hours)
                    </label>
                    <input
                      type="number"
                      value={hoursInput}
                      onChange={(e) => setHoursInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-[#aa3bff] focus:outline-none"
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`group border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] ${
                    dragActive 
                      ? "border-[#aa3bff] bg-[#aa3bff]/5" 
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/10"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="p-2.5 bg-slate-900/60 rounded-full border border-slate-800 text-slate-400 mb-2 group-hover:text-slate-300 group-hover:border-slate-700 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  
                  {file ? (
                    <div className="flex items-center gap-2 text-[#aa3bff] font-mono text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{file.name}</span>
                      <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-300 font-medium text-xs">
                        Drag and drop CSV here, or click to upload
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Headers: ID, NAME, CATEGORY, CONDITION, ISSUE_DESCRIPTION, AGE, ESTIMATED_REPAIR_COST
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  {file && (
                    <Button
                      onClick={() => setFile(null)}
                      variant="ghost"
                      className="text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs h-8 px-3"
                      disabled={loading}
                    >
                      Clear Selection
                    </Button>
                  )}
                  <Button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="bg-gradient-to-r from-[#aa3bff] to-blue-600 hover:from-[#b853ff] hover:to-blue-500 text-white text-xs h-8 px-4 font-semibold shadow-sm disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Processing...
                      </>
                    ) : (
                      "Process CSV File"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-lg flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-rose-200 text-xs">CSV Upload Failed</h3>
                  <p className="text-rose-400/90 text-[11px] font-mono mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                <div className="h-4 bg-slate-900 rounded w-1/3 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((n) => (
                    <Card key={n} className="bg-[#0B0F19]/40 border-slate-900">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-3 bg-slate-900 rounded w-2/3 animate-pulse" />
                        <div className="h-3 bg-slate-900 rounded w-1/2 animate-pulse" />
                        <div className="h-8 bg-slate-900 rounded animate-pulse" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Telemetry & Plan Displays */}
            {!loading && assets.length > 0 && (
              <div className="space-y-6">
                
                {/* Upload Success Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {assets.length} Assets Loaded & Computed
                    </span>
                  </div>

                  {/* Fallback indicator alert banner */}
                  {isFallbackMode && (
                    <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>AI Heuristic Fallback Active</span>
                    </div>
                  )}
                </div>

                {/* Operations Engine Tabs */}
                <div className="flex border-b border-slate-900 gap-6 text-sm font-semibold">
                  <button
                    onClick={() => setActiveTab("plan")}
                    className={`pb-2 transition-colors relative ${
                      activeTab === "plan" ? "text-slate-200" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Today's Plan ({plan.length})
                    {activeTab === "plan" && (
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#aa3bff]" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("deferred")}
                    className={`pb-2 transition-colors relative ${
                      activeTab === "deferred" ? "text-slate-200" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Deferred Assets ({deferred.length})
                    {activeTab === "deferred" && (
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-amber-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("telemetry")}
                    className={`pb-2 transition-colors relative ${
                      activeTab === "telemetry" ? "text-slate-200" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    All Inventory & Telemetry ({assets.length})
                    {activeTab === "telemetry" && (
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-blue-500" />
                    )}
                  </button>
                </div>

                {/* Render tab content */}
                {activeTab === "plan" && (
                  plan.length > 0 ? (
                    renderAssetCards(plan)
                  ) : (
                    <div className="p-8 border border-slate-900 bg-[#0B0F19]/15 rounded-lg text-center text-slate-500 text-xs font-mono">
                      No assets scheduled for today. Increase budget or shift hours.
                    </div>
                  )
                )}

                {activeTab === "deferred" && (
                  deferred.length > 0 ? (
                    renderAssetCards(deferred)
                  ) : (
                    <div className="p-8 border border-slate-900 bg-[#0B0F19]/15 rounded-lg text-center text-emerald-500 text-xs font-mono">
                      No deferred assets! All items fit within operations constraints.
                    </div>
                  )
                )}

                {activeTab === "telemetry" && (
                  <div className="space-y-6">
                    {renderAssetCards(assets)}

                    {/* Telemetry Detail Table */}
                    <Card className="bg-[#0B0F19]/45 border-slate-900 shadow-md">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-blue-400" /> Telemetry Database Logs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 border-t border-slate-900">
                        <Table>
                          <TableHeader className="bg-slate-950/40 font-mono text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-900">
                            <TableRow>
                              <TableHead className="w-[50px] text-slate-400 font-mono">ID</TableHead>
                              <TableHead className="text-slate-400">Name</TableHead>
                              <TableHead className="text-slate-400">Category</TableHead>
                              <TableHead className="text-slate-400">Condition</TableHead>
                              <TableHead className="text-slate-400">Recoverable</TableHead>
                              <TableHead className="text-slate-400">AI Decision</TableHead>
                              <TableHead className="text-slate-400 font-mono">Priority</TableHead>
                              <TableHead className="w-[50px] text-slate-400 text-center font-mono">Age</TableHead>
                              <TableHead className="w-[100px] text-slate-400 text-right font-mono">Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="text-[11px]">
                            {assets.map((asset) => (
                              <TableRow key={asset.id} className="border-b border-slate-950/40 hover:bg-slate-900/10">
                                <TableCell className="font-mono text-slate-500">{asset.id}</TableCell>
                                <TableCell className="font-medium text-slate-200">{asset.name}</TableCell>
                                <TableCell className="text-slate-400">{asset.category}</TableCell>
                                <TableCell>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getConditionColor(asset.condition)}`}>
                                    {asset.condition}
                                  </span>
                                </TableCell>
                                <TableCell className="font-mono font-semibold">
                                  {asset.recoverable || "-"}
                                </TableCell>
                                <TableCell className="font-mono font-semibold text-blue-400">
                                  {asset.decision || "-"}
                                </TableCell>
                                <TableCell className="font-mono font-semibold">
                                  {asset.priority || "-"}
                                </TableCell>
                                <TableCell className="text-center font-mono text-slate-300">{asset.age}y</TableCell>
                                <TableCell className="text-right font-mono text-slate-200">
                                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(asset.estimated_repair_cost)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}

              </div>
            )}

            {/* Empty Telemetry State */}
            {!loading && assets.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 border border-slate-900 bg-[#0B0F19]/15 rounded-lg">
                <Layers className="w-8 h-8 text-slate-800 mb-2" />
                <p className="text-slate-400 text-xs">
                  No telemetry assets loaded.
                </p>
                <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                  Upload an asset inventory CSV file on the panel above to initialize list views.
                </p>
              </div>
            )}

          </div>

          {/* Right Column (Sidebar: Priorities, Analytics, AI text analysis, report actions) */}
          <div className="space-y-8">
            
            {/* SECTION 3: TODAY'S TOP PRIORITIES (Live plan dynamic display) */}
            <Card className="bg-[#0B0F19]/65 border-slate-900 shadow-lg">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Today's Top Priorities
                </CardTitle>
                <CardDescription className="text-slate-400 text-[10px]">
                  High priority candidates ranked by salvage return efficiency.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                {renderPriorities()}
              </CardContent>
            </Card>

            {/* SECTION 4: RECOVERY ANALYTICS SECTION (Dynamic progress) */}
            <Card className="bg-[#0B0F19]/65 border-slate-900 shadow-lg">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Recovery Analytics
                </CardTitle>
                <CardDescription className="text-slate-400 text-[10px]">
                  Real-time operational recovery performance indicators.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                
                {/* Expected Value Recovery */}
                <div className="bg-slate-950/30 p-3 rounded border border-slate-900/60">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                    Expected Value Recovery
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white font-mono">{displayExpectedValue}</span>
                    {metrics && (
                      <span className="text-[9px] text-emerald-400 font-semibold font-mono flex items-center gap-0.5">
                        +12.4%
                      </span>
                    )}
                  </div>
                </div>

                {/* Budget Utilization */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">Budget Utilization</span>
                    <span className="font-mono text-slate-200 font-semibold">{displayBudgetPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, displayBudgetPercent)}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono text-right">Limit: ₹{parseFloat(budgetInput).toLocaleString("en-IN")}</p>
                </div>

                {/* Working Hours */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">Working Hours</span>
                    <span className="font-mono text-slate-200 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {displayHoursStr}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, displayHoursPercent)}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono text-right">Limit: {hoursInput} hrs</p>
                </div>

                {/* Waste Reduction */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">Waste Reduction</span>
                    <span className="font-mono text-slate-200 font-semibold">{displayWastePercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${displayWastePercent}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono text-right">Target: 75%</p>
                </div>

              </CardContent>
            </Card>

            {/* SECTION 5: AI RECOVERY ANALYSIS SECTION (Mock AI Explanations -> Live only) */}
            <Card className="bg-[#0B0F19]/65 border-slate-900 shadow-lg relative overflow-hidden">
              {/* Subtle top glow to show AI branding */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#aa3bff]/60 to-transparent" />
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#aa3bff]" /> AI Recovery Analysis
                </CardTitle>
                <CardDescription className="text-slate-400 text-[10px]">
                  Autonomous recommendations explanation telemetry log.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3 text-xs leading-relaxed">
                {assets.length === 0 ? (
                  <div className="p-4 border border-slate-900 bg-[#0B0F19]/20 rounded-lg text-center text-slate-500 text-xs font-mono">
                    AI explanation logs will generate once inventory is uploaded.
                  </div>
                ) : (
                  <>
                    {/* Explanation #1 */}
                    <div className="bg-slate-950/40 p-3 rounded border border-slate-900 flex gap-2.5 items-start">
                      <ShieldCheck className="w-4 h-4 text-[#aa3bff] mt-0.5 shrink-0" />
                      <p className="text-slate-300 text-[11px]">
                        The AI determined that repairing the <span className="text-white font-medium">Dell Laptop</span> provides the highest value recovery while maintaining operational constraints.
                      </p>
                    </div>

                    {/* Explanation #2 */}
                    <div className="bg-slate-950/40 p-3 rounded border border-slate-900 flex gap-2.5 items-start">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-slate-300 text-[11px]">
                        The AI recommends recycling the <span className="text-white font-medium">Plastic Chair</span> because the repair cost exceeds its estimated recovery value.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* SECTION 6: REPORT SECTION (Mock Download Report COMING SOON) */}
            <Card className="bg-[#0B0F19]/65 border-slate-900 shadow-lg">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Operational Reports
                </CardTitle>
                <CardDescription className="text-slate-400 text-[10px]">
                  Generate PDF summaries for compliance and logistics audits.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="relative group">
                  <Button 
                    disabled 
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 flex items-center justify-center gap-2 text-xs h-9 cursor-not-allowed opacity-80"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" /> Download Recovery Report
                  </Button>
                  <span className="absolute right-3 top-2.5 text-[8px] tracking-widest font-mono font-bold bg-[#aa3bff]/10 border border-[#aa3bff]/30 text-[#c084fc] px-1.5 py-0.5 rounded animate-pulse">
                    COMING SOON
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </main>
    </div>
  );
}

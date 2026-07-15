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
  DollarSign
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
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = "http://127.0.0.1:8000/api/upload";

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

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to parse CSV file.");
      }

      const data: Asset[] = await response.json();
      setAssets(data);
      setFile(null); // Clear input after successful upload
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setAssets([]);
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

  return (
    <div className="min-h-screen bg-[#090D1A] text-slate-100 font-sans selection:bg-[#aa3bff]/30 selection:text-white pb-12">
      {/* Glow Effect Gradients */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-[#aa3bff]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Operations Center Header */}
      <header className="border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-[#aa3bff] to-blue-500 shadow-[0_0_15px_rgba(170,59,255,0.4)]">
              <Cpu className="w-5 h-5 text-white" />
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#aa3bff] to-blue-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                REVIVEOPS AI
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* CSV Uploader */}
        <section className="mb-8">
          <Card className="bg-[#0B0F19]/60 border-slate-800 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#aa3bff]" /> Asset Database Loading
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upload your asset inventory CSV to initialize the operations dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`group border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] ${
                  dragActive 
                    ? "border-[#aa3bff] bg-[#aa3bff]/5 shadow-[0_0_15px_rgba(170,59,255,0.1)]" 
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="p-3 bg-slate-900/80 rounded-full border border-slate-800 text-slate-400 group-hover:text-slate-300 group-hover:border-slate-700 transition-all duration-300 mb-3">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                
                {file ? (
                  <div className="flex items-center gap-2 text-[#aa3bff] font-mono text-sm">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-300 font-medium mb-1">
                      Drag and drop CSV file here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      Expected Headers: ID, NAME, CATEGORY, CONDITION, ISSUE_DESCRIPTION, AGE, ESTIMATED_REPAIR_COST
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex justify-end gap-3">
                {file && (
                  <Button
                    onClick={() => setFile(null)}
                    variant="ghost"
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    disabled={loading}
                  >
                    Clear Selection
                  </Button>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="bg-gradient-to-r from-[#aa3bff] to-blue-600 hover:from-[#b853ff] hover:to-blue-500 text-white font-medium shadow-[0_0_20px_rgba(170,59,255,0.2)] disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing Dataset...
                    </>
                  ) : (
                    "Upload and Process Assets"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Error State Banner */}
        {error && (
          <div className="mb-8 p-4 bg-rose-950/30 border border-rose-900/50 rounded-lg flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-rose-200 text-sm">Processing Error</h3>
              <p className="text-rose-400/90 text-xs font-mono mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && (
          <section className="space-y-6">
            <div className="h-6 bg-slate-900 rounded w-1/4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="bg-[#0B0F19]/40 border-slate-900">
                  <CardHeader className="space-y-3">
                    <div className="h-4 bg-slate-900 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-slate-900 rounded w-1/2 animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-3 bg-slate-900 rounded animate-pulse" />
                    <div className="h-3 bg-slate-900 rounded w-5/6 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Assets Listing Section */}
        {!loading && assets.length > 0 && (
          <section className="space-y-6 animate-in fade-in duration-500">
            
            {/* Asset Counter Block */}
            <div className="flex items-center gap-2 bg-[#aa3bff]/10 border border-[#aa3bff]/20 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-mono text-sm font-semibold text-slate-200">
                {assets.length} {assets.length === 1 ? "Asset" : "Assets"} Uploaded Successfully
              </span>
            </div>

            {/* Assets Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <Card 
                  key={asset.id} 
                  className="bg-[#0B0F19]/60 border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 shadow-lg relative group overflow-hidden"
                >
                  {/* Subtle hover glow card border */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#aa3bff]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        ID: {asset.id}
                      </span>
                      <span className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded border ${getConditionColor(asset.condition)}`}>
                        {asset.condition}
                      </span>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-100 leading-tight">
                      {asset.name}
                    </CardTitle>
                    <CardDescription className="text-slate-400 font-mono text-xs flex items-center gap-1.5 mt-1">
                      <Layers className="w-3 h-3 text-[#aa3bff]" /> {asset.category}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 border-t border-slate-900 pt-4 text-sm">
                    {/* Issue Description */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-1">
                        Issue Description
                      </span>
                      <p className="text-slate-300 font-medium text-xs bg-slate-950/40 p-2.5 rounded border border-slate-900/60 leading-relaxed min-h-[48px]">
                        {asset.issue_description || "No issues specified."}
                      </p>
                    </div>

                    {/* Numeric details */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-2.5 rounded border border-slate-900">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3 text-blue-400" /> Age
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {asset.age} {asset.age === 1 ? "year" : "years"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 text-emerald-400" /> Repair Cost
                        </span>
                        <span className="text-xs font-semibold text-slate-200 font-mono">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(asset.estimated_repair_cost)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Asset Table View (Operations Detail) */}
            <Card className="bg-[#0B0F19]/40 border-slate-800 mt-8 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-400" /> Technical Log
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tabular telemetry view of recoverability inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-slate-900">
                <Table>
                  <TableHeader className="bg-slate-950/60 font-mono text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-900">
                    <TableRow>
                      <TableHead className="w-[80px] text-slate-400 font-mono">ID</TableHead>
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Category</TableHead>
                      <TableHead className="text-slate-400">Condition</TableHead>
                      <TableHead className="text-slate-400">Issue Description</TableHead>
                      <TableHead className="w-[80px] text-slate-400 text-center font-mono">Age</TableHead>
                      <TableHead className="w-[120px] text-slate-400 text-right font-mono">Repair Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {assets.map((asset) => (
                      <TableRow key={asset.id} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                        <TableCell className="font-mono text-slate-400">{asset.id}</TableCell>
                        <TableCell className="font-medium text-slate-200">{asset.name}</TableCell>
                        <TableCell className="text-slate-400">{asset.category}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getConditionColor(asset.condition)}`}>
                            {asset.condition}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300 max-w-[200px] truncate" title={asset.issue_description}>
                          {asset.issue_description}
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

          </section>
        )}

        {/* Empty State Instructions */}
        {!loading && assets.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 border border-slate-800/50 bg-[#0B0F19]/20 rounded-xl mt-6">
            <Layers className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-400 font-medium text-sm">
              No assets loaded in the Operations Center.
            </p>
            <p className="text-xs text-slate-600 font-mono mt-1">
              Please upload a valid CSV file to begin telemetry tracking.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

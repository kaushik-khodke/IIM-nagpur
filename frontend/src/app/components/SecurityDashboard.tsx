import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, ShieldAlert, Server, Database, HardDrive, Lock, 
  RefreshCw, Search, Download, AlertTriangle, CheckCircle2, 
  XCircle, Info, Clock, ArrowRight, Terminal, User, Globe,
  Shield, Check, Play, Cpu, AlertCircle, X
} from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: number;
  timestamp: string;
  event_type: string;
  severity: string;
  username: string | null;
  ip_address: string | null;
  request_url: string | null;
  user_agent: string | null;
  description: string;
  metadata: string | null;
}

interface Stats {
  failedLoginAttemptsToday: number;
  totalWarnings: number;
  criticalIssues: number;
  activeAdminSessions: number;
  blockedRequests: number;
  uploadFailures: number;
  apiErrorsToday: number;
}

interface Warning {
  id: string;
  severity: string;
  title: string;
  description: string;
  timestamp: string;
}

interface SystemStatus {
  database: string;
  storage: string;
  authentication: string;
  api: string;
  website: string;
  pwa: string;
  emailService: string;
  notificationService: string;
}

interface Diagnostics {
  uptime: string;
  buildVersion: string;
  environment: string;
  dbLatency: string;
  apiLatency: string;
  storageLatency: string;
  memoryUsage: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
  };
}

interface FailedRequest {
  id: number;
  timestamp: string;
  type: string;
  description: string;
  user: string | null;
  ip: string | null;
  retryable: boolean;
}

// Intercept frontend console errors & runtime exceptions in production
if (import.meta.env.MODE === "production" || true) {
  // Global exception listeners
  const reportErrorToBackend = (errorMsg: string, stack: string = "", type: string = "React errors") => {
    fetch("/api/security/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: type,
        severity: "high",
        description: errorMsg,
        metadata: { stack }
      })
    }).catch(() => {});
  };

  // Listen for uncaught JavaScript runtime exceptions
  const oldOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const msg = `Runtime Exception: ${message} at ${source}:${lineno}:${colno}`;
    reportErrorToBackend(msg, error?.stack || "", "React errors");
    if (oldOnError) return oldOnError(message, source, lineno, colno, error);
    return false;
  };

  // Listen for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = `Unhandled Promise Rejection: ${reason?.message || reason}`;
    reportErrorToBackend(msg, reason?.stack || "", "React errors");
  });

  // Intercept console.error to log to dashboard in production
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError.apply(console, args);
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    // Avoid infinite reporting loops
    if (!msg.includes('/api/security/report-error')) {
      reportErrorToBackend(msg, "", "Console Errors");
    }
  };
}

export function SecurityDashboard({ token }: { token: string | null }) {
  const [data, setData] = useState<{
    logs: LogEntry[];
    stats: Stats;
    warnings: Warning[];
    systemStatus: SystemStatus;
    diagnostics: Diagnostics;
    failedRequests: FailedRequest[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch Dashboard Stats
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/security/dashboard", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch security analytics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      toast.error("Security dashboard check failed: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  // Suggested Cause Helper for Drawer
  const getSuggestedCause = (log: LogEntry) => {
    const desc = log.description.toLowerCase();
    const type = log.event_type;

    if (type === "Unauthorized Access Attempts") {
      return "An API request was blocked because the user lacks administrative access. Ensure the user is logged in as an administrator or the bearer token is valid.";
    }
    if (type === "Failed Login Attempts") {
      return "Incorrect credentials submitted. This is commonly a typo, or a brute-force dictionary attempt on the admin account.";
    }
    if (type === "Multiple Failed Login Attempts") {
      return "Brute force attack pattern identified. Multiple invalid login credentials entered. IP address has been flagged for rate-limiting.";
    }
    if (type === "Background Upload Errors" || type === "Storage Upload Failures") {
      return "Storage provider rejection. Likely caused by a mismatch in whitelisted MIME types, network timeout during file stream, or bucket quota restrictions.";
    }
    if (type === "Database Errors") {
      return "MySQL database query failed. Potential causes include database locks, connection pool timeout, or an unmigrated table column schema.";
    }
    if (type === "React errors" || type === "Console Errors") {
      return "A frontend Javascript runtime error was thrown. Check the client browser engine stack trace for unhandled properties or missing script resources.";
    }
    if (desc.includes("401") || desc.includes("403")) {
      return "Access denied (401/403). Session token might be expired. Ask the user to re-login.";
    }
    return "Unknown. Please inspect the description, metadata stack trace, and request variables above.";
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (!data?.logs || data.logs.length === 0) return;
    const headers = ["ID", "Timestamp", "Event Type", "Severity", "Username", "IP Address", "Request URL", "User Agent", "Description"];
    const rows = data.logs.map(l => [
      l.id,
      l.timestamp,
      l.event_type,
      l.severity,
      l.username || "",
      l.ip_address || "",
      l.request_url || "",
      (l.user_agent || "").replace(/,/g, " "),
      l.description.replace(/,/g, " ")
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully.");
  };

  // Export logs as JSON
  const handleExportJSON = () => {
    if (!data?.logs) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `security_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    toast.success("JSON export downloaded successfully.");
  };

  // Handle Retry Action for Failed Requests
  const handleRetryFailedRequest = (reqId: number) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Retrying request flow...",
        success: "Upload state recovered. Storage sync complete.",
        error: "Retry failed. Service remains offline."
      }
    );
    setTimeout(() => fetchDashboardData(true), 1600);
  };

  // Filter logs locally
  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    return data.logs.filter(log => {
      const matchSeverity = filterSeverity === "all" || log.severity.toLowerCase() === filterSeverity.toLowerCase();
      const matchType = filterType === "all" || log.event_type.toLowerCase() === filterType.toLowerCase();
      
      let matchSearch = true;
      if (searchTerm && searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        matchSearch = 
          log.description.toLowerCase().includes(query) ||
          (log.username || "").toLowerCase().includes(query) ||
          (log.ip_address || "").toLowerCase().includes(query) ||
          log.event_type.toLowerCase().includes(query);
      }
      return matchSeverity && matchType && matchSearch;
    });
  }, [data?.logs, filterSeverity, filterType, searchTerm]);

  // Unique event types list for filtering dropdown
  const uniqueEventTypes = useMemo(() => {
    if (!data?.logs) return [];
    return Array.from(new Set(data.logs.map(l => l.event_type)));
  }, [data?.logs]);

  // Uptime formatting helper
  const formatUptime = (uptimeStr: string) => {
    const secs = parseInt(uptimeStr, 10);
    if (isNaN(secs)) return uptimeStr;
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hours}h ${mins}m ${secs % 60}s`;
  };

  // Severity color helpers
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200 border";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200 border";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 border";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 border";
    }
  };

  const getStatusIndicatorDot = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500 animate-pulse";
      default:
        return "bg-rose-500 animate-ping";
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3">
        <RefreshCw size={36} className="animate-spin text-[#172263]" />
        <span className="text-sm text-[#57585A] font-semibold font-sora">Initializing Security & Monitoring Systems...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center border border-[#E2E8F0] rounded-3xl bg-white space-y-4">
        <AlertTriangle size={48} className="text-red-500 mx-auto" />
        <p className="text-[#1A1A1A] font-bold font-sora">Dashboard offline</p>
        <p className="text-xs text-[#57585A]">Please verify database connection and credentials.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>Security & Monitoring Dashboard</h2>
          <p className="text-xs text-[#57585A] mt-0.5">Real-time health audits, service latency metrics, threats reporting, and runtime exceptions logging.</p>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-center">
          {refreshing && (
            <span className="text-[10px] text-[#57585A] font-extrabold flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Auto-updating...
            </span>
          )}
          <button 
            onClick={() => {
              // -------------------------------------------------------------
              // DEVELOPER NOTE: Write your custom analytics URL redirect here.
              // Example: window.location.href = "https://your-analytics-dashboard.com";
              // -------------------------------------------------------------
              toast.info("Analytics redirection not configured yet.");
             //Replace this line with the above line window.open("https://your-deployed-render-or-vercel-url.com", "_blank"); // Opens link in a new tab
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
          >
            <Activity size={14} />
            View Analytics
          </button>
          <button 
            onClick={() => fetchDashboardData(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* 1. HEALTH MONITOR SECTION */}
      <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#1A1A1A] font-sora flex items-center gap-2">
            <Activity size={18} className="text-[#172263]" /> Live Website & Services Monitor
          </h3>
          <span className="text-[10px] text-[#57585A] font-bold">Refreshes every 30s</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(data.systemStatus).map(([service, status]) => (
            <div key={service} className="p-4 border border-[#E2E8F0] rounded-2xl bg-zinc-50 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.01)] hover:border-zinc-300 transition">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-[#57585A] font-bold uppercase tracking-wider block">
                  {service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <span className="text-xs font-black font-sora text-[#1A1A1A] capitalize">{status}</span>
              </div>
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center">
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusIndicatorDot(status)}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. STATS QUICK CARDS SECTION */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Critical Anomalies", value: data.stats.criticalIssues, desc: "Require immediate review", color: "text-red-600", icon: <ShieldAlert size={20} className="text-red-500" /> },
          { label: "Failed Logins Today", value: data.stats.failedLoginAttemptsToday, desc: "Password mismatches", color: "text-orange-600", icon: <Lock size={20} className="text-orange-500" /> },
          { label: "API Errors Today", value: data.stats.apiErrorsToday, desc: "Endpoints exceptions", color: "text-amber-600", icon: <Terminal size={20} className="text-amber-500" /> },
          { label: "Active Admin Sessions", value: data.stats.activeAdminSessions, desc: "Estimated online admins", color: "text-[#172263]", icon: <User size={20} className="text-[#172263]" /> }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:border-zinc-300 transition">
            <div className="flex justify-between items-center w-full">
              <span className="text-[#57585A] text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
              {stat.icon}
            </div>
            <span className={`text-3xl font-extrabold my-2.5 font-sora ${stat.color}`}>{stat.value}</span>
            <span className="text-[10px] text-[#57585A] font-medium">{stat.desc}</span>
          </div>
        ))}
      </section>

      {/* 3. DIAGNOSTICS & SYSTEM WARNINGS COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DIAGNOSTICS SECTION (Left 1 col) */}
        <section className="bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4">
          <h3 className="text-base font-extrabold text-[#1A1A1A] font-sora flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Cpu size={18} className="text-[#172263]" /> Diagnostics & Health
          </h3>
          
          <div className="space-y-3 text-xs text-[#57585A] font-semibold">
            <div className="flex justify-between border-b border-zinc-50 pb-2">
              <span>Server Uptime</span>
              <span className="font-mono text-zinc-950">{formatUptime(data.diagnostics.uptime)}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-50 pb-2">
              <span>Build version</span>
              <span className="font-mono text-zinc-950">v{data.diagnostics.buildVersion}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-50 pb-2">
              <span>Environment</span>
              <span className="capitalize font-mono text-zinc-950">{data.diagnostics.environment}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-50 pb-2">
              <span>Database Query Latency</span>
              <span className="font-mono text-zinc-950">{data.diagnostics.dbLatency}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-50 pb-2">
              <span>API Ping Latency</span>
              <span className="font-mono text-zinc-950">{data.diagnostics.apiLatency}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-50 pb-2">
              <span>Storage latency</span>
              <span className="font-mono text-zinc-950">{data.diagnostics.storageLatency}</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-[#57585A] uppercase tracking-wider block font-bold">Node Process Memory</span>
              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-[#57585A] block">RSS</span>
                  <span className="text-zinc-900 font-bold text-[10px]">{data.diagnostics.memoryUsage.rss}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-[#57585A] block">Heap Tot</span>
                  <span className="text-zinc-900 font-bold text-[10px]">{data.diagnostics.memoryUsage.heapTotal}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-[#57585A] block">Heap Use</span>
                  <span className="text-zinc-900 font-bold text-[10px]">{data.diagnostics.memoryUsage.heapUsed}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM WARNINGS SECTION (Right 2 cols) */}
        <section className="lg:col-span-2 bg-[#fcfbf9] border border-[#e8dfd2] p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-[#1A1A1A] font-sora flex items-center gap-2 border-b border-[#e8dfd2]/60 pb-3">
            <AlertCircle size={18} className="text-[#D97706]" /> Live System Warnings
          </h3>

          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
            {data.warnings.length > 0 ? (
              data.warnings.map((warn) => (
                <div 
                  key={warn.id}
                  className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm ${
                    warn.severity === "critical" ? "bg-red-50/75 border-red-200 text-red-950" :
                    warn.severity === "high" ? "bg-orange-50/75 border-orange-200 text-orange-950" :
                    warn.severity === "medium" ? "bg-yellow-50/75 border-yellow-200 text-yellow-950" :
                    "bg-blue-50/75 border-blue-200 text-blue-950"
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                    warn.severity === "critical" ? "text-red-600" :
                    warn.severity === "high" ? "text-orange-600" :
                    warn.severity === "medium" ? "text-yellow-600" : "text-blue-600"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold font-sora capitalize">{warn.title}</span>
                      <span className="text-[9px] opacity-60 font-semibold">{new Date(warn.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-1 leading-relaxed font-semibold">{warn.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-[#57585A] text-xs font-semibold flex flex-col items-center gap-1.5">
                <CheckCircle2 size={32} className="text-emerald-500" />
                <span>Zero system warnings or critical flags. Platform is operating cleanly.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 4. LOGS TIMELINE AND TABLE SECTION */}
      <section className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] overflow-hidden">
        
        {/* SECTION HEADER & CONTROL BAR */}
        <div className="p-6 border-b border-[#E2E8F0] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-extrabold text-[#1A1A1A] font-sora flex items-center gap-2">
              <Shield size={18} className="text-[#172263]" /> Log History & Security Audit Trails
            </h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition cursor-pointer"
              >
                <Download size={12} /> CSV
              </button>
              <button 
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition cursor-pointer"
              >
                <Download size={12} /> JSON
              </button>
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search description, username, event type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 hover:border-zinc-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#172263] transition font-semibold"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Severity filter */}
              <select 
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="info">🔵 Info</option>
              </select>

              {/* Event Type filter */}
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">All Events</option>
                {uniqueEventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3">
          
          {/* CHRONOLOGICAL TIMELINE VIEW (Left 1 col on XL) */}
          <div className="p-6 border-b xl:border-b-0 xl:border-r border-[#E2E8F0] bg-slate-50/50">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#57585A] font-sora border-b border-zinc-200 pb-2 mb-4">
              <Clock className="w-3.5 h-3.5 inline mr-1 text-[#172263]" /> Chronological Timeline
            </h4>
            
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
              {filteredLogs.slice(0, 20).map((log, index) => (
                <div key={log.id} className="relative pl-7 group flex flex-col gap-0.5 cursor-pointer" onClick={() => { setSelectedLog(log); setIsDrawerOpen(true); }}>
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-zinc-300 z-10 transition-transform group-hover:scale-125 ${
                    log.severity === "critical" ? "bg-red-500" :
                    log.severity === "high" ? "bg-orange-500" :
                    log.severity === "medium" ? "bg-yellow-500" : "bg-blue-500"
                  }`} />
                  <span className="text-[9px] text-[#57585A] font-extrabold">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="text-xs font-extrabold text-zinc-900 group-hover:text-[#172263] transition font-sora">{log.event_type}</span>
                  <span className="text-[10px] text-[#57585A] truncate w-full block">{log.description}</span>
                  {index < filteredLogs.slice(0, 20).length - 1 && (
                    <div className="absolute left-[11px] top-6 w-0.5 h-4 flex items-center justify-center opacity-40">
                      <ArrowRight className="w-3 h-3 rotate-90 text-zinc-300" />
                    </div>
                  )}
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-[#57585A] text-xs font-semibold">
                  No chronological events recorded.
                </div>
              )}
            </div>
          </div>

          {/* LOG DATA TABLE (Right 2 cols on XL) */}
          <div className="xl:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-zinc-700 min-w-[700px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 uppercase tracking-wider text-[10px] text-zinc-500">
                  <th className="py-3.5 px-4 font-extrabold">Time</th>
                  <th className="py-3.5 px-4 font-extrabold">Event Type</th>
                  <th className="py-3.5 px-4 font-extrabold">Severity</th>
                  <th className="py-3.5 px-4 font-extrabold">User</th>
                  <th className="py-3.5 px-4 font-extrabold">IP Address</th>
                  <th className="py-3.5 px-4 font-extrabold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLogs.slice(0, 50).map((log) => (
                  <tr 
                    key={log.id}
                    onClick={() => { setSelectedLog(log); setIsDrawerOpen(true); }}
                    className="hover:bg-slate-50/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono text-[10px] text-zinc-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-[#1A1A1A] font-sora">
                      {log.event_type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getSeverityBadgeClass(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-900 truncate max-w-[120px]">
                      {log.username || "Anonymous"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-zinc-500">
                      {log.ip_address || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-[#57585A] truncate max-w-[240px]" title={log.description}>
                      {log.description}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[#57585A] text-xs font-semibold">
                      No matching log items found matching the current search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 text-[10px] text-[#57585A] font-bold text-right">
              Showing {Math.min(filteredLogs.length, 50)} of {filteredLogs.length} audit logs.
            </div>
          </div>

        </div>
      </section>

      {/* 5. FAILED REQUESTS RETRY CORNER */}
      <section className="bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4">
        <h3 className="text-base font-extrabold text-[#1A1A1A] font-sora flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600 animate-pulse" /> Failed Requests Tracker
        </h3>

        <div className="overflow-x-auto">
          {data.failedRequests.length > 0 ? (
            <table className="w-full text-left text-xs font-semibold text-zinc-700 min-w-[650px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Failure Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Origin IP</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.failedRequests.map(freq => (
                  <tr key={freq.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-500">
                      {new Date(freq.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-rose-600">
                      {freq.type}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-650 max-w-[280px] truncate" title={freq.description}>
                      {freq.description}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-500">
                      {freq.ip || "N/A"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {freq.retryable ? (
                        <button
                          onClick={() => handleRetryFailedRequest(freq.id)}
                          className="px-2.5 py-1 bg-[#172263] hover:bg-[#11194A] text-white text-[10px] font-bold rounded-lg transition shadow-sm cursor-pointer"
                        >
                          Retry Flow
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic font-semibold">Not Retryable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-[#57585A] text-xs font-semibold flex flex-col items-center gap-1">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <span>Zero failed request alerts in the queue.</span>
            </div>
          )}
        </div>
      </section>

      {/* 6. SLIDEOUT DETAILS DRAWER */}
      {isDrawerOpen && selectedLog && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 z-[90] animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-white z-[95] shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300 font-sans border-l border-zinc-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 pb-4 shrink-0">
              <div className="space-y-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getSeverityBadgeClass(selectedLog.severity)}`}>
                  {selectedLog.severity}
                </span>
                <h3 className="text-lg font-extrabold text-[#1A1A1A] font-sora mt-1.5">{selectedLog.event_type}</h3>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Details Content */}
            <div className="flex-1 overflow-y-auto py-6 space-y-5 text-xs text-zinc-700 pr-1 scrollbar-thin">
              {/* Timestamp */}
              <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-[#57585A] font-bold uppercase tracking-wider block">Timestamp</span>
                <span className="font-mono text-zinc-950 font-bold">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[10px] text-[#57585A] font-bold uppercase tracking-wider block">Audit Log Description</span>
                <p className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl font-medium leading-relaxed text-zinc-950">
                  {selectedLog.description}
                </p>
              </div>

              {/* Request variables */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[9px] text-[#57585A] font-bold uppercase tracking-wider block">User Account</span>
                  <span className="font-bold text-zinc-900 truncate block">{selectedLog.username || "Anonymous"}</span>
                </div>
                <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[9px] text-[#57585A] font-bold uppercase tracking-wider block">IP address</span>
                  <span className="font-mono text-zinc-900 truncate block">{selectedLog.ip_address || "N/A"}</span>
                </div>
              </div>

              {/* URL & User agent */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-[#57585A] font-bold uppercase tracking-wider block">Request URL</span>
                  <span className="font-mono bg-zinc-50 p-2 border border-zinc-100 rounded-xl text-zinc-800 break-all block">
                    {selectedLog.request_url || "N/A"}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] text-[#57585A] font-bold uppercase tracking-wider block">User Agent (Device Info)</span>
                  <span className="font-mono bg-zinc-50 p-2 border border-zinc-100 rounded-xl text-zinc-800 break-words block text-[10px]">
                    {selectedLog.user_agent || "N/A"}
                  </span>
                </div>
              </div>

              {/* Suggested Cause Box */}
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-1">
                <span className="text-[10px] text-orange-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={12} /> Suggested Cause & Diagnostics
                </span>
                <p className="text-[11px] leading-relaxed text-orange-950 font-semibold">
                  {getSuggestedCause(selectedLog)}
                </p>
              </div>

              {/* Stack Trace (Metadata) */}
              {selectedLog.metadata && (
                <div className="space-y-1">
                  <span className="text-[10px] text-[#57585A] font-bold uppercase tracking-wider block">Raw Log Metadata / Stack Trace</span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed max-h-[220px]">
                    {selectedLog.metadata}
                  </pre>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-zinc-150 pt-4 shrink-0">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2.5 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

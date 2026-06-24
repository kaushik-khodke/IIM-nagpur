import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Navbar } from "./shared";
import { useTranslation } from "react-i18next";
import { 
  Tractor, 
  FileText, 
  MessageSquare, 
  Clock, 
  ArrowLeft, 
  Search, 
  AlertCircle
} from "lucide-react";

export function ActivityPage() {
  const { t } = useTranslation(["dashboard", "common", "static"]);
  const navigate = useNavigate();
  const token = localStorage.getItem("tractorsewa_token");
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "listings" | "requests" | "chats">("all");

  useEffect(() => {
    if (!token) {
      navigate("/dashboard?auth_required=true&redirect_path=/activity");
      return;
    }

    const fetchActivities = async () => {
      try {
        let userProfile: any = null;
        const userRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
          userProfile = await userRes.json();
        } else {
          navigate("/dashboard?auth_required=true&redirect_path=/activity");
          return;
        }

        const newActivities: any[] = [];

        // 1. Fetch Harvesters
        const harvsRes = await fetch('/api/harvesters');
        const harvsData = harvsRes.ok ? await harvsRes.json() : [];
        const userHarvs = harvsData.filter((h: any) => h.ownerName === userProfile.name || h.userId === userProfile.id);
        userHarvs.forEach((h: any) => {
          newActivities.push({
            id: `harv-${h.id}`,
            type: "listings",
            icon: <Tractor size={16} className="text-blue-500" />,
            key: "activityHarvesterLive",
            params: { name: h.machineName },
            text: `Your machine "${h.machineName}" listing is live`,
            timeKey: "status.active",
            timeNs: "static",
            timestamp: h.id * 1000 || Date.now() - 86400000,
          });
        });

        // 2. Fetch User Requests
        const reqsRes = await fetch('/api/requests?userId=me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          reqsData.forEach((r: any) => {
            newActivities.push({
              id: `req-${r.id}`,
              type: "requests",
              icon: <FileText size={16} className="text-[#172263]" />,
              key: "activityRequirementLive",
              params: { type: r.machineType, location: r.location },
              text: `Your ${r.machineType} requirement in ${r.location} is live`,
              timeKey: "status.active",
              timeNs: "static",
              timestamp: r.id * 1000 || Date.now() - 172800000,
            });
          });
        }

        // 3. Fetch messages / chats
        const msgsRes = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (msgsRes.ok) {
          const partnersData = await msgsRes.json();
          partnersData.forEach((p: any) => {
            if (p.lastMessage) {
              newActivities.push({
                id: `msg-${p.id}`,
                type: "chats",
                icon: <MessageSquare size={16} className="text-[#D97706]" />,
                key: "activityNewChat",
                params: { name: p.name },
                text: `New chat with ${p.name}`,
                time: "Recent",
                timestamp: p.lastMessageTime ? new Date(p.lastMessageTime).getTime() : Date.now() - 43200000,
                lastMessage: p.lastMessage,
                partnerName: p.name,
                partnerId: p.id,
              });
            }
          });
        }

        // Sort descending by timestamp
        newActivities.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(newActivities);
      } catch (err) {
        console.error("Error loading activity logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [token, navigate]);

  // Format date display helper
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and Search logic
  const filteredActivities = activities.filter(act => {
    const actText = act.key ? t(act.key, { ...act.params, defaultValue: act.text }) : act.text;
    const matchesSearch = actText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (act.lastMessage?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                          (act.partnerName?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" ? true : act.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden font-sans">
      <Navbar variant="auth" />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 max-w-[1200px] pb-16 font-sans">
        {/* Header Navigation */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-[#172263] hover:underline mb-4 cursor-pointer animate-in fade-in"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-black text-[#172263] tracking-tight font-sora">
            Activity Log
          </h1>
          <p className="text-xs text-[#57585A] mt-1">
            Track your interactions, fleet listings, crop requests, and message negotiations in real time.
          </p>
        </div>

        {/* Toolbar: Search and Filter Tabs */}
        <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          {/* Search input */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#172263]"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl w-fit">
            {[
              { id: "all", label: "All Logs" },
              { id: "listings", label: "Listings" },
              { id: "requests", label: "Requests" },
              { id: "chats", label: "Conversations" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${filterType === tab.id ? 'bg-white shadow-xs text-[#172263]' : 'text-[#57585A] hover:text-[#172263]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main List Container */}
        <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-[#172263] rounded-full animate-spin" />
              <span className="text-xs text-gray-500 font-semibold">Loading your activity logs...</span>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="space-y-4">
              {filteredActivities.map((act, index) => {
                const actText = act.key ? t(act.key, { ...act.params, defaultValue: act.text }) : act.text;
                
                return (
                  <motion.div 
                    key={act.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.4) }}
                    className="flex gap-4 items-start p-4 bg-[#F8FAFC] border border-[#E2E8F0]/50 rounded-2xl hover:border-[#172263]/20 hover:bg-[#EAEFF8]/20 transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-xs">
                      {act.icon}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1A1A1A] leading-tight">
                        {actText}
                      </p>
                      
                      {act.type === "chats" && act.lastMessage && (
                        <p className="text-[10px] text-gray-400 mt-1 italic truncate pl-1 border-l-2 border-slate-200 bg-white/50 py-1 px-2 rounded">
                          "{act.lastMessage}"
                        </p>
                      )}
                      
                      <p className="text-[9px] text-[#57585A] font-bold mt-2 flex items-center gap-1">
                        <Clock size={10} className="text-[#D97706]" /> 
                        {formatDate(act.timestamp)}
                      </p>
                    </div>

                    {act.type === "chats" && (
                      <button 
                        onClick={() => navigate(`/messages?userId=${act.partnerId}`)}
                        className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#172263] rounded-lg text-[10px] font-bold shadow-2xs cursor-pointer transition-colors"
                      >
                        Reply
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
              <AlertCircle className="text-gray-300 w-12 h-12 mb-3" />
              <h3 className="text-sm font-bold text-gray-700">No logs found</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                There are no activity logs matching your current filters. Try searching for something else or clearing the search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

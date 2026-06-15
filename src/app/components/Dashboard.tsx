import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  Tractor,
  Users,
  Search,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  MessageSquare,
  MapPin,
  Heart,
  LayoutGrid,
  User,
  Activity,
  Map,
  UserCheck,
  Inbox,
  Star,
} from "lucide-react";
import {
  Navbar,
  OperatorCard,
  HarvesterCard,
  SkeletonCard,
  WheatWatermark,
  AuthChooserDialog,
} from "./shared";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function Dashboard() {
  const { t } = useTranslation(["dashboard"]);
  const [operators, setOperators] = useState<any[]>([]);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [userName, setUserName] = useState("User");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGreeting, setShowGreeting] = useState(() => {
    return sessionStorage.getItem("greeting_shown") !== "true";
  });
  const [userScore, setUserScore] = useState<string | null>(null);
  const [scoreCount, setScoreCount] = useState<number>(0);

  useEffect(() => {
    if (showGreeting) {
      const timer = setTimeout(() => {
        setShowGreeting(false);
        sessionStorage.setItem("greeting_shown", "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showGreeting]);

  // URL query params
  const [searchParams, setSearchParams] = useSearchParams();
  const authRequired = searchParams.get("auth_required") === "true";
  const redirectPath = searchParams.get("redirect_path") || "";

  // Preview / Chooser State
  const [chooserOpen, setChooserOpen] = useState(false);
  const isPreview = localStorage.getItem("tractorsewa_preview_mode") === "true";

  const navigate = useNavigate();

  useEffect(() => {
    if (authRequired) {
      window.dispatchEvent(
        new CustomEvent("trigger-auth-required", {
          detail: { redirectPath },
        })
      );
      // Clean up search parameters from the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("auth_required");
      newParams.delete("redirect_path");
      setSearchParams(newParams, { replace: true });
    }
  }, [authRequired, redirectPath, searchParams, setSearchParams]);

  useEffect(() => {
    const token = localStorage.getItem("tractorsewa_token");
    const fetchData = async () => {
      try {
        let userProfile: any = null;
        if (token) {
          const userRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            userProfile = await userRes.json();
            if (userProfile.role === 'admin') {
              navigate('/admin', { replace: true });
              return;
            }
            setUserName(userProfile.name);
            setCurrentUser(userProfile);
          }

          const scoreRes = await fetch('/api/ratings/my-score', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (scoreRes.ok) {
            const scoreData = await scoreRes.json();
            setUserScore(scoreData.averageRating);
            setScoreCount(scoreData.count);
          }
        }

        const opsRes = await fetch('/api/operators?limit=6');
        const opsData = opsRes.ok ? await opsRes.json() : [];
        setOperators(opsData);

        const harvsRes = await fetch('/api/harvesters?limit=6');
        const harvsData = harvsRes.ok ? await harvsRes.json() : [];
        setHarvesters(harvsData);

        if (token) {
          const allReqsRes = await fetch('/api/requests?limit=4', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (allReqsRes.ok) {
            setRecentRequests(await allReqsRes.json());
          }
        }

        // Build dynamic activity feed
        const newActivities: any[] = [];
        if (userProfile && token) {
          // 1. Check user's harvesters
          const userHarvs = harvsData.filter((h: any) => h.ownerName === userProfile.name);
          userHarvs.forEach((h: any) => {
            newActivities.push({
              icon: <Tractor size={14} className="text-blue-500" />,
              text: `Your machine "${h.machineName}" listing is live`,
              time: "Active",
              timestamp: h.id * 1000,
            });
          });

          // 2. Check user's requests
          const reqsRes = await fetch('/api/requests?userId=me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reqsRes.ok) {
            const reqsData = await reqsRes.json();
            reqsData.forEach((r: any) => {
              newActivities.push({
                icon: <FileText size={14} className="text-[#172263]" />,
                text: `Your ${r.machineType} requirement in ${r.location} is live`,
                time: "Open",
                timestamp: r.id * 1000,
              });
            });
          }

          // 3. Check messages
          const msgsRes = await fetch('/api/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (msgsRes.ok) {
            const partnersData = await msgsRes.json();
            partnersData.forEach((p: any) => {
              if (p.lastMessage) {
                newActivities.push({
                  icon: <MessageSquare size={14} className="text-blue-500" />,
                  text: `New chat with ${p.name}`,
                  time: "Recent",
                  timestamp: p.lastMessageTime ? new Date(p.lastMessageTime).getTime() : 0,
                });
              }
            });
          }
        }

        // Sort desc by timestamp
        newActivities.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(newActivities.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userName]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <Navbar variant="auth" />

      {isPreview && (
        <div className="bg-blue-50 border-b border-blue-200 text-orange-800 px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
          <span>You are viewing the dashboard in Guest Preview Mode.</span>
          <button
            onClick={() => setChooserOpen(true)}
            className="px-3 py-1 bg-[#172263] text-white hover:bg-[#11194A] transition-colors rounded-lg text-xs font-semibold cursor-pointer"
          >
            Log In / Sign Up
          </button>
        </div>
      )}

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 max-w-[1600px] pb-16 md:pb-8">
        {/* Greeting Row */}
        {showGreeting && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white text-base font-bold shadow-sm ring-2 ring-blue-100">
                {currentUser?.name ? currentUser.name.charAt(0) : "U"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A] font-sora">
                  Hello, {currentUser?.name || "Farmer Bob"}!
                </h1>
                <p className="text-xs text-[#57585A]">Welcome back to your farming hub</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row (Full Width) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Stat 1: Active Machines */}
          <div className="bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 mb-2">
              <Activity size={18} />
            </div>
            <div>
              <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">Active Machines</span>
              <span className="text-2xl font-black text-[#172263] font-sora">{harvesters.length || 0}</span>
            </div>
            <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0 text-[#172263]" />
          </div>

          {/* Stat 2: My Rating */}
          <div className="bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center text-[#D97706] mb-2">
              <Star size={18} />
            </div>
            <div>
              <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">My Rating</span>
              {userScore !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#172263] font-sora">{userScore}</span>
                  <span className="text-[#D97706] text-sm font-bold">★</span>
                  <span className="text-[#57585A] text-xs">({scoreCount} {scoreCount === 1 ? 'rating' : 'ratings'})</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-[#57585A] block leading-snug">
                  You are yet to receive any score
                </span>
              )}
            </div>
            <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0 text-[#172263]" />
          </div>

          {/* Stat 3: Connections / Operators */}
          <div className="bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#172263]/10 flex items-center justify-center text-[#172263] mb-2">
              <UserCheck size={18} />
            </div>
            <div>
              <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">Verified Operators</span>
              <span className="text-2xl font-black text-[#172263] font-sora">{operators.length || 0}</span>
            </div>
            <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0 text-[#172263]" />
          </div>

          {/* Stat 4: Enquiries */}
          <div className="bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#172263]/10 flex items-center justify-center text-[#172263] mb-2">
              <Inbox size={18} />
            </div>
            <div>
              <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">Messages/Activity</span>
              <span className="text-2xl font-black text-[#172263] font-sora">{activities.length || 0}</span>
            </div>
            <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0 text-[#172263]" />
          </div>
        </div>

        {/* Main Two-Column Layout for lower content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-col-reverse lg:flex-row">

          {/* Left Column (Available Listings) */}
          <div className="lg:col-span-8 space-y-4 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#1A1A1A] font-sora">Available Listings</h2>
              <Link to="/harvesters" className="text-xs font-bold text-[#172263] hover:underline">View All</Link>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : harvesters.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E2E8F0] text-sm text-[#57585A]">
                No harvesters found in your area. Be the first to add one!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {harvesters.slice(0, 6).map((h) => (
                  <div key={h.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      {/* Image area */}
                      <div className="h-36 bg-[#F4F6FA] relative flex items-center justify-center overflow-hidden">
                        {h.imagePath ? (
                          <img src={h.imagePath} alt={h.machineName} className="w-full h-full object-cover" />
                        ) : (
                          <Tractor size={48} className="text-blue-300" />
                        )}
                        <button onClick={() => toast.success("Added to favorites! ❤️")} className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/95 text-[#57585A] hover:text-red-500 rounded-full flex items-center justify-center border border-[#E2E8F0] shadow-sm z-10">
                          <Heart size={13} />
                        </button>
                      </div>
                      {/* Info area */}
                      <div className="p-4 space-y-2">
                        <span className="text-[8px] uppercase font-black tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          {h.company}
                        </span>
                        <h3 className="text-sm font-bold text-[#1A1A1A] font-sora truncate">{h.machineName}</h3>

                        <p className="text-[10px] text-[#57585A] flex items-center gap-1">
                          <MapPin size={10} className="text-[#172263]" /> {h.location}, {h.state}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      <Link to={`/harvesters/${h.id}`} className="w-full py-2 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl flex items-center justify-center transition-colors">
                        Book Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (Summary & Widgets) */}
          <div className="lg:col-span-4 order-1 lg:order-2 h-full">
            <div className="flex flex-col h-full space-y-4">

              {/* Aligning Header (Matches Left Column) */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[#1A1A1A] font-sora">Recent Requests</h2>
                <Link to="/requests" className="text-xs font-bold text-[#172263] hover:underline">View All</Link>
              </div>

              {/* Requests List Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm space-y-4">
                {recentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {recentRequests.map((req, i) => (
                      <Link key={i} to={`/requests/${req.id}`} className="flex gap-3 items-start bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]/40 hover:border-[#172263]/30 hover:bg-[#EAEFF8] transition-all duration-200 cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white shrink-0 relative overflow-hidden">
                          <FileText size={18} className="text-white/90" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-semibold text-[#1A1A1A] truncate pr-2 group-hover:text-[#172263] transition-colors">{req.type} - {req.machineType}</h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">{req.status || "Open"}</span>
                          </div>
                          <p className="text-xs text-[#57585A] flex items-center gap-1 truncate">
                            <MapPin size={10} className="text-[#E82326]" /> {req.location}, {req.state}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-[#57585A]">
                    {localStorage.getItem("tractorsewa_token") ? "No recent requests found." : "Please log in to view requests."}
                  </div>
                )}
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm flex flex-col flex-1">
                <h3 className="text-base font-bold text-[#1A1A1A] font-sora border-b border-[#E2E8F0] pb-4 mb-6">Recent Activity</h3>
                {activities.length > 0 ? (
                  <div className="space-y-6">
                    {activities.map((act, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          {act.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{act.text}</p>
                          <p className="text-xs text-[#57585A] mt-1">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-[#57585A] text-center">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <AuthChooserDialog
        isOpen={chooserOpen}
        onClose={() => setChooserOpen(false)}
        initialMode="login"
      />
    </div>
  );
}

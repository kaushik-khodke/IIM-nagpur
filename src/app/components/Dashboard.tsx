import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  LayoutGrid,
  User,
  Activity,
  Map,
  UserCheck,
  Inbox,
  Star,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
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

import districtsData from "./districts.json";

const INDIAN_STATES = districtsData.states.map((s: any) => s.state);

export function Dashboard() {
  const { t } = useTranslation(["dashboard", "common", "pages", "static"]);
  const [operators, setOperators] = useState<any[]>([]);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [userName, setUserName] = useState("User");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Directory state
  const [dirSearch, setDirSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dirCategory, setDirCategory] = useState<"all" | "harvester" | "operator">("all");
  const [dirState, setDirState] = useState("");
  const [dirDistrict, setDirDistrict] = useState("");
  const [dirSortBy, setDirSortBy] = useState<"nameAsc" | "nameDesc" | "dateNewest" | "ratingHighest">("dateNewest");
  const [directoryItems, setDirectoryItems] = useState<any[]>([]);
  const [dirLoading, setDirLoading] = useState(true);
  const [dirLimit, setDirLimit] = useState(8);

  const [showGreeting, setShowGreeting] = useState(() => {
    return sessionStorage.getItem("greeting_shown") !== "true";
  });
  const [userScore, setUserScore] = useState<string | null>(null);
  const [scoreCount, setScoreCount] = useState<number>(0);
  const [myHarvestersCount, setMyHarvestersCount] = useState<number>(0);
  const [myOperatorsCount, setMyOperatorsCount] = useState<number>(0);

  const [activeMachinesTab, setActiveMachinesTab] = useState<'harvesters' | 'requests'>('harvesters');
  const [myRequestsCount, setMyRequestsCount] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [openLogRequestId, setOpenLogRequestId] = useState<string | null>(null);
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestFilterType, setRequestFilterType] = useState<"all" | "harvester" | "operator">("all");

  const formatLocation = (location?: string, state?: string) => {
    const cleanLoc = location && location !== "undefined" && !location.includes("undefined") && !location.includes("conties") ? location : "";
    const cleanState = state && state !== "undefined" && !state.includes("undefined") && !state.includes("states") ? state : "";
    if (cleanLoc && cleanState) return `${cleanLoc}, ${cleanState}`;
    return cleanLoc || cleanState || "Maharashtra";
  };

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
  const token = localStorage.getItem("tractorsewa_token");
  const role = localStorage.getItem("tractorsewa_user_role");
  const isPreview = !token && localStorage.getItem("tractorsewa_preview_mode") === "true";

  const navigate = useNavigate();

  useEffect(() => {
    if (token && role === "admin") {
      navigate('/admin', { replace: true });
    }
  }, [token, role, navigate]);

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

  if (token && role === "admin") {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-[#172263] rounded-full animate-spin" />
      </div>
    );
  }

  useEffect(() => {
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

          if (userProfile) {
            const myHarvsRes = await fetch('/api/harvesters', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myHarvsRes.ok) {
              const allHarvs = await myHarvsRes.json();
              const count = allHarvs.filter((h: any) => h.userId === userProfile.id).length;
              setMyHarvestersCount(count);
            }

            const myOpsRes = await fetch(`/api/operators?userId=${userProfile.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myOpsRes.ok) {
              const allOps = await myOpsRes.json();
              setMyOperatorsCount(allOps.length);
            }
          }
        }

        const opsRes = await fetch('/api/operators?limit=6');
        const opsData = opsRes.ok ? await opsRes.json() : [];
        setOperators(opsData);

        const harvsRes = await fetch('/api/harvesters?limit=6');
        const harvsData = harvsRes.ok ? await harvsRes.json() : [];
        setHarvesters(harvsData);

        if (token) {
          const allReqsRes = await fetch('/api/requests?limit=20', {
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
              key: "activityHarvesterLive",
              params: { name: h.machineName },
              timeKey: "status.active",
              timeNs: "static",
              timestamp: h.id * 1000,
            });
          });

          // 2. Check user's requests
          const reqsRes = await fetch('/api/requests?userId=me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reqsRes.ok) {
            const reqsData = await reqsRes.json();
            setMyRequestsCount(reqsData.length);
            reqsData.forEach((r: any) => {
              newActivities.push({
                icon: <FileText size={14} className="text-[#172263]" />,
                key: "activityRequirementLive",
                params: { type: r.machineType, location: r.location },
                timeKey: "status.active",
                timeNs: "static",
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
                  key: "activityNewChat",
                  params: { name: p.name },
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

  // Sync debounced search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDirSearch(searchTerm);
      setDirLimit(8);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync searchTerm when dirSearch changes externally
  useEffect(() => {
    if (dirSearch !== searchTerm) {
      setSearchTerm(dirSearch);
    }
  }, [dirSearch]);

  // Directory fetching
  useEffect(() => {
    const fetchDirectory = async () => {
      setDirLoading(true);
      try {
        let fetchedHarvesters: any[] = [];
        let fetchedOperators: any[] = [];

        // Build query params
        const params = new URLSearchParams();
        if (dirSearch) params.append("search", dirSearch);
        if (dirState) params.append("state", dirState);
        if (dirDistrict) params.append("location", dirDistrict);
        params.append("limit", String(dirLimit));

        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const promises: Promise<any>[] = [];

        if (dirCategory === "all" || dirCategory === "harvester") {
          promises.push(
            fetch(`/api/harvesters?${params.toString()}`, { headers })
              .then((res) => (res.ok ? res.json() : []))
              .then((data) => {
                fetchedHarvesters = data.map((item: any) => ({
                  ...item,
                  id: item.id,
                  name: item.machineName,
                  subtitle: item.ownerName,
                  image: item.imagePath,
                  ownerImage: item.ownerProfilePic,
                  type: "harvester",
                  ownerId: item.userId,
                }));
              })
              .catch(() => {})
          );
        }

        if (dirCategory === "all" || dirCategory === "operator") {
          promises.push(
            fetch(`/api/operators?${params.toString()}`, { headers })
              .then((res) => (res.ok ? res.json() : []))
              .then((data) => {
                fetchedOperators = data.map((item: any) => ({
                  ...item,
                  id: item.id,
                  name: item.name,
                  subtitle: item.name,
                  image: item.image_path,
                  ownerImage: item.image_path,
                  type: "operator",
                  ownerId: item.user_id,
                }));
              })
              .catch(() => {})
          );
        }

        await Promise.all(promises);

        // Merge items
        let merged = [...fetchedHarvesters, ...fetchedOperators];

        // Apply sorting
        merged.sort((a, b) => {
          if (dirSortBy === "nameAsc") {
            return a.name.localeCompare(b.name);
          } else if (dirSortBy === "nameDesc") {
            return b.name.localeCompare(a.name);
          } else if (dirSortBy === "ratingHighest") {
            return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
          } else {
            // dateNewest (sort by id DESC)
            return b.id - a.id;
          }
        });

        setDirectoryItems(merged);
      } catch (err) {
        console.error("Error loading directory items:", err);
      } finally {
        setDirLoading(false);
      }
    };

    fetchDirectory();
  }, [dirSearch, dirCategory, dirState, dirDistrict, dirSortBy, dirLimit, token]);

  const handleBookingClick = (ownerId: number | string) => {
    if (!token) {
      setChooserOpen(true);
    } else {
      navigate(`/messages?userId=${ownerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <Navbar variant="auth" />

      {isPreview && (
        <div className="bg-blue-50 border-b border-blue-200 text-orange-800 px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
          <span>{t("previewModeMessage", { defaultValue: "You are viewing the dashboard in Guest Preview Mode." })}</span>
          <button
            onClick={() => setChooserOpen(true)}
            className="px-3 py-1 bg-[#172263] text-white hover:bg-[#11194A] transition-colors rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t("nav.login", { ns: "common", defaultValue: "Log In" })} / {t("nav.register", { ns: "common", defaultValue: "Sign Up" })}
          </button>
        </div>
      )}

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 max-w-[1600px] pb-16 md:pb-8 font-sans">
        
        {token && (
          <>
            {/* Hello Greeting Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-[#172263] tracking-tight font-sora">
                  Hello, Operator!
                </h1>
                <p className="text-xs text-[#57585A] mt-1">Manage your farming fleet, reviews, and active requests.</p>
              </div>
              {currentUser && (
                <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] shadow-xs px-4 py-2 rounded-2xl">
                  <Avatar className="w-9 h-9 rounded-full shadow-xs ring-2 ring-blue-50">
                    {currentUser?.image_path ? <AvatarImage src={currentUser.image_path} alt={currentUser.name} /> : null}
                    <AvatarFallback className="bg-[#172263] text-white font-bold text-sm">
                      {currentUser?.name ? currentUser.name.charAt(0) : "O"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#1A1A1A]">{currentUser.name}</p>
                    <p className="text-[10px] text-[#57585A] capitalize">{currentUser.role}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Row (4 Columns Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              
              {/* Card 1: Active Machines */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-48 relative overflow-hidden transition-all hover:shadow-md">
                <div>
                  <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-2">ACTIVE MACHINES</span>
                  {/* Harvester / Request Tabs */}
                  <div className="flex bg-[#F1F5F9] p-1 rounded-xl w-fit mb-3">
                    <button
                      onClick={() => setActiveMachinesTab('harvesters')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${activeMachinesTab === 'harvesters' ? 'bg-white shadow-xs text-[#172263]' : 'text-[#57585A] hover:text-[#172263]'}`}
                    >
                      Harvesters
                    </button>
                    <button
                      onClick={() => setActiveMachinesTab('requests')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${activeMachinesTab === 'requests' ? 'bg-white shadow-xs text-[#172263]' : 'text-[#57585A] hover:text-[#172263]'}`}
                    >
                      Requests
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-[#172263] font-sora">
                      {activeMachinesTab === 'harvesters' 
                        ? (currentUser ? harvesters.filter((h: any) => h.userId === currentUser.id).length : harvesters.length || 0)
                        : myRequestsCount
                      }
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md">
                      +1
                    </span>
                  </div>
                </div>

                {/* Sparkline Graph */}
                <div className="mt-2 w-full h-12">
                  <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 22 Q 15 15, 30 25 T 60 10 T 80 18 T 100 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 0 22 Q 15 15, 30 25 T 60 10 T 80 18 T 100 8 L 100 30 L 0 30 Z"
                      fill="url(#sparklineGrad)"
                    />
                  </svg>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-[#57585A] font-medium border-t border-[#F1F5F9] pt-2 mt-1">
                  <span>Active</span>
                  <span>Past 6 months</span>
                </div>
              </div>

              {/* Card 2: My Rating */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-48 relative overflow-hidden transition-all hover:shadow-md">
                <div>
                  <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">MY RATING</span>
                  <div className="text-xl font-extrabold text-[#172263] font-sora mt-1">
                    {userScore !== null ? `${userScore} Score` : "Yet to receive"}
                  </div>
                </div>

                {/* Radial Gauge */}
                <div className="flex justify-center items-center my-1">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                      {/* Track circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="#E2E8F0"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="#172263"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray="163.36"
                        strokeDashoffset={163.36 - (163.36 * (userScore ? (parseFloat(userScore) / 5) * 100 : 0)) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-[10px] font-black text-[#172263]">
                      {userScore ? `${Math.round((parseFloat(userScore) / 5) * 100)}%` : "0%"}
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-[#57585A] font-semibold border-t border-[#F1F5F9] pt-2">
                  {scoreCount > 0 
                    ? `Based on ${scoreCount} ${scoreCount === 1 ? 'score given' : 'scores given'}` 
                    : "No scores given"}
                </div>
              </div>

              {/* Card 3: Total Listings */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-48 relative overflow-hidden transition-all hover:shadow-md">
                <div>
                  <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">TOTAL LISTINGS</span>
                  <span className="text-3xl font-black text-[#172263] font-sora">
                    {myHarvestersCount + myOperatorsCount}
                  </span>
                </div>

                {/* My Listings Breakdown Bar Chart */}
                <div className="flex justify-center items-end gap-6 h-12 px-2 mt-2">
                  {(() => {
                    const maxVal = Math.max(myHarvestersCount, myOperatorsCount, 1);
                    const items = [
                      { label: "Harvesters", value: myHarvestersCount },
                      { label: "Operators", value: myOperatorsCount }
                    ];
                    
                    return items.map((item, idx) => {
                      const pctHeight = (item.value / maxVal) * 32;
                      return (
                        <div key={idx} className="flex flex-col items-center w-20 group">
                          <div className="w-full bg-[#E2E8F0] rounded-sm h-9 flex items-end relative">
                            <div 
                              className="w-full bg-[#172263] rounded-sm transition-all duration-500 group-hover:bg-[#D97706]"
                              style={{ height: `${Math.max(4, pctHeight)}px` }}
                            />
                            {/* Hover tooltip showing actual value */}
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#172263] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.value}
                            </span>
                          </div>
                          <span className="text-[8px] text-[#57585A] font-semibold mt-1">{item.label}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Card 4: Messages / Activity */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-48 relative overflow-hidden transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">MESSAGES/ACTIVITY</span>
                    <span className="text-3xl font-black text-[#172263] font-sora">{activities.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#57585A]">
                    <button className="p-1 hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"><Search size={14} /></button>
                    <button className="p-1 hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"><Filter size={14} /></button>
                  </div>
                </div>

                {/* Minimal Activity list preview */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0]/40 rounded-xl p-2 h-16 overflow-y-auto space-y-1.5 mt-2">
                  {activities.slice(0, 2).map((act, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] text-[#1A1A1A] leading-tight truncate">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="truncate">{act.key ? t(act.key, { ...act.params, defaultValue: act.text }) : act.text}</span>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-[9px] text-[#57585A] text-center mt-2">No recent alerts</div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

        {/* Bottom Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Available Listings */}
          <div className={`${token ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-2">
              <h2 className="text-lg font-extrabold text-[#1A1A1A] font-sora">Available Listings</h2>
              {token && (
                <Link to="/harvesters" className="text-xs font-bold text-[#172263] hover:underline">
                  View All
                </Link>
              )}
            </div>

            {/* Filters Controls Panel */}
            <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                
                {/* Search input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search listings..."
                    className="w-full pl-8 pr-3 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#172263]"
                  />
                </div>

                {/* Category Type filter */}
                <select
                  value={dirCategory}
                  onChange={(e: any) => {
                    setDirCategory(e.target.value);
                    setDirLimit(8);
                  }}
                  className="px-2.5 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs font-bold text-[#57585A] cursor-pointer focus:outline-hidden"
                >
                  <option value="all">All Listings</option>
                  <option value="harvester">Harvesters</option>
                  <option value="operator">Operators</option>
                </select>

                {/* State selector */}
                <select
                  value={dirState}
                  onChange={(e) => {
                    setDirState(e.target.value);
                    setDirDistrict("");
                    setDirLimit(8);
                  }}
                  className="px-2.5 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs font-bold text-[#57585A] cursor-pointer focus:outline-hidden"
                >
                  <option value="">State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {t("states." + state, { ns: "static", defaultValue: state })}
                    </option>
                  ))}
                </select>

                {/* District selector */}
                <select
                  value={dirDistrict}
                  onChange={(e) => {
                    setDirDistrict(e.target.value);
                    setDirLimit(8);
                  }}
                  disabled={!dirState}
                  className="px-2.5 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs font-bold text-[#57585A] cursor-pointer focus:outline-hidden disabled:opacity-50"
                >
                  <option value="">District</option>
                  {dirState &&
                    districtsData.states
                      .find((s) => s.state === dirState)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>
                          {t("districts." + d, { ns: "static", defaultValue: d })}
                        </option>
                      ))}
                </select>

                {/* Sort dropdown */}
                <select
                  value={dirSortBy}
                  onChange={(e: any) => {
                    setDirSortBy(e.target.value);
                    setDirLimit(8);
                  }}
                  className="px-2.5 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs font-bold text-[#57585A] cursor-pointer focus:outline-hidden"
                >
                  <option value="dateNewest">Newest</option>
                  <option value="ratingHighest">Highest Rated</option>
                  <option value="nameAsc">Name (A-Z)</option>
                  <option value="nameDesc">Name (Z-A)</option>
                </select>

              </div>

              {/* Active Filter Badges & Clear button */}
              {(dirSearch || dirCategory !== "all" || dirState || dirDistrict) && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#E2E8F0]/60 items-center">
                  <span className="text-[10px] text-gray-400 font-bold mr-1">Active filters:</span>
                  {dirSearch && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      "{dirSearch}"
                      <button onClick={() => setDirSearch("")} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  {dirCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {dirCategory === "harvester" ? "Harvester" : "Operator"}
                      <button onClick={() => setDirCategory("all")} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  {dirState && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {t("states." + dirState, { ns: "static", defaultValue: dirState })}
                      <button onClick={() => { setDirState(""); setDirDistrict(""); }} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  {dirDistrict && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {t("districts." + dirDistrict, { ns: "static", defaultValue: dirDistrict })}
                      <button onClick={() => setDirDistrict("")} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setDirSearch("");
                      setDirCategory("all");
                      setDirState("");
                      setDirDistrict("");
                    }}
                    className="text-[10px] text-red-600 hover:text-red-700 font-bold ml-auto hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {dirLoading ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 ${token ? '' : 'xl:grid-cols-3'} gap-6`}>
                {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : directoryItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E8F0] text-sm text-[#57585A]">
                No listings found matching your criteria. Be the first to add one!
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${token ? '' : 'xl:grid-cols-3'} gap-6`}>
                  {directoryItems.slice(0, dirLimit).map((item) => (
                    <div 
                      key={`${item.type}-${item.id}`} 
                      className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-0.5"
                    >
                      {/* Card Body */}
                      <div className="p-5 flex flex-col sm:flex-row gap-5 flex-1">
                        
                        {/* Left Column: Image */}
                        <div className="w-full sm:w-[40%] flex flex-col shrink-0">
                          <div className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-full min-h-[180px] rounded-2xl bg-[#F4F6FA] border border-[#E2E8F0]/30 overflow-hidden flex items-center justify-center">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.src = "";
                                  e.currentTarget.className = "hidden";
                                }}
                              />
                            ) : null}
                            {!item.image && (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                {item.type === "harvester" ? (
                                  <Tractor className="w-10 h-10 text-[#172263]/20" />
                                ) : (
                                  <Users className="w-10 h-10 text-[#15803D]/20" />
                                )}
                              </div>
                            )}
                            
                            {/* Type Badge */}
                            <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wide ${
                              item.type === "harvester" 
                                ? "bg-blue-50 text-blue-700 border-blue-100" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {item.type === "harvester" ? "Harvester" : "Operator"}
                            </span>
                          </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="w-full sm:w-[60%] flex flex-col justify-between pl-0">
                          <div>
                            {/* Title & Location */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 
                                  className="text-base font-black text-[#172263] font-sora line-clamp-1 group-hover:text-[#11194A] transition-colors"
                                  style={{ fontFamily: "'Sora', sans-serif" }}
                                >
                                  {item.name}
                                </h3>
                                <p className="text-gray-500 text-[10px] flex items-center gap-1 mt-1 font-semibold">
                                  <MapPin size={11} className="text-[#D97706] shrink-0" />
                                  <span className="line-clamp-1">{formatLocation(item.location, item.state)}</span>
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            {item.description && (
                              <p className="text-gray-400 text-[10px] line-clamp-2 mt-2 leading-relaxed italic">
                                {item.description}
                              </p>
                            )}

                            {/* Technical Details Grid */}
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-3 border-y border-[#E2E8F0]/80 my-3">
                              {item.type === "harvester" ? (
                                <>
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">
                                      Company
                                    </span>
                                    <span className="text-xs font-black text-[#1A1A1A] block mt-0.5">{item.company}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">
                                      Model
                                    </span>
                                    <span className="text-xs font-black text-[#1A1A1A] block mt-0.5">{item.model}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">
                                      Year
                                    </span>
                                    <span className="text-xs font-black text-[#1A1A1A] block mt-0.5">{item.year || "N/A"}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">
                                      Experience
                                    </span>
                                    <span className="text-xs font-black text-[#1A1A1A] block mt-0.5">
                                      {item.experience} Yrs
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">
                                      Availability
                                    </span>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black mt-0.5 ${
                                      item.availability === "Available"
                                        ? "bg-green-50 text-green-700 border border-green-100"
                                        : "bg-amber-50 text-amber-700 border border-amber-100"
                                    }`}>
                                      {item.availability || "Available"}
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block mb-1">
                                      Expertise
                                    </span>
                                    <div className="flex flex-wrap gap-1 max-h-[36px] overflow-hidden">
                                      {Array.isArray(item.machineExpertise) && item.machineExpertise.length > 0 ? (
                                        item.machineExpertise.map((exp: string, idx: number) => (
                                          <span key={idx} className="bg-[#F1F5F9] text-[#172263] px-1.5 py-0.5 rounded text-[9px] font-bold border border-[#172263]/10 truncate max-w-[80px]">
                                            {exp}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[10px] text-gray-400 font-semibold">General Operator</span>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                          </div>

                          {/* Bottom info: Owner & rating */}
                          <div className="flex items-center justify-between gap-4 pt-1 mt-auto">
                            {/* Owner info */}
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-[#172263] overflow-hidden shrink-0 border border-gray-200">
                                {item.ownerImage ? (
                                  <img src={item.ownerImage} alt={item.subtitle} className="w-full h-full object-cover" />
                                ) : (
                                  item.subtitle?.charAt(0)
                                )}
                              </span>
                              <div className="min-w-0 leading-none">
                                <span className="text-[8px] text-gray-400 font-black uppercase tracking-wider block">
                                  {item.type === "harvester" ? "Owner" : "Operator"}
                                </span>
                                <span className="text-xs font-black text-[#1A1A1A] line-clamp-1 mt-0.5">{item.subtitle}</span>
                              </div>
                            </div>

                            {/* Rating info */}
                            <div className="flex flex-col items-end shrink-0">
                              <div className="flex items-center gap-1 text-[#D97706] font-black text-xs leading-none">
                                <Star size={12} fill="currentColor" className="stroke-[#D97706]" />
                                <span>{parseFloat(item.avgRating || "0.0").toFixed(1)}</span>
                                <span className="text-[9px] text-gray-400 font-bold">({item.ratingCount || 0})</span>
                              </div>
                              <div className="flex gap-0.5 mt-1">
                                {Array(5).fill(0).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={9}
                                    fill={i < Math.round(parseFloat(item.avgRating || "0")) ? "currentColor" : "none"}
                                    className="stroke-[#D97706]"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* Footer Button */}
                      {token && currentUser && item.ownerId === currentUser.id ? (
                        <Link
                          to={item.type === "harvester" ? `/harvesters/${item.id}` : `/operators/${item.id}`}
                          className={`w-full py-3.5 text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-t border-slate-100 bg-slate-100 hover:bg-slate-200 text-[#172263]`}
                        >
                          <LayoutGrid size={14} />
                          View Details
                        </Link>
                      ) : (
                        <Link 
                          to={item.type === "harvester" ? `/harvesters/${item.id}` : `/operators/${item.id}`}
                          className={`w-full py-3.5 text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-t border-slate-100 ${
                            item.type === "harvester"
                              ? "bg-[#172263] hover:bg-[#11194A] text-white"
                              : "bg-amber-500 hover:bg-amber-600 text-white"
                          }`}
                        >
                          <MessageSquare size={14} />
                          {item.type === "harvester" ? "Book Now" : "Hire Now"}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {directoryItems.length >= dirLimit && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setDirLimit((prev) => prev + 8)}
                      className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-[#172263] hover:text-[#172263] transition-all shadow-xs hover:shadow-md cursor-pointer"
                    >
                      Explore More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {token && (
            /* RIGHT COLUMN: Sidebar Widgets */
            <div className="lg:col-span-4 space-y-6">
              
              {/* Recent Requests widget */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h2 className="text-lg font-extrabold text-[#1A1A1A] font-sora">Recent Requests</h2>
                  <button className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-700 to-[#172263] text-white text-[10px] font-black rounded-lg hover:shadow-xs transition-shadow cursor-pointer">
                    <Sparkles size={10} /> Ask with AI
                  </button>
                </div>

                {/* Search & Filter widgets inside Sidebar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Search size={12} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={requestSearchQuery}
                      onChange={(e) => setRequestSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#172263]"
                    />
                  </div>
                  <select
                    value={requestFilterType}
                    onChange={(e) => setRequestFilterType(e.target.value as any)}
                    className="px-2 py-1.5 border border-[#E2E8F0] bg-white rounded-xl text-xs font-bold text-[#57585A] cursor-pointer"
                  >
                    <option value="all">Filters</option>
                    <option value="harvester">Harvester</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>

                {/* Collapsible Requests List */}
                <div className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-xs space-y-3 max-h-[300px] overflow-y-auto">
                  {(() => {
                    const filteredRequests = recentRequests.filter(req => {
                      const matchesSearch = req.machineType?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                                            req.location?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                                            req.type?.toLowerCase().includes(requestSearchQuery.toLowerCase());
                      const matchesType = requestFilterType === 'all' ? true : req.type?.toLowerCase() === requestFilterType;
                      return matchesSearch && matchesType;
                    });

                    if (filteredRequests.length > 0) {
                      return filteredRequests.map((req) => (
                        <div 
                          key={req.id} 
                          onClick={() => setOpenLogRequestId(openLogRequestId === req.id ? null : req.id)}
                          className="flex flex-col bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]/40 hover:border-[#172263]/30 hover:bg-[#EAEFF8] transition-all duration-200 cursor-pointer group"
                        >
                          <div className="flex gap-3 items-start">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white shrink-0 relative overflow-hidden">
                              <FileText size={16} className="text-white/90" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-xs font-bold text-[#1A1A1A] truncate pr-2 group-hover:text-[#172263] transition-colors leading-tight">
                                  {req.type === 'harvester' ? 'Harvester' : 'Operator'} - {req.machineType}
                                </h4>
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0 uppercase border border-blue-100">
                                  {req.status || "Open"}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#57585A] flex items-center gap-1 font-medium truncate mt-1">
                                <MapPin size={9} className="text-[#E82326]" /> {formatLocation(req.location, req.state)}
                              </p>
                            </div>
                          </div>

                          {/* Collapsible Message Log drawer */}
                          {openLogRequestId === req.id && (
                            <div className="mt-3 border-t border-[#E2E8F0]/70 pt-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="flex justify-between items-center text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
                                <span>Message log</span>
                                <span className="uppercase text-[8px] font-black">Status</span>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-bold text-gray-700 bg-gray-100 border border-gray-200/50 rounded-md px-2 py-1">
                                <span>Message log</span>
                                <span className="uppercase text-[8px] font-black text-gray-500">Status</span>
                              </div>
                              <p className="text-[9px] text-[#57585A] font-semibold leading-relaxed px-1">
                                {req.description ? `"${req.description}"` : '"Requirement details published online."'}
                              </p>
                            </div>
                          )}
                        </div>
                      ));
                    } else {
                      return (
                        <div className="py-8 text-center text-xs text-[#57585A] font-medium">
                          {localStorage.getItem("tractorsewa_token") ? "No requests found matching filters." : "Please log in to view requests."}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Recent Activity widget */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h2 className="text-lg font-extrabold text-[#1A1A1A] font-sora">Recent Activity</h2>
                  <Link to="/activity" className="text-xs font-bold text-[#172263] hover:underline">
                    View All
                  </Link>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-xs flex flex-col min-h-[220px] justify-between">
                  {activities.length > 0 ? (
                    <div className="space-y-4 overflow-y-auto max-h-[160px] pr-1">
                      {activities.map((act, i) => (
                        <div key={i} className="flex gap-3 items-start border-b border-[#F8FAFC] pb-2 last:border-0 last:pb-0">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/30">
                            {act.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#1A1A1A] leading-tight truncate">
                              {act.key ? t(act.key, { ...act.params, defaultValue: act.text }) : act.text}
                            </p>
                            <p className="text-[9px] text-[#57585A] font-semibold mt-1.5 flex items-center gap-1">
                              <Clock size={8} /> {act.timeKey ? t(act.timeKey, { ns: act.timeNs, defaultValue: act.time }) : act.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-10">
                      <p className="text-xs text-[#57585A] text-center font-medium">No recent activity logs available</p>
                    </div>
                  )}

                  <div className="mt-4 border-t border-[#E2E8F0]/60 pt-3">
                    <Link to="/activity" className="w-full py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-bold text-[#172263] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs">
                      View Activity Logs <ArrowRight size={12} className="ml-1.5" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          )}

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

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  getFirstImage,
  DynamicText,
} from "./shared";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import districtsData from "./districts.json";

const INDIAN_STATES = districtsData.states.map((s: any) => s.state);

function DashboardSkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_3px_15px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-3 w-[260px] shrink-0 animate-pulse text-left">
      <div className="w-full h-26 rounded-xl bg-slate-100 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-8 bg-slate-100 rounded w-full my-2" />
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100" />
            <div className="h-3 bg-slate-100 rounded w-16" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-10" />
        </div>
      </div>
    </div>
  );
}

function DashboardListingCard({ item }: { item: any }) {
  const { t } = useTranslation(["dashboard", "static", "pages"]);
  const navigate = useNavigate();
  const token = localStorage.getItem("tractorsewa_token");
  const currentUser = JSON.parse(localStorage.getItem("tractorsewa_user") || "{}");

  const formatLocation = (location: string, state: string) => {
    if (!location) return state || "Maharashtra";
    if (!state) return location;
    return `${location}, ${state}`;
  };

  const cleanExpertise = (exp: any) => {
    if (Array.isArray(exp)) return exp;
    if (typeof exp === 'string') {
      try {
        return JSON.parse(exp);
      } catch (e) {
        return [exp];
      }
    }
    return [];
  };

  const expertiseList = cleanExpertise(item.machine_expertise || item.machineExpertise);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_3px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(23,34,99,0.07)] transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1 w-[260px] shrink-0 text-left">
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="relative w-full h-26 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
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
                <Tractor className="w-8 h-8 text-[#172263]/20" />
              ) : (
                <Users className="w-8 h-8 text-[#15803D]/20" />
              )}
            </div>
          )}

          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wide shadow-xs ${
            item.type === "harvester"
              ? "bg-blue-50 text-blue-700 border-blue-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-100"
          }`}>
            {item.type === "harvester" 
              ? t("landing.directory.harvester", { ns: "pages", defaultValue: "Harvester" })
              : t("landing.directory.operator", { ns: "pages", defaultValue: "Operator" })}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm text-slate-800 font-bold font-sora line-clamp-1 group-hover:text-[#172263] transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  <DynamicText>{item.name}</DynamicText>
                </h4>
                <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5 font-semibold">
                  <MapPin size={11} className="text-amber-500 shrink-0" />
                  <span className="line-clamp-1">
                    <DynamicText>{item.location}</DynamicText>
                    {item.location && item.state ? ", " : ""}
                    {item.state ? t("states." + item.state, { ns: "static", defaultValue: item.state }) : ""}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 py-2 border-y border-slate-100/80 my-2">
              {item.type === "harvester" ? (
                <>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t("landing.directory.company", { ns: "pages", defaultValue: "Company" })}</span>
                    <span className="text-xs font-semibold text-slate-700 line-clamp-1">
                      <DynamicText>{item.company}</DynamicText>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t("landing.directory.model", { ns: "pages", defaultValue: "Model" })}</span>
                    <span className="text-xs font-semibold text-slate-700 line-clamp-1">
                      <DynamicText>{item.model}</DynamicText>
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t("landing.directory.year", { ns: "pages", defaultValue: "Year" })}</span>
                    <span className="text-xs font-semibold text-slate-700">{item.year || "N/A"}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t("landing.directory.experience", { ns: "pages", defaultValue: "Experience" })}</span>
                    <span className="text-xs font-semibold text-slate-700">{item.experience} {t("landing.directory.yrs", { ns: "pages", defaultValue: "Yrs" })}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t("landing.directory.availability", { ns: "pages", defaultValue: "Availability" })}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black ${
                      item.availability === "Available"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {item.availability === "Available" 
                        ? t("dashboard.available", { defaultValue: "Available" }) 
                        : t("dashboard.busy", { defaultValue: "Busy" })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">{t("landing.directory.expertise", { ns: "pages", defaultValue: "Expertise" })}</span>
                    <div className="flex flex-wrap gap-1 max-h-[36px] overflow-hidden">
                      {expertiseList.length > 0 ? (
                        expertiseList.map((exp: string, idx: number) => (
                          <span key={idx} className="bg-slate-50 text-slate-600 px-1 py-0.5 rounded text-[8px] font-bold border border-slate-100 truncate max-w-[70px]">
                            <DynamicText>{exp}</DynamicText>
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold">{t("dashboard.generalOperator", { defaultValue: "General Operator" })}</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#172263] overflow-hidden shrink-0 border border-slate-200">
                {item.ownerImage ? (
                  <img src={item.ownerImage} alt={item.subtitle} className="w-full h-full object-cover" />
                ) : (
                  item.subtitle?.charAt(0)
                )}
              </span>
              <div className="min-w-0 leading-none">
                <span className="text-[7px] text-slate-400 font-black uppercase tracking-wider block">
                  {item.type === "harvester" 
                    ? t("landing.directory.owner", { ns: "pages", defaultValue: "Owner" }) 
                    : t("landing.directory.operator", { ns: "pages", defaultValue: "Operator" })}
                </span>
                <span className="text-[10px] font-bold text-slate-700 line-clamp-1 mt-0.5">
                  <DynamicText>{item.subtitle}</DynamicText>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-0.5 text-amber-500 font-black text-[10px] leading-none">
                <Star size={10} fill="currentColor" className="stroke-amber-500" />
                <span>{parseFloat(item.avgRating || "0.0").toFixed(1)}</span>
                <span className="text-[8px] text-slate-400 font-bold">({item.ratingCount || 0})</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {token && currentUser && item.ownerId === currentUser.id ? (
        <button
          onClick={() => navigate(item.type === "harvester" ? `/harvesters/${item.id}` : `/operators/${item.id}`)}
          className="w-full py-2.5 text-[10px] font-black transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-t border-slate-100 bg-slate-50 hover:bg-slate-100 text-[#172263]"
        >
          <LayoutGrid size={12} />
          {t("dashboard.viewDetails", { defaultValue: "View Details" })}
        </button>
      ) : (
        <button
          onClick={() => navigate(item.type === "harvester" ? `/harvesters/${item.id}` : `/operators/${item.id}`)}
          className={`w-full py-2.5 text-[10px] font-black transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-t border-slate-100 ${
            item.type === "harvester"
              ? "bg-[#172263] hover:bg-[#11194A] text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          <MessageSquare size={12} />
          {item.type === "harvester" 
            ? t("landing.directory.bookNow", { ns: "pages", defaultValue: "Book Now" }) 
            : t("landing.directory.hireNow", { ns: "pages", defaultValue: "Hire Now" })}
        </button>
      )}
    </div>
  );
}

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
  const [myHarvsApproved, setMyHarvsApproved] = useState<number>(0);
  const [myHarvsPending, setMyHarvsPending] = useState<number>(0);
  const [myHarvsRejected, setMyHarvsRejected] = useState<number>(0);
  const [myOperatorsCount, setMyOperatorsCount] = useState<number>(0);
  const [myOperatorProfile, setMyOperatorProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  
  // Custom states for simplified profile, local community, message notifications, and blogs card
  const [localHarvestersCount, setLocalHarvestersCount] = useState<number>(0);
  const [localOperatorsCount, setLocalOperatorsCount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [latestBlog, setLatestBlog] = useState<any>(null);

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
    // Only trigger auth dialog if user is not authenticated
    if (authRequired && !token) {
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
    } else if (authRequired && token) {
      // User is authenticated, just clean up the URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("auth_required");
      newParams.delete("redirect_path");
      setSearchParams(newParams, { replace: true });
    }
  }, [authRequired, redirectPath, searchParams, setSearchParams, token]);

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
          } else if (userRes.status === 401 || userRes.status === 403 || userRes.status === 404) {
            localStorage.removeItem("tractorsewa_token");
            localStorage.removeItem("tractorsewa_user_role");
            navigate("/login", { replace: true });
            return;
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
            const myHarvsRes = await fetch(`/api/harvesters?userId=${userProfile.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myHarvsRes.ok) {
              const allHarvs = await myHarvsRes.json();
              setMyHarvestersCount(allHarvs.length);
              setMyHarvsApproved(allHarvs.filter((h: any) => h.verification_status === "Approved").length);
              setMyHarvsPending(allHarvs.filter((h: any) => !h.verification_status || h.verification_status === "Pending").length);
              setMyHarvsRejected(allHarvs.filter((h: any) => h.verification_status === "Rejected").length);
            }

            const myOpsRes = await fetch(`/api/operators?userId=${userProfile.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (myOpsRes.ok) {
              const allOps = await myOpsRes.json();
              setMyOperatorsCount(allOps.filter((o: any) => o.is_profile_completed === 1).length);
              if (allOps.length > 0) {
                setMyOperatorProfile(allOps[0]);
              }
            }
          }
        } else {
          const isPreview = localStorage.getItem("tractorsewa_preview_mode") === "true";
          if (!isPreview) {
            navigate("/login", { replace: true });
            return;
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
            setConversations(partnersData);
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

        // Fetch local listings counts based on user state
        const uState = userProfile?.state || 'Maharashtra';
        const localHarvsRes = await fetch(`/api/harvesters?state=${encodeURIComponent(uState)}`);
        if (localHarvsRes.ok) {
          const lhData = await localHarvsRes.json();
          setLocalHarvestersCount(lhData.length);
        }
        const localOpsRes = await fetch(`/api/operators?state=${encodeURIComponent(uState)}`);
        if (localOpsRes.ok) {
          const loData = await localOpsRes.json();
          setLocalOperatorsCount(loData.length);
        }

        // Fetch unread messages
        if (token) {
          const unreadRes = await fetch('/api/messages/unread', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (unreadRes.ok) {
            const unreadData = await unreadRes.json();
            // Filter unique senders, keeping the latest message per sender
            const uniqueSenders: Record<string, any> = {};
            unreadData.forEach((m: any) => {
              uniqueSenders[m.sender_id] = m;
            });
            setUnreadMessages(Object.values(uniqueSenders));
          }
        }

        // Fetch latest blog post
        const blogsRes = await fetch('/api/blogs?limit=1');
        if (blogsRes.ok) {
          const blogsData = await blogsRes.json();
          if (blogsData.length > 0) {
            setLatestBlog(blogsData[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userName]);

  // Poll unread messages every 5 seconds to keep notifications updated in real-time
  useEffect(() => {
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const unreadRes = await fetch('/api/messages/unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (unreadRes.ok) {
          const unreadData = await unreadRes.json();
          const uniqueSenders: Record<string, any> = {};
          unreadData.forEach((m: any) => {
            uniqueSenders[m.sender_id] = m;
          });
          setUnreadMessages(Object.values(uniqueSenders));
        }
      } catch (err) {
        console.error("Error polling unread messages:", err);
      }
    };

    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [token]);

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
                  image: getFirstImage(item.imagePath),
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

  // Helper calculations for redesigned stats cards
  const userState = currentUser?.state || 'Maharashtra';
  const localRequests = recentRequests.filter((req: any) => 
    req.state?.trim().toLowerCase() === userState.trim().toLowerCase()
  );
  
  const localHarvestersDemand = localRequests.filter((req: any) => 
    req.type?.toLowerCase().includes('harvester')
  ).length;
  
  const localOperatorsDemand = localRequests.filter((req: any) => 
    req.type?.toLowerCase().includes('operator')
  ).length;

  const totalLocalDemand = localRequests.length;

  const harvestersList = directoryItems.filter((item: any) => item.type === "harvester");
  const operatorsList = directoryItems.filter((item: any) => item.type === "operator");

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

            {/* Stats Row (4 Columns Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              
              {/* Card 1: My Listings & Profile */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-52 relative overflow-hidden transition-all hover:shadow-md hover:border-[#172263]/30">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-2">{t("dashboard.myListingsAndProfile", { defaultValue: "MY LISTINGS & PROFILE" })}</span>
                    <User size={16} className="text-[#172263]" />
                  </div>
                  
                  <div className="space-y-1 mt-1">
                    <div className="text-base font-extrabold text-[#172263] font-sora truncate">{currentUser?.name || userName}</div>
                    <div className="text-[10px] text-[#57585A] font-semibold truncate">{currentUser?.email}</div>
                    <div className="text-[9px] bg-slate-100 text-[#172263] px-2 py-0.5 rounded-md inline-block uppercase font-bold tracking-wider">
                      {t("dashboard.role", { role: currentUser?.role || "user", defaultValue: `Role: ${currentUser?.role || "user"}` })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1 border-t border-[#F1F5F9] pt-2">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-gray-400 block">{t("dashboard.harvestersLabel", { defaultValue: "Harvesters" })}</span>
                    <span className="text-xs font-extrabold text-[#1A1A1A] font-sora block">{myHarvestersCount} {t("dashboard.total", { defaultValue: "Total" })}</span>
                    <span className="text-[8px] text-zinc-500 block font-bold leading-normal">
                      ({myHarvsApproved} {t("dashboard.app", { defaultValue: "App" })}, {myHarvsPending} {t("dashboard.pen", { defaultValue: "Pen" })}, {myHarvsRejected} {t("dashboard.rej", { defaultValue: "Rej" })})
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider font-bold text-gray-400 block">{t("dashboard.operatorProfileLabel", { defaultValue: "Operator Profile" })}</span>
                    <span className="text-xs font-extrabold text-[#1A1A1A] font-sora block">
                      {myOperatorsCount > 0 
                        ? t("dashboard.created", { defaultValue: "Created" }) 
                        : t("dashboard.notCreated", { defaultValue: "Not Created" })}
                    </span>
                    {myOperatorsCount > 0 && myOperatorProfile && (
                      <span className={`text-[8px] font-bold block leading-normal ${
                        myOperatorProfile.verification_status === "Approved" ? "text-emerald-600" :
                        myOperatorProfile.verification_status === "Rejected" ? "text-rose-600" : "text-amber-600"
                      }`}>
                        ({myOperatorProfile.verification_status || "Pending"})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-[#57585A] font-semibold border-t border-[#F1F5F9] pt-2">
                  <span>
                    {t("dashboard.operatorStatus", { 
                      status: myOperatorsCount > 0 && myOperatorProfile ? (myOperatorProfile.verification_status || "Pending") : "N/A", 
                      defaultValue: `Operator Status: ${myOperatorsCount > 0 && myOperatorProfile ? (myOperatorProfile.verification_status || "Pending") : "N/A"}` 
                    })}
                  </span>
                  <span className="text-[#172263] hover:underline cursor-pointer font-bold" onClick={() => navigate('/profile')}>{t("dashboard.manage", { defaultValue: "Manage" })}</span>
                </div>
              </div>

              {/* Card 2: Local Machine Network */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-52 relative overflow-hidden transition-all hover:shadow-md hover:border-[#172263]/30">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">{t("dashboard.myLocationNetwork", { defaultValue: "MY LOCATION NETWORK" })}</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[9px] font-black text-blue-700 uppercase">
                      <MapPin size={9} fill="currentColor" /> {userState}
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-black text-[#172263] font-sora">
                      {localHarvestersCount + localOperatorsCount}
                    </span>
                    <span className="text-xs text-[#57585A] font-bold">{t("dashboard.totalListings", { defaultValue: "Total listings" })}</span>
                  </div>
                </div>

                {/* SVG Visual Graph representing local network categories */}
                <div className="h-10 mt-1 flex items-end justify-between gap-3">
                  <div className="flex-1 flex flex-col justify-end h-full">
                    <div className="flex justify-between text-[8px] font-bold text-gray-500 mb-1">
                      <span>{t("dashboard.harvestersLabel", { defaultValue: "Harvesters" })}</span>
                      <span>{localHarvestersCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#172263] h-full rounded-full transition-all" style={{ width: `${(localHarvestersCount + localOperatorsCount) ? (localHarvestersCount / (localHarvestersCount + localOperatorsCount)) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-end h-full">
                    <div className="flex justify-between text-[8px] font-bold text-gray-500 mb-1">
                      <span>{t("dashboard.operatorsLabel", { defaultValue: "Operators" })}</span>
                      <span>{localOperatorsCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#D97706] h-full rounded-full transition-all" style={{ width: `${(localHarvestersCount + localOperatorsCount) ? (localOperatorsCount / (localHarvestersCount + localOperatorsCount)) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#57585A] font-semibold border-t border-[#F1F5F9] pt-2">
                  <span>{t("dashboard.networkConnected", { defaultValue: "Network: Connected" })}</span>
                  <span className="text-[#172263] hover:underline cursor-pointer font-bold" onClick={() => navigate('/harvesters')}>{t("dashboard.browseDirectory", { defaultValue: "Browse Directory" })}</span>
                </div>
              </div>

              {/* Card 3: Reputation & Trust */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-52 relative overflow-hidden transition-all hover:shadow-md hover:border-[#172263]/30">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">{t("myRating", { defaultValue: "MY RATING" })}</span>
                    <div className="text-xl font-extrabold text-[#172263] font-sora mt-1">
                      {userScore !== null 
                        ? `${parseFloat(userScore).toFixed(1)} ${t("rating", { defaultValue: "Rating" })}` 
                        : t("noScoreYet", { defaultValue: "No Ratings Yet" })}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          fill={i < Math.round(parseFloat(userScore || "0")) ? "#D97706" : "none"}
                          className={i < Math.round(parseFloat(userScore || "0")) ? "stroke-[#D97706]" : "stroke-gray-300"}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Radial Gauge SVG */}
                  <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="#F1F5F9"
                        strokeWidth="4.5"
                        fill="transparent"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="url(#trustGradient)"
                        strokeWidth="4.5"
                        fill="transparent"
                        strokeDasharray="163.36"
                        strokeDashoffset={163.36 - (163.36 * (userScore ? (parseFloat(userScore) / 5) * 100 : 0)) / 100}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#172263" />
                          <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute text-[10px] font-black text-[#172263]">
                      {userScore ? `${Math.round((parseFloat(userScore) / 5) * 100)}%` : "0%"}
                    </div>
                  </div>
                </div>

                <div className="text-left text-[10px] text-[#57585A] font-semibold border-t border-[#F1F5F9] pt-2">
                  {scoreCount > 0 
                    ? t("dashboard.basedOnScore", { count: scoreCount, defaultValue: `Based on ${scoreCount} ${scoreCount === 1 ? 'score given' : 'scores given'}` })
                    : t("dashboard.feedbackReceived", { defaultValue: "Feedback received from farmers on the platform" })}
                </div>
              </div>

              {/* Card 4: Latest Agri Insights */}
              <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-3xl p-5 flex flex-col justify-between h-52 relative overflow-hidden transition-all hover:shadow-md hover:border-[#172263]/30">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-[#57585A] uppercase font-bold tracking-wider block mb-1">{t("dashboard.latestAgriInsights", { defaultValue: "LATEST AGRI INSIGHTS" })}</span>
                    <Sparkles size={16} className="text-[#D97706]" />
                  </div>
                  
                  <div className="leading-tight mt-2">
                    <div className="text-[10px] font-black bg-amber-50 text-[#D97706] border border-amber-100/50 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider mb-1.5">
                      <DynamicText>{latestBlog?.category || t("dashboard.agriNews", { defaultValue: "Agri News" })}</DynamicText>
                    </div>
                    <div className="text-xs font-bold text-[#172263] line-clamp-2 h-8 font-sora leading-snug">
                      <DynamicText>{latestBlog?.title || t("dashboard.noBlogsPublished", { defaultValue: "No blogs published yet" })}</DynamicText>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-[#57585A] font-bold border-t border-[#F1F5F9] pt-2">
                  {t("dashboard.published", { date: latestBlog?.date || t("dashboard.recently", { defaultValue: "Recently" }), defaultValue: `Published: ${latestBlog?.date || "Recently"}` })}
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#57585A] font-semibold border-t border-[#F1F5F9] pt-2">
                  <span>{t("dashboard.readTime", { defaultValue: "Read time: 3 mins" })}</span>
                  <span className="text-[#172263] hover:underline cursor-pointer font-bold" onClick={() => navigate('/blogs')}>{t("dashboard.readArticle", { defaultValue: "Read Article" })}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Available Listings */}
          <div className="lg:col-span-12 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-2">
              <h2 className="text-lg font-extrabold text-[#1A1A1A] font-sora">{t("availableListings", { defaultValue: "Available Listings" })}</h2>
              {token && (
                <Link to="/harvesters" className="text-xs font-bold text-[#172263] hover:underline">
                  {t("landing.directory.exploreMore", { ns: "pages", defaultValue: "View All" })}
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
                    placeholder={t("filters.searchListings", { defaultValue: "Search listings..." })}
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
                  <option value="all">{t("filters.allListings", { defaultValue: "All Listings" })}</option>
                  <option value="harvester">{t("filters.harvestersFilter", { defaultValue: "Harvesters" })}</option>
                  <option value="operator">{t("filters.operatorsFilter", { defaultValue: "Operators" })}</option>
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
                  <option value="">{t("filters.statePlaceholder", { defaultValue: "State" })}</option>
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
                  <option value="">{t("filters.districtPlaceholder", { defaultValue: "District" })}</option>
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
                  <option value="dateNewest">{t("filters.sortNewest", { defaultValue: "Newest" })}</option>
                  <option value="ratingHighest">{t("filters.sortHighestRated", { defaultValue: "Highest Rated" })}</option>
                  <option value="nameAsc">{t("filters.sortNameAsc", { defaultValue: "Name (A-Z)" })}</option>
                  <option value="nameDesc">{t("filters.sortNameDesc", { defaultValue: "Name (Z-A)" })}</option>
                </select>

              </div>

              {/* Active Filter Badges & Clear button */}
              {(dirSearch || dirCategory !== "all" || dirState || dirDistrict) && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#E2E8F0]/60 items-center">
                  <span className="text-[10px] text-gray-400 font-bold mr-1">{t("filters.activeFilters", { defaultValue: "Active filters:" })}</span>
                  {dirSearch && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      "{dirSearch}"
                      <button onClick={() => setDirSearch("")} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  {dirCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {dirCategory === "harvester" ? t("landing.directory.harvester", { ns: "pages", defaultValue: "Harvester" }) : t("landing.directory.operator", { ns: "pages", defaultValue: "Operator" })}
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
                    {t("filters.clearAll", { defaultValue: "Clear All" })}
                  </button>
                </div>
              )}
            </div>

            {dirLoading ? (
              <div className="space-y-8">
                {(dirCategory === "all" || dirCategory === "harvester") && (
                  <div className="space-y-4 text-left">
                    <div className="flex gap-5 overflow-x-auto pt-2 pb-4 px-1 scrollbar-thin">
                      {Array(4).fill(0).map((_, i) => <DashboardSkeletonCard key={i} />)}
                    </div>
                  </div>
                )}
                {(dirCategory === "all" || dirCategory === "operator") && (
                  <div className="space-y-4 text-left">
                    <div className="flex gap-5 overflow-x-auto pt-2 pb-4 px-1 scrollbar-thin">
                      {Array(4).fill(0).map((_, i) => <DashboardSkeletonCard key={i} />)}
                    </div>
                  </div>
                )}
              </div>
            ) : directoryItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E8F0] text-sm text-[#57585A]">
                {t("filters.noListingsGlobal", { defaultValue: "No listings found matching your criteria. Be the first to add one!" })}
              </div>
            ) : (
              <div className="space-y-8 text-left">
                {/* 1. Harvesters Subsection */}
                {(dirCategory === "all" || dirCategory === "harvester") && (
                  <div className="space-y-4">
                    {harvestersList.length === 0 ? (
                      <div className="bg-slate-50/50 rounded-2xl p-8 text-center border border-slate-100 text-xs text-[#57585A] font-medium">
                        {t("filters.noHarvesters", { defaultValue: "No harvesters found matching your filters." })}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-5 overflow-x-auto pt-2 pb-4 px-1 scrollbar-thin">
                          {harvestersList.slice(0, dirLimit).map((item) => (
                            <DashboardListingCard key={`${item.type}-${item.id}`} item={item} />
                          ))}
                        </div>
                        <div className="text-center mt-2">
                          <button
                            onClick={() => navigate('/harvesters')}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 text-[#172263] hover:border-[#172263] hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                          >
                            {t("filters.viewMoreHarvesters", { defaultValue: "View More Harvesters" })} <ArrowRight size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 2. Operators Subsection */}
                {(dirCategory === "all" || dirCategory === "operator") && (
                  <div className="space-y-4 pt-4">
                    {operatorsList.length === 0 ? (
                      <div className="bg-slate-50/50 rounded-2xl p-8 text-center border border-slate-100 text-xs text-[#57585A] font-medium">
                        {t("filters.noOperators", { defaultValue: "No operators found matching your filters." })}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-5 overflow-x-auto pt-2 pb-4 px-1 scrollbar-thin">
                          {operatorsList.slice(0, dirLimit).map((item) => (
                            <DashboardListingCard key={`${item.type}-${item.id}`} item={item} />
                          ))}
                        </div>
                        <div className="text-center mt-2">
                          <button
                            onClick={() => navigate('/operators')}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 text-[#15803D] hover:border-[#15803D] hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                          >
                            {t("filters.viewMoreOperators", { defaultValue: "View More Operators" })} <ArrowRight size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column sidebar is removed in favor of the global navbar notification bell */}

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

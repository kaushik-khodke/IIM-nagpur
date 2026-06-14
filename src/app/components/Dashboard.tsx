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
  Settings,
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
  const [userName, setUserName] = useState("User");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        }

        const opsRes = await fetch('/api/operators?limit=6');
        const opsData = opsRes.ok ? await opsRes.json() : [];
        setOperators(opsData);

        const harvsRes = await fetch('/api/harvesters?limit=6');
        const harvsData = harvsRes.ok ? await harvsRes.json() : [];
        setHarvesters(harvsData);

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
    <div className="min-h-screen bg-[#F8FAFC]">
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

      <div className="w-full mx-auto px-4 sm:px-6 py-6 max-w-7xl pb-16 md:pb-8">
          {/* Greeting Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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

            {/* Search Bar / Action Button */}
            <div className="flex flex-1 md:flex-initial items-center gap-3 max-w-md w-full md:w-auto">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
                <input
                  type="text"
                  placeholder="Search machines, locations..."
                  onClick={() => navigate("/harvesters")}
                  className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-white cursor-pointer"
                />
              </div>
              <Link to="/add-harvester" className="shrink-0 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl shadow-md transition-colors">
                List Machine
              </Link>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (Stats & Summary Card) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Stats Cards (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Stat 1: Active Machines */}
                <div className="bg-orange-50 border border-orange-200/60 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 mb-2">
                    <Tractor size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-orange-600 uppercase font-bold tracking-wider block mb-1">Active Machines</span>
                    <span className="text-2xl font-black text-[#1A1A1A] font-sora">{harvesters.length || 0}</span>
                  </div>
                  <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0" />
                </div>

                {/* Stat 2: Total Areas */}
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider block mb-1">Total Booked</span>
                    <span className="text-2xl font-black text-[#1A1A1A] font-sora">2.53k Hect</span>
                  </div>
                  <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0" />
                </div>

                {/* Stat 3: Connections / Operators */}
                <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider block mb-1">Verified Operators</span>
                    <span className="text-2xl font-black text-[#1A1A1A] font-sora">{operators.length || 0}</span>
                  </div>
                  <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0" />
                </div>

                {/* Stat 4: Enquiries */}
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider block mb-1">Messages/Activity</span>
                    <span className="text-2xl font-black text-[#1A1A1A] font-sora">{activities.length || 0}</span>
                  </div>
                  <WheatWatermark className="opacity-[0.03] scale-50 bottom-0 right-0" />
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] font-sora">Harvester Listings Summary</h3>
                <div className="flex gap-4 items-center bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]/40">
                  <div className="w-20 h-16 bg-[#172263] rounded-xl flex items-center justify-center text-white shrink-0 relative overflow-hidden">
                    <Tractor size={28} className="text-amber-500/80" />
                    <WheatWatermark className="opacity-10 scale-75" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#1A1A1A] truncate">Prioritized Harvesting</h4>
                    <p className="text-[10px] text-[#57585A]">Active listing channels</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-[#57585A]">Active Machine Listings</span>
                    <span className="font-bold text-[#1A1A1A]">{harvesters.length}</span>
                  </div>
                  <div className="h-px bg-[#E2E8F0]/60" />
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-[#57585A]">Total Working Operators</span>
                    <span className="font-bold text-[#1A1A1A]">{operators.length}</span>
                  </div>
                  <div className="h-px bg-[#E2E8F0]/60" />
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-[#57585A]">Total Bookings Estimated</span>
                    <span className="font-bold text-[#15803D]">₹12,500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Harvester Listings Grid) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
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
                <div className="grid sm:grid-cols-2 gap-4">
                  {harvesters.slice(0, 4).map((h) => (
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
                          <div className="flex items-center gap-1 text-[10px] text-amber-500">
                            <span>★★★★★</span>
                            <span className="text-[#57585A] font-medium">(Operator Verified)</span>
                          </div>
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

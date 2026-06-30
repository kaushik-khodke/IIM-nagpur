import { useState, useEffect, useRef, Fragment, useMemo } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  Search,
  MapPin,
  Award,
  Phone,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Tractor,
  User,
  Users,
  UserPlus,
  Trash2,
  Pencil,
  Plus,
  Upload,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  LayoutGrid,
  Settings,
  LogOut,
  Bell,
  Heart,
  MessageCircle,
  FileText,
  Camera,
  UserCheck,
  ChevronDown,
  Mail,
  Share2,
  X,
  Loader2,
  Star,
  Send,
  Menu,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Image,
} from "lucide-react";
import {
  Navbar,
  OperatorCard,
  HarvesterCard,
  BlogCard,
  SkeletonCard,
  LoadingSpinner,
  EmptyState,
  PageHeader,
  AvailabilityBadge,
  TractorIllustration,
  WheatWatermark,
  AuthChooserDialog,
} from "./shared";
import { toast } from "sonner";
import districtsData from "./districts.json";
import { detectUserLocation, matchLocationWithDistricts } from "./locationHelper";
import { ImageCropperDialog } from "./ImageCropperDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown, getStatusBadge, getUserVerificationStatusBadge } from "./pagesShared";

// ===========================
// PROFILE
// ===========================
export function Profile() {
  const { t } = useTranslation(["pages", "static"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const listingsRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [operatorProfile, setOperatorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "operator">("listings");
  const [statusFilter, setStatusFilter] = useState<"All" | "Approved" | "Pending" | "Rejected">("All");

  useEffect(() => {
    if (tabParam === "listings" || tabParam === "operator") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (tabParam && listingsRef.current) {
      const timer = setTimeout(() => {
        listingsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [tabParam]);

  const logout = () => {
    localStorage.removeItem("tractorsewa_token");
    localStorage.removeItem("tractorsewa_preview_mode");
    navigate("/");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const userRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!userRes.ok) return;
        const userData = await userRes.json();
        setUser(userData);

        if (userData.role === "admin") return;

        const opRes = await fetch(`/api/operators?userId=${userData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (opRes.ok) {
          const opData = await opRes.json();
          if (opData.length > 0) setOperatorProfile(opData[0]);
        }

        const harvsRes = await fetch(`/api/harvesters?userId=${userData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (harvsRes.ok) {
          const harvsData = await harvsRes.json();
          setHarvesters(harvsData.filter((h: any) => h.ownerName === userData.name));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!user) return <EmptyState title={t("profile.notFound", { defaultValue: "Profile not found" })} />;

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1A1A1A]">
      <Navbar variant="auth" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#57585A] text-sm hover:text-[#172263] transition-colors group">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            {t("profile.backToDashboard", { defaultValue: "Back to Dashboard" })}
          </Link>
        </div>
        {/* Header Info Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-8 border-b border-zinc-200">
          {/* Left: Circular Avatar */}
          <div className="relative shrink-0 select-none">
            <div className="w-32 h-32 rounded-full border-4 border-[#172263] flex items-center justify-center overflow-hidden bg-[#F4F6FA] shadow-sm">
              {user.imagePath || operatorProfile?.image_path ? (
                <img src={user.imagePath || operatorProfile.image_path} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#172263] text-5xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Right: User Information */}
          <div className="flex-1 flex flex-col items-center md:items-start w-full">
            {/* Username row */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
                {user.name}
              </h2>
              <button
                onClick={() => navigate("/settings")}
                className="p-1.5 text-zinc-400 hover:text-[#172263] rounded-full transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>

            {/* Stats Metric Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={() => setActiveTab("listings")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#172263] text-white text-xs font-semibold shadow-sm transition-all duration-200"
              >
                <Users size={13} className="text-white" />
                <span>{harvesters.length} {t("profile.harvesterListings", { defaultValue: "Harvester Listings" })}</span>
              </button>
              <button
                onClick={() => setActiveTab("operator")}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] text-xs font-semibold transition-all duration-200 hover:bg-slate-200/50"
              >
                <UserPlus size={13} className="text-[#475569]" />
                <span>{operatorProfile ? 1 : 0} {t("profile.operatorProfile", { defaultValue: "Operator Profile" })}</span>
              </button>
            </div>

            {/* Community Label */}
            <p className="text-[#57585A] text-xs font-bold tracking-wider uppercase mb-5">
              TRACTOR SEVA COMMUNITY MEMBER
            </p>

            {/* Detail Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-6 border-t border-zinc-200">
              {/* Location */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 border border-zinc-100 rounded-xl shrink-0">
                  <MapPin size={18} className="text-[#172263]" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">Location</span>
                  <span className="text-sm font-semibold text-zinc-800">
                    {t("states." + (user.state || "Maharashtra"), { ns: "static", defaultValue: user.state || "Maharashtra" })}
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 sm:border-l sm:border-zinc-200 sm:pl-6 md:pl-10">
                <div className="p-2 bg-slate-50 border border-zinc-100 rounded-xl shrink-0">
                  <Phone size={18} className="text-[#172263]" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">Phone</span>
                  <span className="text-sm font-semibold text-zinc-800">+91-{user.phone}</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 sm:border-l sm:border-zinc-200 sm:pl-6 md:pl-10">
                <div className="p-2 bg-slate-50 border border-zinc-100 rounded-xl shrink-0">
                  <Mail size={18} className="text-[#172263]" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">Email</span>
                  <span className="text-sm font-semibold text-zinc-800 truncate max-w-[200px]" title={user.email}>
                    {user.email || "kaushikkhodke29@gmail.com"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 py-6 border-b border-zinc-200 w-full">
          <Link to="/profile/edit" className="w-full sm:w-auto sm:flex-1 max-w-md">
            <button className="w-full bg-white hover:bg-slate-50 text-[#172263] text-sm font-bold py-3 px-6 rounded-xl transition-all border border-[#172263] shadow-sm">
              {t("profile.editProfile", { defaultValue: "Edit Profile" })}
            </button>
          </Link>

          <div className="w-full sm:w-auto sm:flex-1 max-w-md relative group">
            <button className="w-full bg-[#172263] hover:bg-[#11194A] text-white text-sm font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
              {t("shared.addListing", { ns: "pages", defaultValue: "Add Listing" })} <ChevronDown size={16} />
            </button>
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link to="/add-harvester" className="block px-5 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-[#172263] transition-colors font-medium">
                {t("shared.addHarvester", { ns: "pages", defaultValue: "Add Harvester" })}
              </Link>
              <div className="h-px bg-zinc-100 my-1.5" />
              <Link to="/add-operator" className="block px-5 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-[#172263] transition-colors font-medium">
                {t("shared.addOperator", { ns: "pages", defaultValue: "Add Operator" })}
              </Link>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 text-[#B91C1C] hover:text-red-700 text-sm font-bold py-3 px-4 transition-colors"
            title={t("shared.logout", { ns: "pages", defaultValue: "Logout" })}
          >
            <LogOut size={16} />
            <span>{t("shared.logout", { ns: "pages", defaultValue: "Logout" })}</span>
          </button>
        </div>

        {/* Tab Selection (Segmented Control) */}
        <div ref={listingsRef} className="flex justify-center mt-10 mb-6">
          <div className="bg-[#F4F6FA] p-1.5 rounded-xl border border-zinc-200/80 flex gap-1 select-none">
            <button
              onClick={() => setActiveTab("listings")}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "listings"
                  ? "bg-white text-[#172263] shadow-sm"
                  : "text-zinc-555 hover:text-[#1A1A1A]"
                }`}
            >
              <LayoutGrid size={15} />
              <span>{t("profile.myListings", { defaultValue: "Listings" })}</span>
            </button>
            <button
              onClick={() => setActiveTab("operator")}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "operator"
                  ? "bg-white text-[#172263] shadow-sm"
                  : "text-zinc-555 hover:text-[#1A1A1A]"
                }`}
            >
              <UserCheck size={15} />
              <span>{t("profile.operatorProfile", { defaultValue: "Operator Profile" })}</span>
            </button>
          </div>
        </div>

        {/* Grid Content */}
        {activeTab === "listings" && (
          <div>
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 justify-start border-b border-zinc-200 pb-4">
              {(["All", "Approved", "Pending", "Rejected"] as const).map((status) => {
                const count = status === "All" 
                  ? harvesters.length 
                  : harvesters.filter(h => status === "Pending" ? (!h.verification_status || h.verification_status === "Pending") : h.verification_status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      statusFilter === status
                        ? "bg-[#172263] border-[#172263] text-white shadow-sm"
                        : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>

            {harvesters.filter(h => {
              if (statusFilter === "All") return true;
              if (statusFilter === "Pending") return !h.verification_status || h.verification_status === "Pending";
              return h.verification_status === statusFilter;
            }).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                {harvesters.filter(h => {
                  if (statusFilter === "All") return true;
                  if (statusFilter === "Pending") return !h.verification_status || h.verification_status === "Pending";
                  return h.verification_status === statusFilter;
                }).map((h) => (
                  <Link
                    key={h.id}
                    to={`/harvesters/${h.id}`}
                    className="bg-[#ffffff] border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col hover:-translate-y-0.5"
                  >
                    <div className="aspect-[4/3] w-full bg-[#F4F6FA] relative overflow-hidden border-b border-zinc-200">
                      {h.imagePath ? (
                        <img src={h.imagePath} alt={h.machineName} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tractor size={32} className="text-zinc-400 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
                        <span className="px-2 py-0.5 bg-[#E82326]/10 text-[#E82326] border border-[#E82326]/20 rounded text-[9px] font-bold uppercase tracking-wider">
                          {t("companies." + h.company, { ns: "static", defaultValue: h.company })}
                        </span>
                        <div className="scale-90 origin-top-right">
                          {getStatusBadge(h.verification_status)}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A] line-clamp-1 group-hover:text-[#172263] transition-colors">
                          {h.machineName}
                        </h4>
                        <p className="text-xs text-[#57585A] flex items-center gap-1.5 mt-1.5 font-medium">
                          <MapPin size={12} className="text-[#E82326]" /> {h.location}, {t("states." + h.state, { ns: "static", defaultValue: h.state })}
                        </p>
                        {h.verification_status === "Rejected" && h.verification_feedback && (
                          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-medium">
                            <strong className="block text-rose-800 mb-0.5">Admin Feedback:</strong>
                            {h.verification_feedback}
                          </div>
                        )}
                      </div>
                      <div className="h-px bg-zinc-100 my-3.5" />
                      <div className="flex items-center justify-between text-[11px] text-[#57585A]">
                        <span>{t("exploreHarvesters.model", { defaultValue: "Model" })}: <strong className="text-zinc-700 font-semibold">{h.model || "N/A"}</strong></span>
                        <span>{t("addHarvester.purchaseYear", { defaultValue: "Year" })}: <strong className="text-zinc-700 font-semibold">{h.year || "N/A"}</strong></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl border border-zinc-200 bg-[#F4F6FA] flex items-center justify-center mb-4 text-zinc-400">
                  <Camera size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>{t("profile.noListingsYet", { defaultValue: "No Listings Yet" })}</h3>
                <p className="text-sm text-zinc-550 max-w-xs mb-6">{t("exploreHarvesters.noListingsDesc", { defaultValue: "List your harvester equipment so local farmers can browse and contact you." })}</p>
                <Link to="/add-harvester">
                  <button className="bg-[#172263] hover:bg-opacity-90 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm">
                    {t("exploreHarvesters.listYourMachine", { defaultValue: "List Your Harvester" })}
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "operator" && (
          <div>
            {operatorProfile ? (
              <div className="max-w-xl mx-auto mt-8 bg-[#ffffff] border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#172263] to-[#E82326] flex items-center justify-center font-bold text-white text-sm shadow-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A]">{user.name}</h4>
                      <p className="text-[10px] text-zinc-400">{operatorProfile.location || t("profile.noLocation", { defaultValue: "Location not specified" })}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <AvailabilityBadge status={operatorProfile.availability || "Available"} />
                    <div className="scale-90 origin-top-right">
                      {getStatusBadge(operatorProfile.verification_status)}
                    </div>
                  </div>
                </div>

                {operatorProfile.verification_status === "Rejected" && operatorProfile.verification_feedback && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium space-y-1">
                    <strong className="block text-rose-800">Verification Rejected by Admin:</strong>
                    <p>{operatorProfile.verification_feedback}</p>
                  </div>
                )}

                <div className="space-y-4 text-sm text-[#57585A]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F4F6FA] p-3.5 rounded-xl border border-zinc-200/50">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1">{t("addOperator.experience", { defaultValue: "Experience" })}</span>
                      <span className="text-[#1A1A1A] font-bold text-base">{operatorProfile.experience} {t("profile.yearsUnit", { defaultValue: "Years" })}</span>
                    </div>
                    <div className="bg-[#F4F6FA] p-3.5 rounded-xl border border-zinc-200/50">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1">{t("addOperator.whatsappStat", { defaultValue: "WhatsApp Contact" })}</span>
                      <span className="text-[#1A1A1A] font-semibold text-sm">+91-{operatorProfile.whatsapp || user.phone}</span>
                    </div>
                  </div>

                  <div className="bg-[#F4F6FA] p-4 rounded-xl border border-zinc-200/50">
                    <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1.5">{t("exploreOperators.expertise", { defaultValue: "Machine Expertise" })}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {operatorProfile.machineExpertise && operatorProfile.machineExpertise.length > 0 ? (
                        operatorProfile.machineExpertise.map((m: string) => (
                          <span key={m} className="px-2.5 py-0.5 bg-[#ffffff] text-[#172263] border border-[#172263]/25 rounded-full text-xs font-semibold">
                            {t("machineTypes." + m, { ns: "static", defaultValue: m })}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-xs italic">{t("profile.noMachinesSelected", { defaultValue: "No machines selected" })}</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#F4F6FA] p-4 rounded-xl border border-zinc-200/50">
                    <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1.5">{t("addOperator.bioStat", { defaultValue: "Description / About Me" })}</span>
                    <p className="text-xs text-zinc-650 leading-relaxed italic">
                      "{operatorProfile.description || t("profile.activeOperatorDesc", { defaultValue: "Active professional operator listed on Tractor Seva." })}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Link to="/profile/edit" className="flex-1">
                    <button className="w-full py-2.5 bg-[#F4F6FA] hover:bg-zinc-200/80 text-[#1A1A1A] text-xs font-semibold rounded-xl border border-zinc-200/80 transition-colors shadow-sm">
                      {t("profile.updateOperatorDetails", { defaultValue: "Update Operator Details" })}
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl border border-zinc-200 bg-[#F4F6FA] flex items-center justify-center mb-4 text-zinc-400">
                  <UserCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>{t("profile.becomeOperator", { defaultValue: "Become an Operator" })}</h3>
                <p className="text-sm text-zinc-550 max-w-xs mb-6">{t("profile.becomeOperatorDesc", { defaultValue: "Create your operator profile to specify your experience and machine skills so farmers can hire you." })}</p>
                <Link to="/add-operator">
                  <button className="bg-[#172263] hover:bg-opacity-90 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm">
                    {t("profile.registerOperatorProfile", { defaultValue: "Register Operator Profile" })}
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
  ProfileCard,
  DirectorySkeletonCard,
  getFirstImage,
  useIsMobile,
  BottomSheet,
} from "./shared";
import { toast } from "sonner";
import districtsData from "./districts.json";
import { detectUserLocation, matchLocationWithDistricts } from "./locationHelper";
import { ImageCropperDialog } from "./ImageCropperDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown, getAllImages } from "./pagesShared";

// ===========================
// EXPLORE HARVESTERS
// ===========================
export function ExploreHarvesters() {
  const { t } = useTranslation(["pages", "common", "static", "dashboard"]);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "mine" ? "mine" : "all";
  const setTab = (newTab: "all" | "mine") => {
    setSearchParams((prev) => {
      if (newTab === "mine") {
        prev.set("tab", "mine");
      } else {
        prev.delete("tab");
      }
      return prev;
    });
  };
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        if (token) {
          const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Load default location or trigger detection prompt
  useEffect(() => {
    const defaultState = localStorage.getItem("tractorsewa_default_state");
    const defaultDistrict = localStorage.getItem("tractorsewa_default_district");
    const dismissed = localStorage.getItem("tractorsewa_location_dismissed");

    if (defaultState && defaultDistrict) {
      setSelectedState(defaultState);
      setSelectedDistrict(defaultDistrict);
    } else if (dismissed !== "true") {
      const toastId = toast("📍 Optimize search results by auto-detecting your location.", {
        action: {
          label: "Detect",
          onClick: async () => {
            const loadingToastId = toast.loading("Detecting location...");
            const detected = await detectUserLocation();
            toast.dismiss(loadingToastId);
            if (detected) {
              const matched = matchLocationWithDistricts(detected.state, detected.district);
              if (matched) {
                localStorage.setItem("tractorsewa_default_state", matched.state);
                localStorage.setItem("tractorsewa_default_district", matched.district);
                setSelectedState(matched.state);
                setSelectedDistrict(matched.district);
                toast.success(`Location set to ${matched.district}, ${matched.state}!`);
              } else {
                toast.error("Could not match your location with Indian states/districts.");
              }
            } else {
              toast.error("Could not detect location. Please select manually.");
            }
          }
        },
        cancel: {
          label: "Dismiss",
          onClick: () => {
            localStorage.setItem("tractorsewa_location_dismissed", "true");
          }
        },
        duration: 10000,
      });
      return () => { toast.dismiss(toastId); };
    }
  }, []);

  useEffect(() => {
    const fetchHarvesters = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/harvesters?search=${encodeURIComponent(search)}&location=${encodeURIComponent(selectedDistrict)}&state=${encodeURIComponent(selectedState)}&company=${encodeURIComponent(company)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHarvesters(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchHarvesters();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, selectedDistrict, selectedState, company]);

  const filtered = tab === "mine"
    ? harvesters.filter((h) => currentUser && h.ownerName === currentUser.name)
    : harvesters;

  const isMobile = useIsMobile();
  if (isMobile) {
    const districts = selectedState
      ? districtsData.states.find((s: any) => s.state === selectedState)?.districts || []
      : [];

    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 text-left font-sans">
        <Navbar variant="auth" />
        
        <div className="px-4 pt-4">
          {/* Top segment control */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200/40">
            <button
              onClick={() => navigate("/harvesters")}
              className="flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all bg-[#172263] text-white shadow-xs"
            >
              🚜 Machines
            </button>
            <button
              onClick={() => navigate("/operators")}
              className="flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all text-[#57585A]"
            >
              👤 Operators
            </button>
          </div>

          {/* Search bar & filter trigger */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search harvesters, brands..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/60 rounded-2xl text-xs focus:outline-none focus:border-[#172263] shadow-xs"
              />
            </div>
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="p-2.5 bg-white border border-slate-200/60 rounded-2xl text-[#172263] active:bg-slate-50 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
            >
              <Filter size={16} />
            </button>
          </div>

          {/* Active filter badges */}
          {(selectedState || company) && (
            <div className="flex flex-wrap gap-1.5 mb-4 items-center">
              {selectedState && (
                <span className="text-[10px] font-bold bg-[#172263]/10 text-[#172263] border border-[#172263]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  📍 {selectedDistrict || selectedState}
                  <button onClick={() => { setSelectedState(""); setSelectedDistrict(""); }} className="font-extrabold font-sans">×</button>
                </span>
              )}
              {company && (
                <span className="text-[10px] font-bold bg-[#172263]/10 text-[#172263] border border-[#172263]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  🏷️ {company}
                  <button onClick={() => setCompany("")} className="font-extrabold font-sans">×</button>
                </span>
              )}
              <button
                onClick={() => { setSelectedState(""); setSelectedDistrict(""); setCompany(""); setSearch(""); }}
                className="text-[10px] font-bold text-red-600 ml-1 hover:underline active:scale-95 transition-all"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Tab selector (All vs Mine) */}
          <div className="flex bg-white border border-slate-200/60 p-1 rounded-xl mb-5 shadow-xs">
            <button
              onClick={() => setTab("all")}
              className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all ${
                tab === "all" ? "bg-slate-100 text-[#172263]" : "text-[#57585A]"
              }`}
            >
              All Machines
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all ${
                tab === "mine" ? "bg-slate-100 text-[#172263]" : "text-[#57585A]"
              }`}
            >
              My Listings ({filtered.length})
            </button>
          </div>

          {/* Harvester listings grid */}
          {loading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <DirectorySkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={tab === "mine" ? "You haven't listed any machines" : "No harvesters found"}
              description="Adjust filters or add a machine listing to get started."
              actionLabel="Add Harvester"
              onAction={() => navigate("/add-harvester")}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((h) => {
                const mappedItem = {
                  ...h,
                  id: h.id,
                  name: h.machineName,
                  subtitle: h.ownerName,
                  image: getFirstImage(h.imagePath),
                  ownerImage: h.ownerProfilePic,
                  type: "harvester",
                  ownerId: h.userId,
                };
                return (
                  <ProfileCard
                    key={h.id}
                    item={mappedItem}
                    currentUserId={currentUser?.id || null}
                    t={t}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Filter Bottom Sheet */}
        <BottomSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          title="Filter Machinery"
        >
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("");
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-slate-50/60 font-semibold"
              >
                <option value="">All States</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedState}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-slate-50/60 font-semibold disabled:opacity-50"
              >
                <option value="">All Districts</option>
                {districts.map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">Company / Brand</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-slate-50/60 font-semibold"
              >
                <option value="">All Brands</option>
                {HARVESTER_COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setFilterSheetOpen(false)}
              className="w-full py-3 bg-[#172263] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md mt-2 cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="w-full mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-4 hover:text-[#172263] transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t("exploreHarvesters.back", { defaultValue: "Back" })}
        </button>
        <PageHeader
          title={t("exploreHarvesters.title", { defaultValue: "Browse Harvesters" })}
          subtitle={t("exploreHarvesters.machinesAvailable", { count: filtered.length, defaultValue: `${filtered.length} machines available` })}
          action={
            <Link
              to="/add-harvester"
              className="flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white rounded-xl text-sm hover:bg-green-700 transition-colors"
            >
              <Plus size={16} /> {t("exploreHarvesters.listYourMachine", { defaultValue: "List Your Machine" })}
            </Link>
          }
        />

        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("exploreHarvesters.searchPlaceholder", { defaultValue: "Search by harvester name or model..." })}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
              />
            </div>

            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] w-full md:w-48"
            >
              <option value="">{t("exploreHarvesters.allStates", { defaultValue: "All States" })}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] w-full md:w-48 disabled:opacity-50"
            >
              <option value="">{t("exploreHarvesters.allDistricts", { defaultValue: "All Districts" })}</option>
              {selectedState &&
                districtsData.states
                  .find((s) => s.state === selectedState)
                  ?.districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
            </select>

            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] w-full md:w-44"
            >
              <option value="">{t("exploreHarvesters.allCompanies", { defaultValue: "All Companies" })}</option>
              {COMPANIES.map((c) => <option key={c} value={c}>{t("companies." + c, { ns: "static", defaultValue: c })}</option>)}
            </select>
            {(search || selectedState || selectedDistrict || company) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedState("");
                  setSelectedDistrict("");
                  setCompany("");
                }}
                className="text-[#172263] text-sm px-3 hover:underline"
              >
                {t("exploreHarvesters.clearAll", { defaultValue: "Clear All" })}
              </button>
            )}
          </div>
        </div>


        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E2E8F0] mb-6">
          <button
            onClick={() => setTab("all")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab === "all"
                ? "border-[#172263] text-[#172263]"
                : "border-transparent text-[#57585A] hover:text-[#172263]"
              }`}
          >
            {t("exploreHarvesters.allMachines", { defaultValue: "All Machines" })}
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab === "mine"
                ? "border-[#172263] text-[#172263]"
                : "border-transparent text-[#57585A] hover:text-[#172263]"
              }`}
          >
            {t("exploreHarvesters.myListings", { defaultValue: "My Listings" })}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full">
            {Array(8).fill(0).map((_, i) => <DirectorySkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === "mine" ? t("exploreHarvesters.noListings", { defaultValue: "You haven't listed any machines yet" }) : t("exploreHarvesters.noHarvesters", { defaultValue: "No harvesters found" })}
            description={tab === "mine" ? t("exploreHarvesters.noListingsDesc", { defaultValue: "List your harvester today to connect with farmers looking for services." }) : t("exploreHarvesters.noHarvestersDesc", { defaultValue: "Try adjusting your filters or be the first to list a machine in this area." })}
            actionLabel={t("exploreHarvesters.listYourMachine", { defaultValue: "List Your Machine" })}
            onAction={() => navigate("/add-harvester")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full">
            {filtered.map((h) => {
              const mappedItem = {
                ...h,
                id: h.id,
                name: h.machineName,
                subtitle: h.ownerName,
                image: getFirstImage(h.imagePath),
                ownerImage: h.ownerProfilePic,
                type: "harvester",
                ownerId: h.userId,
              };
              return (
                <ProfileCard
                  key={h.id}
                  item={mappedItem}
                  currentUserId={currentUser?.id || null}
                  t={t}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
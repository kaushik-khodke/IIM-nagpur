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
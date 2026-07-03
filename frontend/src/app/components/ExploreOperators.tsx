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
  useIsMobile,
  BottomSheet,
} from "./shared";
import { toast } from "sonner";
import districtsData from "./districts.json";
import { detectUserLocation, matchLocationWithDistricts } from "./locationHelper";
import { ImageCropperDialog } from "./ImageCropperDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown } from "./pagesShared";

// ===========================
// EXPLORE OPERATORS
// ===========================
export function ExploreOperators() {
  const { t } = useTranslation(["pages", "static"]);
  const [operators, setOperators] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
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
      const toastId = toast(t("operators.locationPrompt", { defaultValue: "📍 Optimize search results by auto-detecting your location." }), {
        action: {
          label: t("operators.detect", { defaultValue: "Detect" }),
          onClick: async () => {
            const loadingToastId = toast.loading(t("operators.detectingLocation", { defaultValue: "Detecting location..." }));
            const detected = await detectUserLocation();
            toast.dismiss(loadingToastId);
            if (detected) {
              const matched = matchLocationWithDistricts(detected.state, detected.district);
              if (matched) {
                localStorage.setItem("tractorsewa_default_state", matched.state);
                localStorage.setItem("tractorsewa_default_district", matched.district);
                setSelectedState(matched.state);
                setSelectedDistrict(matched.district);
                toast.success(t("operators.locationSet", { defaultValue: "Location set to {{district}}, {{state}}!", district: matched.district, state: matched.state }));
              } else {
                toast.error(t("operators.locationMatchError", { defaultValue: "Could not match your location with Indian states/districts." }));
              }
            } else {
              toast.error(t("operators.locationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
            }
          }
        },
        cancel: {
          label: t("operators.dismiss", { defaultValue: "Dismiss" }),
          onClick: () => {
            localStorage.setItem("tractorsewa_location_dismissed", "true");
          }
        },
        duration: 10000,
      });
      return () => { toast.dismiss(toastId); };
    }
  }, [t]);

  useEffect(() => {
    const fetchOperators = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/operators?search=${encodeURIComponent(search)}&location=${encodeURIComponent(selectedDistrict)}&state=${encodeURIComponent(selectedState)}&availability=${encodeURIComponent(availability)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOperators(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchOperators();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, selectedDistrict, selectedState, availability]);

  const filtered = operators;

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
              className="flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all text-[#57585A]"
            >
              🚜 Machines
            </button>
            <button
              onClick={() => navigate("/operators")}
              className="flex-1 py-2 text-center text-xs font-extrabold rounded-xl transition-all bg-[#172263] text-white shadow-xs"
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
                placeholder="Search operators, skills..."
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
          {(selectedState || availability) && (
            <div className="flex flex-wrap gap-1.5 mb-4 items-center">
              {selectedState && (
                <span className="text-[10px] font-bold bg-[#172263]/10 text-[#172263] border border-[#172263]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  📍 {selectedDistrict || selectedState}
                  <button onClick={() => { setSelectedState(""); setSelectedDistrict(""); }} className="font-extrabold font-sans">×</button>
                </span>
              )}
              {availability && (
                <span className="text-[10px] font-bold bg-[#172263]/10 text-[#172263] border border-[#172263]/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  📅 {availability}
                  <button onClick={() => setAvailability("")} className="font-extrabold font-sans">×</button>
                </span>
              )}
              <button
                onClick={() => { setSelectedState(""); setSelectedDistrict(""); setAvailability(""); setSearch(""); }}
                className="text-[10px] font-bold text-red-600 ml-1 hover:underline active:scale-95 transition-all"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Operator listings grid */}
          {loading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <DirectorySkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No operators found"
              description="Try adjusting your filters or search terms."
              actionLabel="List as Operator"
              onAction={() => navigate("/add-operator")}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((op) => {
                const mappedItem = {
                  ...op,
                  id: op.id,
                  name: op.name,
                  subtitle: op.name,
                  image: op.imagePath || op.image_path,
                  ownerImage: op.imagePath || op.image_path,
                  type: "operator",
                  ownerId: op.userId || op.user_id,
                  experience: op.experience,
                  machineExpertise: typeof op.machineExpertise === 'string' ? JSON.parse(op.machineExpertise) : op.machineExpertise,
                  availability: op.availability
                };
                return (
                  <ProfileCard
                    key={op.id}
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
          title="Filter Operators"
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-slate-50/60 font-semibold"
              >
                <option value="">Any Availability</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Not Available">Not Available</option>
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
        <PageHeader title={t("operators.title", { defaultValue: "Find Operators" })} subtitle={t("operators.subtitle", { defaultValue: "{{count}} operators available", count: filtered.length })} />

        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("operators.searchPlaceholder", { defaultValue: "Search by operator name..." })}
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
              <option value="">{t("operators.allStates", { defaultValue: "All States" })}</option>
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
              <option value="">{t("operators.allDistricts", { defaultValue: "All Districts" })}</option>
              {selectedState &&
                districtsData.states
                  .find((s) => s.state === selectedState)
                  ?.districts.map((d) => (
                    <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                  ))}
            </select>

            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] w-full md:w-44"
            >
              <option value="">{t("operators.allStatus", { defaultValue: "All Status" })}</option>
              <option value="Available">{t("status.available", { ns: "static", defaultValue: "Available" })}</option>
              <option value="Busy">{t("status.busy", { ns: "static", defaultValue: "Busy" })}</option>
              <option value="Not Available">{t("status.notAvailable", { ns: "static", defaultValue: "Not Available" })}</option>
            </select>
            {(search || selectedState || selectedDistrict || availability) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedState("");
                  setSelectedDistrict("");
                  setAvailability("");
                }}
                className="text-[#172263] text-sm px-3 hover:underline"
              >
                {t("operators.clearAll", { defaultValue: "Clear All" })}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full">
            {Array(8).fill(0).map((_, i) => <DirectorySkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={t("operators.emptyTitle", { defaultValue: "No operators found" })} description={t("operators.emptyDescription", { defaultValue: "Try adjusting your filters." })} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full">
            {filtered.map((op) => {
              const mappedItem = {
                ...op,
                id: op.id,
                name: op.name,
                subtitle: op.name,
                image: op.image_path,
                ownerImage: op.image_path,
                type: "operator",
                ownerId: op.user_id,
              };
              return (
                <ProfileCard
                  key={op.id}
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
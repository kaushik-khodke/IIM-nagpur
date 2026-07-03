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
import { ReactNode } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import tractorSevaLogo from "@/assets/tractor-seva-logo.png";
import {
  MapPin,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Tractor,
  BookOpen,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  UserCheck,
  Plus,
  Settings,
  FileText,
  MessageSquare,
  Home,
  RefreshCw,
  AlertCircle,
  InboxIcon,
  Globe,
  ShieldCheck,
  Star,
  Users,
  Search,
  Smartphone,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

// ---- Web Push Unsubscription Helper ----
export const unsubscribeFromPush = async () => {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // 1. Unsubscribe locally in browser
        await subscription.unsubscribe();
        
        // 2. Notify backend to prune subscription
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
    } catch (err) {
      console.error("Error unsubscribing from push notifications:", err);
    }
  }
};

// ---- Availability Badge ----
export function AvailabilityBadge({ status }: { status: string }) {
  const { t } = useTranslation(["static"]);
  if (status === "Available")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 size={11} /> {t("status.available", { defaultValue: "Available" })}
      </span>
    );
  if (status === "Busy")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
        <Clock size={11} /> {t("status.busy", { defaultValue: "Busy" })}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 border border-red-200">
      <XCircle size={11} /> {t("status.notAvailable", { defaultValue: "Not Available" })}
    </span>
  );
}

// ---- Page Header ----
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1
          className="text-3xl text-[#1A1A1A]"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-[#57585A] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ---- Skeleton Card ----
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] animate-pulse">
      <div className="h-44 bg-blue-50" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-8 bg-blue-100 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ---- Directory Skeleton Card ----
export function DirectorySkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-col gap-1.5 animate-pulse">
      <div className="w-full h-26 bg-slate-100 rounded-xl" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="space-y-1">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl p-2 flex gap-3 my-1">
          <div className="h-full bg-slate-200/60 rounded w-1/2" />
          <div className="h-full bg-slate-200/60 rounded w-1/2" />
        </div>
        <div className="flex justify-between items-center pt-0.5 mt-auto">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-slate-100" />
            <div className="h-3 bg-slate-100 rounded w-16" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-12" />
        </div>
      </div>
      <div className="h-7 bg-slate-100 rounded-lg w-full mt-1" />
    </div>
  );
}

// ---- Profile Card ----
export function ProfileCard({ item, currentUserId, t }: { item: any; currentUserId: string | null; t: any }) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_3px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(23,34,99,0.07)] transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
    >
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="relative w-full h-48 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500"
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

          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm tracking-wide ${item.type === "harvester"
              ? "bg-blue-100/95 text-blue-800 border border-blue-200/50"
              : "bg-green-100/95 text-green-800 border border-green-200/50"
            }`}>
            {item.type === "harvester" ? t("landing.directory.harvester", { ns: "pages" }) : t("landing.directory.operator", { ns: "pages" })}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4
                  className="text-lg text-slate-800 font-bold font-sora line-clamp-1 group-hover:text-[#172263] transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  <DynamicText>{item.name}</DynamicText>
                </h4>
                <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-amber-500 shrink-0" />
                  <span className="line-clamp-1">
                    <DynamicText>{item.location}</DynamicText>, <DynamicText>{item.state}</DynamicText>
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 py-2 border-y border-slate-100/80 my-2">
              {item.type === "harvester" ? (
                <>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {t("landing.directory.year", { ns: "pages" })}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{item.year || "N/A"}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {t("landing.directory.experience", { ns: "pages" })}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {t("exploreOperators.experienceYears", { ns: "pages", count: parseInt(item.experience) || item.experience })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {t("landing.directory.availability", { ns: "pages" })}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${item.availability === "Available"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                      }`}>
                      {item.availability || "Available"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-0 mt-auto">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shrink-0 border border-slate-200">
                {item.ownerImage ? (
                  <img src={item.ownerImage} alt={item.subtitle} className="w-full h-full object-cover" />
                ) : (
                  item.subtitle?.charAt(0)
                )}
              </span>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                  {item.type === "harvester" ? t("landing.directory.owner", { ns: "pages" }) : t("landing.directory.operator", { ns: "pages" })}
                </span>
                <span className="text-xs font-semibold text-slate-700 line-clamp-1 mt-0.5">{item.subtitle}</span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star size={13} fill="currentColor" className="stroke-amber-500" />
                <span className="text-xs font-bold text-slate-800">{item.avgRating || "0.0"}</span>
                <span className="text-[10px] text-slate-400">({item.ratingCount || 0})</span>
              </div>
              <div className="flex gap-0.5 mt-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star
                    key={i}
                    size={9}
                    fill={i < Math.round(parseFloat(item.avgRating || "0")) ? "currentColor" : "none"}
                    className="stroke-amber-500"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentUserId && item.ownerId === currentUserId ? (
        <Link
          to={item.type === "harvester" ? `/harvesters/${item.id}` : `/operators/${item.id}`}
          className="w-full py-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-t border-slate-100 bg-slate-100 hover:bg-slate-200 text-[#172263]"
        >
          <Search size={16} />
          {t("landing.directory.viewDetails", { ns: "pages", defaultValue: "View Details" })}
        </Link>
      ) : (
        <Link
          to={item.type === "harvester" ? `/harvesters/${item.id}` : `/operators/${item.id}`}
          className={`w-full py-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-t border-slate-100 ${item.type === "harvester"
              ? "bg-[#172263] hover:bg-[#11194A] text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
        >
          <MessageSquare size={16} />
          {item.type === "harvester" ? t("landing.directory.bookNow", { ns: "pages" }) : t("landing.directory.hireNow", { ns: "pages" })}
        </Link>
      )}
    </div>
  );
}

// ---- Loading Spinner ----
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-[#172263] rounded-full animate-spin" />
    </div>
  );
}

// ---- Error State ----
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation(["pages"]);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="text-red-400 mb-4" size={48} />
      <p className="text-[#57585A] mb-4">{message || t("shared.somethingWentWrong", { defaultValue: "Something went wrong" })}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors"
        >
          <RefreshCw size={16} /> {t("shared.retry", { defaultValue: "Retry" })}
        </button>
      )}
    </div>
  );
}

// ---- Empty State ----
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-blue-200 mb-4">
        {icon || <InboxIcon size={48} />}
      </div>
      <h3
        className="text-xl text-[#1A1A1A] mb-2"
        style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-[#57585A] mb-6 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ---- Tractor SVG Illustration ----
export function TractorIllustration({
  size = 120,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 200 140"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <rect x="70" y="50" width="90" height="50" rx="8" fill="#172263" />
      {/* Cab */}
      <rect x="110" y="25" width="50" height="35" rx="6" fill="#11194A" />
      {/* Window */}
      <rect x="118" y="32" width="34" height="20" rx="4" fill="#F4F6FA" opacity="0.8" />
      {/* Hood */}
      <rect x="70" y="55" width="45" height="25" rx="5" fill="#D97706" />
      {/* Exhaust */}
      <rect x="105" y="20" width="6" height="20" rx="3" fill="#92400E" />
      {/* Exhaust smoke */}
      <circle cx="108" cy="15" r="4" fill="#57585A" opacity="0.3" />
      <circle cx="110" cy="8" r="3" fill="#57585A" opacity="0.2" />
      {/* Large rear wheel */}
      <circle cx="100" cy="105" r="32" fill="#1A1A1A" />
      <circle cx="100" cy="105" r="24" fill="#2D1B0A" />
      <circle cx="100" cy="105" r="10" fill="#92400E" />
      {/* Wheel spokes */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <line
          key={i}
          x1={100 + 10 * Math.cos((angle * Math.PI) / 180)}
          y1={105 + 10 * Math.sin((angle * Math.PI) / 180)}
          x2={100 + 24 * Math.cos((angle * Math.PI) / 180)}
          y2={105 + 24 * Math.sin((angle * Math.PI) / 180)}
          stroke="#92400E"
          strokeWidth="3"
        />
      ))}
      {/* Small front wheel */}
      <circle cx="160" cy="108" r="18" fill="#1A1A1A" />
      <circle cx="160" cy="108" r="12" fill="#2D1B0A" />
      <circle cx="160" cy="108" r="5" fill="#92400E" />
      {/* Headlight */}
      <circle cx="165" cy="65" r="5" fill="#F4F6FA" />
      <circle cx="165" cy="65" r="3" fill="#FBBF24" />
      {/* Ground line */}
      <line x1="30" y1="126" x2="190" y2="126" stroke="#E2E8F0" strokeWidth="2" />
    </svg>
  );
}

// ---- Wheat SVG watermark ----
export function WheatWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute opacity-[0.04] pointer-events-none ${className}`}
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
    >
      <line x1="100" y1="200" x2="100" y2="0" stroke="#172263" strokeWidth="3" />
      {[30, 50, 70, 90, 110, 130, 150, 170].map((y, i) => (
        <g key={i}>
          <ellipse cx={100 - 18} cy={y} rx="15" ry="7" fill="#172263" transform={`rotate(-30,${100 - 18},${y})`} />
          <ellipse cx={100 + 18} cy={y} rx="15" ry="7" fill="#172263" transform={`rotate(30,${100 + 18},${y})`} />
        </g>
      ))}
    </svg>
  );
}

export function OperatorCard({
  id,
  name,
  location,
  experience,
  machineExpertise,
  availability,
  imagePath,
  image_path,
  isOwner,
  verification_status,
}: {
  id: string | number;
  name: string;
  location: string;
  experience: number;
  machineExpertise: string[];
  availability: string;
  imagePath?: string;
  image_path?: string;
  isOwner?: boolean;
  verification_status?: string;
}) {
  const { t } = useTranslation(["pages", "static", "shared"]);
  const finalImage = imagePath || image_path;
  const isPreview = !localStorage.getItem("tractorsewa_token") && localStorage.getItem("tractorsewa_preview_mode") === "true";

  return (
    <Link to={`/operators/${id}`} className="block group h-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-[0_2px_12px_rgba(23,34,99,0.04)] hover:shadow-[0_8px_24px_rgba(23,34,99,0.08)] transition-all duration-300 hover:scale-[1.01] h-full flex flex-col justify-between">
        {/* Top Cover Block */}
        <div className="h-16 bg-gradient-to-r from-[#172263]/5 to-[#E82326]/5 relative shrink-0">
          {isOwner && (
            <span className="absolute top-2.5 left-2.5 text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full font-bold shadow-sm z-10">
              {t("shared.myListing", { defaultValue: "My Listing" })}
            </span>
          )}
          <WheatWatermark className="right-0 top-0 opacity-40 scale-75" />
        </div>

        {/* Content Section */}
        <div className="px-4 pb-4 flex-1 flex flex-col justify-between -mt-6">
          <div>
            {/* Avatar - Rounded 2xl square, matching profile avatar */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#172263] via-[#E82326] to-amber-500 p-[2px] ring-2 ring-white mb-2 overflow-hidden shadow-md shrink-0">
              <div className="w-full h-full rounded-lg bg-white p-[1px]">
                <div className="w-full h-full rounded-md bg-[#F4F6FA] flex items-center justify-center overflow-hidden">
                  {finalImage ? (
                    <img src={finalImage} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#172263] text-lg font-bold">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <h3
              className="text-[#1A1A1A] text-sm font-bold line-clamp-1 mb-0.5 flex items-center gap-1"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              <span><DynamicText>{name}</DynamicText></span>
              {verification_status === 'Approved' && (
                <span title="Verified Operator">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0 animate-pulse" />
                </span>
              )}
            </h3>

            {/* Location */}
            <p className="text-[#57585A] text-xs flex items-center gap-1 mb-2 font-medium line-clamp-1">
              <MapPin size={11} className="text-[#E82326]" /> <DynamicText>{location}</DynamicText>
            </p>

            {/* Machine Expertise badges (fixed height container with slice) */}
            <div className="flex items-center gap-1 mb-3 flex-wrap min-h-[22px] overflow-hidden">
              {machineExpertise.slice(0, 2).map((m, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 bg-[#F4F6FA] text-[#172263] border border-[#172263]/10 rounded-full font-medium truncate max-w-[100px]"
                >
                  {t("machineTypes." + m, { ns: "static", defaultValue: m })}
                </span>
              ))}
              {machineExpertise.length > 2 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-150 text-zinc-500 rounded-full font-bold">
                  +{machineExpertise.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* Footer stats / badge */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-2 shrink-0">
            <AvailabilityBadge status={availability} />
            <span className="text-[10px] text-[#57585A] font-semibold flex items-center gap-1 uppercase tracking-wider">
              <Award size={12} className="text-amber-500" /> {t("exploreOperators.yrsExp", { count: experience, defaultValue: `${experience} Yrs Exp` })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function getFirstImage(imagePath?: string | null): string {
  if (!imagePath) return "";
  const trimmed = imagePath.trim();
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0];
      }
    } catch (e) {}
  }
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",");
    if (parts.length > 0) return parts[0].trim();
  }
  return trimmed;
}

// ---- Harvester Card ----
export function HarvesterCard({
  id,
  machineName,
  company,
  model,
  location,
  ownerName,
  ownerProfilePic,
  imagePath,
  isOwner,
}: {
  id: string | number;
  name?: string;
  machineName: string;
  company: string;
  model: string;
  location: string;
  ownerName: string;
  ownerProfilePic?: string;
  imagePath?: string;
  isOwner?: boolean;
}) {
  const { t } = useTranslation(["pages", "static", "shared"]);
  const isPreview = !localStorage.getItem("tractorsewa_token") && localStorage.getItem("tractorsewa_preview_mode") === "true";

  const displayImage = getFirstImage(imagePath);

  return (
    <Link to={`/harvesters/${id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300 hover:scale-[1.02]">
        <div className="h-44 bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
          {displayImage ? (
            <img src={displayImage} alt={machineName} className="w-full h-full object-cover" />
          ) : (
            <TractorIllustration size={130} />
          )}
          {isOwner && (
            <span className="absolute top-3 left-3 text-xs px-2 py-1 bg-green-100 border border-green-200 text-green-700 rounded-full font-semibold shadow-sm">
              {t("shared.myListing", { defaultValue: "My Listing" })}
            </span>
          )}
          <span className="absolute top-3 right-3 text-xs px-2 py-1 bg-white border border-[#E2E8F0] rounded-full text-[#57585A] shadow-sm">
            {t("companies." + company, { ns: "static", defaultValue: company })}
          </span>
          <WheatWatermark className="left-0 top-0" />
        </div>
        <div className="p-4">
          <h3
            className="text-[#1A1A1A] text-base mb-0.5"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            <DynamicText>{machineName}</DynamicText>
          </h3>
          <p className="text-[#57585A] text-sm mb-2"><DynamicText>{model}</DynamicText></p>
          <p className="text-[#57585A] text-sm flex items-center gap-1 mb-3">
            <MapPin size={12} /> <DynamicText>{location}</DynamicText>
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center overflow-hidden shrink-0">
              {ownerProfilePic ? (
                <img src={ownerProfilePic} alt={ownerName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{ownerName.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs text-[#57585A]"><DynamicText>{t("exploreHarvesters.owner", { name: ownerName, defaultValue: `Owner: ${ownerName}` })}</DynamicText></span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---- Blog Card ----
export function BlogCard({
  id,
  title,
  category,
  shortDescription,
  date,
  image_url,
}: {
  id: string | number;
  title: string;
  category: string;
  shortDescription: string;
  date: string;
  image_url?: string;
}) {
  const { t } = useTranslation(["pages"]);
  
  const fallbackImages = [
    "/login-bg.png"
  ];
  const imgIndex = typeof id === 'number' ? id % fallbackImages.length : String(id).length % fallbackImages.length;
  const finalImageUrl = image_url || fallbackImages[imgIndex];

  return (
    <Link to={`/blogs/${id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300">
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img
            src={finalImageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.currentTarget;
              const fallback = "/login-bg.png";
              if (target.src !== window.location.origin + fallback) {
                target.src = fallback;
              }
            }}
          />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full">
              <DynamicText>{category}</DynamicText>
            </span>
            <span className="text-xs text-[#57585A]">{date}</span>
          </div>
          <h3
            className="text-[#1A1A1A] text-base mb-2 line-clamp-2"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            <DynamicText>{title}</DynamicText>
          </h3>
          <p className="text-[#57585A] text-sm line-clamp-2 mb-4"><DynamicText>{shortDescription}</DynamicText></p>
          <span className="text-[#172263] text-sm font-medium group-hover:underline">
            {t("blogs.readMore", { ns: "pages" })} →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---- Auth Chooser Dialog ----
export function AuthChooserDialog({
  isOpen,
  onClose,
  initialMode = "login",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}) {
  const { t } = useTranslation(["common", "auth", "pages"]);
  const navigate = useNavigate();

  const handleProceed = () => {
    onClose();
    navigate(initialMode === "register" ? "/register" : "/login");
  };

  const handleMaybeLater = () => {
    localStorage.setItem("tractorsewa_preview_mode", "true");
    localStorage.removeItem("tractorsewa_token"); // Clear any invalid token
    onClose();
    navigate("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#ffffff] border-[#E2E8F0] p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#1A1A1A] text-center" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
            {t("landing.title", { ns: "pages" })}
          </DialogTitle>
          <DialogDescription className="text-[#57585A] text-center mt-2 leading-relaxed text-sm">
            {t("landing.subtitle", { ns: "pages" })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleProceed}
            className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors text-sm font-semibold shadow-[0_4px_14px_rgba(232,114,12,0.2)]"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {initialMode === "register" ? t("nav.register", { ns: "common" }) : t("nav.login", { ns: "common" })}
          </button>
          <button
            onClick={handleMaybeLater}
            className="w-full py-3 border-2 border-[#E2E8F0] bg-white text-[#57585A] hover:bg-blue-50 hover:text-[#172263] transition-colors rounded-xl text-sm font-semibold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {t("landing.maybeLater", { ns: "pages", defaultValue: "Maybe Later" })}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Auth Required Dialog ----
export function AuthRequiredDialog({
  isOpen,
  onClose,
  targetPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  targetPath?: string;
}) {
  const { t } = useTranslation(["common", "auth", "pages"]);
  const navigate = useNavigate();

  const handleAction = (mode: "login" | "register") => {
    if (targetPath) {
      localStorage.setItem("tractorsewa_redirect_after_auth", targetPath);
    }
    onClose();
    navigate(mode === "register" ? "/register" : "/login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#ffffff] border-[#E2E8F0] p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#1A1A1A] text-center" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
            {t("shared.authRequired", { ns: "pages", defaultValue: "Authentication Required 🔒" })}
          </DialogTitle>
          <DialogDescription className="text-[#57585A] text-center mt-2 leading-relaxed text-sm">
            {t("shared.authRequiredDesc", { ns: "pages", defaultValue: "You need an active account to view operator profiles, browse harvesters, view requests, or send messages." })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAction("login")}
              className="py-3 border-2 border-[#172263] text-[#172263] hover:bg-blue-50 rounded-xl text-sm font-semibold transition-colors"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {t("nav.login", { ns: "common" })}
            </button>
            <button
              onClick={() => handleAction("register")}
              className="py-3 bg-[#172263] text-white hover:bg-[#11194A] rounded-xl text-sm font-semibold transition-colors shadow-[0_4px_14px_rgba(232,114,12,0.2)]"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {t("nav.register", { ns: "common" })}
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-[#E2E8F0] bg-white text-[#57585A] hover:bg-gray-50 transition-colors rounded-xl text-xs font-medium"
          >
            {t("shared.backToPreview", { ns: "pages", defaultValue: "Back to Preview" })}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Language Switcher ----
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");
  const [languages, setLanguages] = useState<any[]>([
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी" },
    { code: "mr", label: "मराठी" },
  ]);

  useEffect(() => {
    const fetchLangs = async () => {
      try {
        const res = await fetch("/api/languages");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setLanguages(data);
          }
        }
      } catch (err) {
        console.error("Error fetching languages:", err);
      }
    };
    fetchLangs();
  }, []);

  const currentLang = languages.find((l) => l.code === i18n.language) || { code: "en", label: "English" };
  const shortLabel = currentLang.code === "en" ? "Eng" : currentLang.code === "hi" ? "Hin" : currentLang.code === "mr" ? "Mar" : currentLang.label.substring(0, 3);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-[#57585A] hover:text-[#172263] transition-colors rounded-xl hover:bg-blue-50 text-sm">
          <Globe size={16} />
          <span className="hidden sm:inline">{shortLabel}</span>
          <ChevronDown size={13} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-[#E2E8F0] rounded-xl min-w-[120px] max-h-[300px] overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`cursor-pointer ${i18n.language === lang.code ? "bg-blue-50 text-[#172263] font-semibold" : ""}`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---- Navbar ----
export function Navbar({ variant = "public" }: { variant?: "public" | "auth" }) {
  const { t } = useTranslation(["common", "dashboard", "pages"]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState(() => localStorage.getItem("tractorsewa_user_role") || "user");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // User notifications states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);

  // Dialog state
  const [chooserOpen, setChooserOpen] = useState(false);
  const [chooserMode, setChooserMode] = useState<"login" | "register">("login");
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("");

  const [isInstallable, setIsInstallable] = useState(!!(window as any).deferredPrompt);

  useEffect(() => {
    const handleInstallable = () => setIsInstallable(true);
    const handleInstalled = () => setIsInstallable(false);

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`PWA install prompt user choice: ${outcome}`);
    (window as any).deferredPrompt = null;
    setIsInstallable(false);
  };

  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    // Unsubscribe from push notifications on logout
    await unsubscribeFromPush();

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout API error:", err);
    }
    localStorage.removeItem("tractorsewa_token");
    localStorage.removeItem("tractorsewa_preview_mode");
    localStorage.removeItem("tractorsewa_user_role");
    navigate("/");
  };

  const token = localStorage.getItem("tractorsewa_token");
  const isAuthenticated = !!token;
  const isPreview = !token && localStorage.getItem("tractorsewa_preview_mode") === "true";

  useEffect(() => {
    if (token) {
      localStorage.removeItem("tractorsewa_preview_mode");
    }
  }, [token]);

  const actualVariant = isAuthenticated ? "auth" : variant;

  const fetchUser = () => {
    if (isAuthenticated && token) {
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403 || res.status === 404) {
              logout();
            }
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (!data) return;
          if (data.name) {
            setUserName(data.name);
            setUserRole(data.role || "user");
            localStorage.setItem("tractorsewa_user_role", data.role || "user");
            setUserImage(data.imagePath || data.image || null);
          }
        })
        .catch(() => { /* silently handle – token likely expired */ });
    }
  };

  const fetchUnreadCount = () => {
    if (isAuthenticated && token) {
      fetch("/api/messages/unread", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setUnreadCount(Array.isArray(data) ? data.length : 0);
        })
        .catch(err => console.error("Failed to fetch unread messages count:", err));
    }
  };

  useEffect(() => {
    fetchUser();
    window.addEventListener("user-profile-updated", fetchUser);
    return () => window.removeEventListener("user-profile-updated", fetchUser);
  }, [isAuthenticated, token]);

  const fetchNotifications = () => {
    if (isAuthenticated && token) {
      fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data);
            setNotifUnreadCount(data.filter((n: any) => !n.isRead).length);
          }
        })
        .catch(err => console.error("Failed to fetch notifications:", err));
    }
  };

  const handleNotifClick = async (notif: any) => {
    // 1. Mark as read on backend (if it's not a message and is not already read)
    if (notif.type !== 'message' && !notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    } else if (notif.type === 'message') {
      // Mark message as read
      try {
        await fetch(`/api/messages/unread/mark-read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ messageIds: [notif.id] })
        });
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    }

    // 2. Perform navigation
    if (notif.type === 'message') {
      navigate(`/messages?userId=${notif.senderId}`);
    } else if (notif.type.includes('operator') && notif.targetId) {
      navigate(`/operators/${notif.targetId}`);
    } else if (notif.type.includes('harvester') && notif.targetId) {
      navigate(`/harvesters/${notif.targetId}`);
    } else if (notif.type.includes('machine') && notif.targetId) {
      navigate(`/harvesters/${notif.targetId}`);
    } else if (notif.type.includes('rating') && notif.targetId) {
      // General ratings fallback checking type name prefix
      if (notif.type.endsWith('operator')) {
        navigate(`/operators/${notif.targetId}`);
      } else {
        navigate(`/harvesters/${notif.targetId}`);
      }
    } else if (notif.type.includes('comment') && notif.targetId) {
      if (notif.type.endsWith('operator')) {
        navigate(`/operators/${notif.targetId}`);
      } else {
        navigate(`/harvesters/${notif.targetId}`);
      }
    } else if (notif.type.includes('harvester')) {
      navigate('/profile?tab=listings');
    } else if (notif.type.includes('operator')) {
      navigate('/profile?tab=operator');
    } else {
      navigate('/dashboard');
    }

    // 3. Immediately filter out from list so it disappears
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setNotifUnreadCount(prev => Math.max(0, prev - 1));
    setShowNotifications(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Also mark messages as read
      if (notifications.some(n => n.type === 'message')) {
        const msgIds = notifications.filter(n => n.type === 'message').map(n => n.id);
        if (msgIds.length > 0) {
          await fetch(`/api/messages/unread/mark-read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ messageIds: msgIds })
          });
        }
      }
      setNotifications([]);
      setNotifUnreadCount(0);
      setShowNotifications(false);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token, location.pathname]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token, location.pathname]);

  // Listen for the global trigger-auth-required event
  useEffect(() => {
    const handleAuthRequiredEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const path = customEvent.detail?.redirectPath || "";
      setPendingPath(path);
      setAuthRequiredOpen(true);
    };

    window.addEventListener("trigger-auth-required", handleAuthRequiredEvent);
    return () => {
      window.removeEventListener("trigger-auth-required", handleAuthRequiredEvent);
    };
  }, []);

  const handleNavbarAuthClick = (e: React.MouseEvent, mode: "login" | "register") => {
    if (actualVariant === "public" && !isPreview) {
      e.preventDefault();
      setChooserMode(mode);
      setChooserOpen(true);
    }
  };

  const navItems = userRole === 'admin'
    ? [
        { to: "/admin", label: t("sidebar.admin", { ns: "dashboard" }), icon: <Settings size={18} /> },
        { to: "/blogs", label: t("sidebar.blogs", { ns: "dashboard" }), icon: <BookOpen size={18} /> }
      ]
    : [
        { to: "/dashboard", label: t("nav.home", { ns: "common" }), icon: <Home size={18} /> },
        { to: "/harvesters", label: t("harvesters.title", { ns: "dashboard" }), icon: <Tractor size={18} /> },
        { to: "/operators", label: t("operators.title", { ns: "dashboard" }), icon: <User size={18} /> },
        { to: "/blogs", label: t("sidebar.blogs", { ns: "dashboard" }), icon: <BookOpen size={18} /> },
      ];

  const mobileItems = userRole === 'admin'
    ? [
        { to: "/admin", label: t("sidebar.admin", { ns: "dashboard" }) },
        { to: "/blogs", label: t("sidebar.blogs", { ns: "dashboard" }) }
      ]
    : [
        { to: "/dashboard", label: t("sidebar.dashboard", { ns: "dashboard" }) },
        { to: "/harvesters", label: t("harvesters.title", { ns: "dashboard" }) },
        { to: "/operators", label: t("operators.title", { ns: "dashboard" }) },
        { to: "/messages", label: t("sidebar.messages", { ns: "dashboard" }) },
        { to: "/blogs", label: t("sidebar.blogs", { ns: "dashboard" }) },
        { to: "/add-harvester", label: t("shared.addHarvester", { ns: "pages", defaultValue: "Add Harvester" }) },
        { to: "/add-operator", label: t("shared.addOperator", { ns: "pages", defaultValue: "Add Operator" }) },
        { to: "/profile", label: t("sidebar.profile", { ns: "dashboard" }) },
        { to: "/requests", label: t("sidebar.requests", { ns: "dashboard" }) },
      ];

  return (
    <nav className="sticky top-0 z-50 bg-[#ffffff]/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={tractorSevaLogo} alt="Tractor Seva" className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        {actualVariant === "public" || location.pathname === "/" ? (
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {[
              { label: t("nav.home", { ns: "common", defaultValue: "Home" }), anchor: "top" },
              { label: t("landing.howItWorks", { ns: "pages", defaultValue: "How It Works" }), anchor: "how-it-works" },
              { label: t("landing.features", { ns: "pages", defaultValue: "Features" }), anchor: "features" },
              { label: t("nav.faq", { ns: "common", defaultValue: "FAQ" }), anchor: "faq" },
              { label: t("nav.contact", { ns: "common", defaultValue: "Contact" }), anchor: "contact" },
            ].map((item) => (
              <a
                key={item.anchor}
                href={`#${item.anchor}`}
                onClick={(e) => {
                  if (location.pathname === "/") {
                    e.preventDefault();
                    if (item.anchor === "top") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      document.getElementById(item.anchor)?.scrollIntoView({ behavior: "smooth" });
                    }
                  } else {
                    if (item.anchor === "top") {
                      e.preventDefault();
                      navigate("/");
                    } else {
                      e.preventDefault();
                      navigate(`/#${item.anchor}`);
                    }
                  }
                }}
                className="text-sm text-[#57585A] hover:text-[#172263] transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : (isAuthenticated || isPreview) && (
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={(e) => {
                  if (isPreview && item.to !== "/dashboard" && item.to !== "/blogs") {
                    e.preventDefault();
                    setPendingPath(item.to);
                    setAuthRequiredOpen(true);
                  }
                }}
                className="flex items-center gap-2 text-base text-[#57585A] hover:text-[#172263] transition-colors"
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {userRole !== 'admin' && location.pathname !== "/" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors">
                      <Plus size={15} /> {t("shared.addListing", { ns: "pages", defaultValue: "Add Listing" })} <ChevronDown size={13} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-[#E2E8F0] rounded-xl">
                    <DropdownMenuItem asChild>
                      <Link to="/add-harvester" className="flex items-center gap-2 cursor-pointer">
                        <Tractor size={15} /> {t("shared.addHarvester", { ns: "pages", defaultValue: "Add Harvester" })}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/add-operator" className="flex items-center gap-2 cursor-pointer">
                        <User size={15} /> {t("shared.addOperator", { ns: "pages", defaultValue: "Add Operator" })}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-[#57585A] hover:text-[#172263] hover:bg-zinc-100 rounded-full transition relative cursor-pointer focus:outline-none"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {notifUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {notifUnreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A] font-sora">Alerts</span>
                        {notifUnreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-[#172263] hover:underline font-bold cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition flex gap-3 items-start group cursor-pointer"
                            >
                              <div className="mt-0.5 p-1.5 bg-slate-100 group-hover:bg-[#172263]/10 rounded-lg text-[#57585A] group-hover:text-[#172263] transition-colors shrink-0">
                                {notif.type === 'message' ? (
                                  <MessageSquare size={14} />
                                ) : notif.type === 'rating' ? (
                                  <Star size={14} fill="currentColor" />
                                ) : notif.type === 'comment' ? (
                                  <MessageSquare size={14} />
                                ) : notif.type.includes('verification') ? (
                                  <UserCheck size={14} />
                                ) : (
                                  <Bell size={14} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1A1A1A] leading-snug group-hover:text-[#172263] transition-colors break-words">
                                  {notif.message}
                                </p>
                                <p className="text-[9px] text-zinc-400 font-bold mt-1">
                                  {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-1.5" />
                            <p className="text-xs text-[#57585A] font-semibold">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45F06] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] mr-2 uppercase tracking-wider cursor-pointer"
                >
                  <Smartphone size={13} /> Install App
                </button>
              )}
              <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity overflow-hidden border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#172263] focus:ring-offset-2 relative">
                    <Avatar className="w-full h-full rounded-full">
                      {userImage ? <AvatarImage src={userImage} alt={userName} /> : null}
                      <AvatarFallback className="bg-gradient-to-br from-[#172263] to-[#D97706] text-white">
                        {userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D97706] border border-white rounded-full animate-pulse" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-[#E2E8F0] rounded-xl">
                  {userRole === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Settings size={15} /> {t("sidebar.admin", { ns: "dashboard", defaultValue: "Admin Dashboard" })}
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                          <User size={15} /> {t("shared.viewProfile", { ns: "pages", defaultValue: "View Profile" })}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=listings" className="flex items-center gap-2 cursor-pointer">
                          <Tractor size={15} /> {t("exploreHarvesters.myHarvesters", { ns: "pages", defaultValue: "My Harvesters" })}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile?tab=operator" className="flex items-center gap-2 cursor-pointer">
                          <UserCheck size={15} /> {t("exploreOperators.myOperators", { ns: "pages", defaultValue: "My Operators" })}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/requests" className="flex items-center gap-2 cursor-pointer">
                          <FileText size={15} /> {t("exploreHarvesters.myRequests", { ns: "pages", defaultValue: "My Requests" })}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                          <Settings size={15} /> {t("sidebar.settings", { ns: "dashboard", defaultValue: "Settings" })}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/messages" className="flex items-center gap-2 cursor-pointer">
                          <div className="relative">
                            <Bell size={15} />
                            {unreadCount > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#D97706] rounded-full" />
                            )}
                          </div>
                          {t("sidebar.messages", { ns: "dashboard", defaultValue: "Messages" })}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={15} /> {t("nav.logout", { ns: "common", defaultValue: "Logout" })}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              

            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={(e) => handleNavbarAuthClick(e, "login")}
                className="hidden sm:block px-4 py-2 border-2 border-[#172263] text-[#172263] rounded-xl text-sm hover:bg-blue-50 transition-colors"
              >
                {t("nav.login", { ns: "common" })}
              </Link>
              <Link
                to="/register"
                onClick={(e) => handleNavbarAuthClick(e, "register")}
                className="px-4 py-2 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors"
              >
                {t("nav.register", { ns: "common" })}
              </Link>
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45F06] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] mr-2 uppercase tracking-wider cursor-pointer"
                >
                  <Smartphone size={13} /> Install App
                </button>
              )}
              <LanguageSwitcher />
            </>
          )}

          <button
            className="md:hidden p-2 rounded-xl hover:bg-blue-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#ffffff] border-t border-[#E2E8F0] px-4 py-4 space-y-2">
          {location.pathname === "/" && (
            <div className="mb-2 pb-2 border-b border-[#E2E8F0] space-y-2">
              {[
                { label: t("nav.home", { ns: "common", defaultValue: "Home" }), anchor: "top" },
                { label: t("landing.howItWorks", { ns: "pages", defaultValue: "How It Works" }), anchor: "how-it-works" },
                { label: t("landing.features", { ns: "pages", defaultValue: "Features" }), anchor: "features" },
                { label: t("nav.faq", { ns: "common", defaultValue: "FAQ" }), anchor: "faq" },
                { label: t("nav.contact", { ns: "common", defaultValue: "Contact" }), anchor: "contact" },
              ].map((item) => (
                <a
                  key={item.anchor}
                  href={`#${item.anchor}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.anchor === "top") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      document.getElementById(item.anchor)?.scrollIntoView({ behavior: "smooth" });
                    }
                    setMobileOpen(false);
                  }}
                  className="block py-2 text-[#57585A] hover:text-[#172263] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
          {(isAuthenticated || isPreview) ? (
            <>
              {mobileItems.map((item) => {
                const isRestricted = isPreview && item.to !== "/dashboard" && item.to !== "/blogs";
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={(e) => {
                      if (isRestricted) {
                        e.preventDefault();
                        setPendingPath(item.to);
                        setAuthRequiredOpen(true);
                      }
                      setMobileOpen(false);
                    }}
                    className="flex justify-between items-center py-2 text-[#57585A] hover:text-[#172263] transition-colors"
                  >
                    <span>{item.label}</span>
                    {item.to === "/messages" && unreadCount > 0 && (
                      <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <button onClick={logout} className="block py-2 text-red-600 w-full text-left">
                  {t("nav.logout", { ns: "common", defaultValue: "Logout" })}
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/login" onClick={(e) => { handleNavbarAuthClick(e, "login"); setMobileOpen(false); }} className="block py-2 text-[#57585A]">{t("nav.login", { ns: "common", defaultValue: "Login" })}</Link>
              <Link to="/register" onClick={(e) => { handleNavbarAuthClick(e, "register"); setMobileOpen(false); }} className="block py-2 text-[#172263]">{t("nav.register", { ns: "common", defaultValue: "Sign Up" })}</Link>
            </>
          )}
          {isInstallable && (
            <div className="pt-2 mt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => {
                  handleInstallClick();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#D97706] hover:bg-[#B45F06] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] uppercase tracking-wider cursor-pointer"
              >
                <Smartphone size={16} /> Install App
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AuthChooserDialog
        isOpen={chooserOpen}
        onClose={() => setChooserOpen(false)}
        initialMode={chooserMode}
      />
      <AuthRequiredDialog
        isOpen={authRequiredOpen}
        onClose={() => setAuthRequiredOpen(false)}
        targetPath={pendingPath}
      />
    </nav>
  );
}

// ---- Protected Route ----
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("tractorsewa_token");
  const location = useLocation();

  // If user has a valid token, clear preview mode and allow access
  if (token) {
    localStorage.removeItem("tractorsewa_preview_mode");
    return <>{children}</>;
  }

  // User is not authenticated
  const isPreview = localStorage.getItem("tractorsewa_preview_mode") === "true";

  if (isPreview) {
    // Allow preview mode on dashboard, harvester listing/details, operator listing/details
    const path = location.pathname;
    const isAllowed = path === "/dashboard" ||
                      path === "/harvesters" ||
                      path === "/operators" ||
                      (path.startsWith("/harvesters/") && !path.endsWith("/edit")) ||
                      (path.startsWith("/operators/") && !path.endsWith("/edit"));

    if (isAllowed) {
      return <>{children}</>;
    }
    // Redirect to dashboard with auth required flag for other protected routes
    return (
      <Navigate
        to={`/dashboard?auth_required=true&redirect_path=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  // No token and not in preview mode - redirect directly to login screen
  return <Navigate to="/login" replace />;
}

// ---- Dynamic Translation Component ----
export function DynamicText({ children }: { children: string }) {
  const { i18n } = useTranslation();
  const [translated, setTranslated] = useState(children);

  useEffect(() => {
    if (!children || typeof children !== "string" || !children.trim()) {
      setTranslated(children);
      return;
    }

    if (i18n.language === "en") {
      setTranslated(children);
      return;
    }

    let isMounted = true;
    const translate = async () => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: children, targetLang: i18n.language })
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setTranslated(data.translation);
          }
        }
      } catch (err) {
        console.error("Dynamic translation failed:", err);
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [children, i18n.language]);

  return <>{translated}</>;
}



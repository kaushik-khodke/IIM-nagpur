import { ReactNode } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router";
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
  Plus,
  Settings,
  FileText,
  MessageSquare,
  Home,
  RefreshCw,
  AlertCircle,
  InboxIcon,
  Globe,
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
import { Avatar, AvatarFallback } from "./ui/avatar";

// ---- Availability Badge ----
export function AvailabilityBadge({ status }: { status: string }) {
  if (status === "Available")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 size={11} /> Available
      </span>
    );
  if (status === "Busy")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
        <Clock size={11} /> Busy
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 border border-red-200">
      <XCircle size={11} /> Not Available
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
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="text-red-400 mb-4" size={48} />
      <p className="text-[#57585A] mb-4">{message || "Something went wrong"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors"
        >
          <RefreshCw size={16} /> Retry
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
  isOwner,
}: {
  id: string | number;
  name: string;
  location: string;
  experience: number;
  machineExpertise: string[];
  availability: string;
  imagePath?: string;
  isOwner?: boolean;
}) {
  const isPreview = localStorage.getItem("tractorsewa_preview_mode") === "true";

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("trigger-auth-required", {
        detail: { redirectPath: `/operators/${id}` }
      }));
    }
  };

  return (
    <Link to={`/operators/${id}`} onClick={handleClick} className="block group h-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-[0_2px_12px_rgba(23,34,99,0.04)] hover:shadow-[0_8px_24px_rgba(23,34,99,0.08)] transition-all duration-300 hover:scale-[1.01] h-full flex flex-col justify-between">
        {/* Top Cover Block */}
        <div className="h-16 bg-gradient-to-r from-[#172263]/5 to-[#E82326]/5 relative shrink-0">
          {isOwner && (
            <span className="absolute top-2.5 left-2.5 text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full font-bold shadow-sm z-10">
              My Listing
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
                  {imagePath ? (
                    <img src={imagePath} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#172263] text-lg font-bold">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <h3
              className="text-[#1A1A1A] text-sm font-bold line-clamp-1 mb-0.5"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {name}
            </h3>

            {/* Location */}
            <p className="text-[#57585A] text-xs flex items-center gap-1 mb-2 font-medium line-clamp-1">
              <MapPin size={11} className="text-[#E82326]" /> {location}
            </p>

            {/* Machine Expertise badges (fixed height container with slice) */}
            <div className="flex items-center gap-1 mb-3 flex-wrap min-h-[22px] overflow-hidden">
              {machineExpertise.slice(0, 2).map((m, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 bg-[#F4F6FA] text-[#172263] border border-[#172263]/10 rounded-full font-medium truncate max-w-[100px]"
                >
                  {m}
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
              <Award size={12} className="text-amber-500" /> {experience} Yrs Exp
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---- Harvester Card ----
export function HarvesterCard({
  id,
  machineName,
  company,
  model,
  location,
  ownerName,
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
  imagePath?: string;
  isOwner?: boolean;
}) {
  const isPreview = localStorage.getItem("tractorsewa_preview_mode") === "true";

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("trigger-auth-required", {
        detail: { redirectPath: `/harvesters/${id}` }
      }));
    }
  };

  return (
    <Link to={`/harvesters/${id}`} onClick={handleClick} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300 hover:scale-[1.02]">
        <div className="h-44 bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
          {imagePath ? (
            <img src={imagePath} alt={machineName} className="w-full h-full object-cover" />
          ) : (
            <TractorIllustration size={130} />
          )}
          {isOwner && (
            <span className="absolute top-3 left-3 text-xs px-2 py-1 bg-green-100 border border-green-200 text-green-700 rounded-full font-semibold shadow-sm">
              My Listing
            </span>
          )}
          <span className="absolute top-3 right-3 text-xs px-2 py-1 bg-white border border-[#E2E8F0] rounded-full text-[#57585A] shadow-sm">
            {company}
          </span>
          <WheatWatermark className="left-0 top-0" />
        </div>
        <div className="p-4">
          <h3
            className="text-[#1A1A1A] text-base mb-0.5"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {machineName}
          </h3>
          <p className="text-[#57585A] text-sm mb-2">{model}</p>
          <p className="text-[#57585A] text-sm flex items-center gap-1 mb-3">
            <MapPin size={12} /> {location}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center">
              <span className="text-white text-xs font-bold">{ownerName.charAt(0)}</span>
            </div>
            <span className="text-xs text-[#57585A]">Owner: {ownerName}</span>
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
              {category}
            </span>
            <span className="text-xs text-[#57585A]">{date}</span>
          </div>
          <h3
            className="text-[#1A1A1A] text-base mb-2 line-clamp-2"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {title}
          </h3>
          <p className="text-[#57585A] text-sm line-clamp-2 mb-4">{shortDescription}</p>
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
            Maybe Later
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
  const { t } = useTranslation(["common", "auth"]);
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
            Authentication Required 🔒
          </DialogTitle>
          <DialogDescription className="text-[#57585A] text-center mt-2 leading-relaxed text-sm">
            You need an active account to view operator profiles, browse harvesters, view requests, or send messages.
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
            Back to Preview
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Language Switcher ----
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");

  const languages = [
    { code: "en", label: "English", short: "Eng" },
    { code: "hi", label: "हिन्दी", short: "Hin" },
    { code: "mr", label: "मराठी", short: "Mar" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-[#57585A] hover:text-[#172263] transition-colors rounded-xl hover:bg-blue-50 text-sm">
          <Globe size={16} />
          <span className="hidden sm:inline">{languages.find((l) => l.code === i18n.language)?.short || "Eng"}</span>
          <ChevronDown size={13} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-[#E2E8F0] rounded-xl min-w-[120px]">
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
  const { t } = useTranslation("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("user");
  const [userImage, setUserImage] = useState<string | null>(null);

  // Dialog state
  const [chooserOpen, setChooserOpen] = useState(false);
  const [chooserMode, setChooserMode] = useState<"login" | "register">("login");
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("tractorsewa_token");
    localStorage.removeItem("tractorsewa_preview_mode");
    navigate("/");
  };

  const token = localStorage.getItem("tractorsewa_token");
  const isAuthenticated = !!token;
  const isPreview = localStorage.getItem("tractorsewa_preview_mode") === "true";

  const actualVariant = isAuthenticated ? "auth" : variant;

  const fetchUser = () => {
    if (isAuthenticated && token) {
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            logout();
            throw new Error("Session invalid");
          }
          return res.json();
        })
        .then(data => {
          if (data && data.name) {
            setUserName(data.name);
            setUserRole(data.role || "user");
            setUserImage(data.imagePath || data.image || null);
          } else {
            logout();
          }
        })
        .catch(err => console.error("Error fetching user in Navbar:", err));
    }
  };

  useEffect(() => {
    fetchUser();
    window.addEventListener("user-profile-updated", fetchUser);
    return () => window.removeEventListener("user-profile-updated", fetchUser);
  }, [isAuthenticated, token]);

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
        { to: "/add-harvester", label: t("buttons.add", { ns: "common" }) + " Harvester" },
        { to: "/add-operator", label: t("buttons.add", { ns: "common" }) + " Operator" },
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
        {actualVariant === "public" ? (
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {[
              { label: "Home", anchor: "top" },
              { label: "How it Works", anchor: "how-it-works" },
              { label: "Features", anchor: "features" },
              { label: "Contact", anchor: "contact" },
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
              {userRole !== 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors">
                      <Plus size={15} /> Add Listing <ChevronDown size={13} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-[#E2E8F0] rounded-xl">
                    <DropdownMenuItem asChild>
                      <Link to="/add-harvester" className="flex items-center gap-2 cursor-pointer">
                        <Tractor size={15} /> Add Harvester
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/add-operator" className="flex items-center gap-2 cursor-pointer">
                        <User size={15} /> Add Operator
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity overflow-hidden border border-[#E2E8F0]">
                    {userImage ? (
                      <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      userName.charAt(0)
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-[#E2E8F0] rounded-xl">
                  {userRole === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Settings size={15} /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                          <User size={15} /> View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/harvesters?tab=mine" className="flex items-center gap-2 cursor-pointer">
                          <Tractor size={15} /> My Harvesters
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/requests" className="flex items-center gap-2 cursor-pointer">
                          <FileText size={15} /> My Requests
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile/edit" className="flex items-center gap-2 cursor-pointer">
                          <Settings size={15} /> Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/messages" className="flex items-center gap-2 cursor-pointer">
                          <div className="relative">
                            <Bell size={15} />
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#172263] rounded-full" />
                          </div>
                          Messages
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={15} /> Logout
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
                    className="block py-2 text-[#57585A] hover:text-[#172263] transition-colors"
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <button onClick={logout} className="block py-2 text-red-600 w-full text-left">
                  Logout
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/login" onClick={(e) => { handleNavbarAuthClick(e, "login"); setMobileOpen(false); }} className="block py-2 text-[#57585A]">Login</Link>
              <Link to="/register" onClick={(e) => { handleNavbarAuthClick(e, "register"); setMobileOpen(false); }} className="block py-2 text-[#172263]">Sign Up</Link>
            </>
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
  const isPreview = localStorage.getItem("tractorsewa_preview_mode") === "true";
  const location = useLocation();

  if (!token) {
    if (isPreview) {
      if (location.pathname === "/dashboard") {
        return <>{children}</>;
      }
      return (
        <Navigate
          to={`/dashboard?auth_required=true&redirect_path=${encodeURIComponent(
            location.pathname + location.search
          )}`}
          replace
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center">
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }} className="text-2xl text-[#1A1A1A] mb-4">
            Please login to continue
          </h2>
          <Link
            to="/login"
            className="px-6 py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}



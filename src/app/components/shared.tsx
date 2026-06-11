import { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
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
} from "lucide-react";
import { useState } from "react";
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
          className="text-3xl text-[#1C1008]"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-[#78716C] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ---- Skeleton Card ----
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E7E0D5] animate-pulse">
      <div className="h-44 bg-orange-50" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-8 bg-orange-100 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ---- Loading Spinner ----
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-[#E8720C] rounded-full animate-spin" />
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
      <p className="text-[#78716C] mb-4">{message || "Something went wrong"}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors"
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
      <div className="text-orange-200 mb-4">
        {icon || <InboxIcon size={48} />}
      </div>
      <h3
        className="text-xl text-[#1C1008] mb-2"
        style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-[#78716C] mb-6 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors"
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
      <rect x="70" y="50" width="90" height="50" rx="8" fill="#E8720C" />
      {/* Cab */}
      <rect x="110" y="25" width="50" height="35" rx="6" fill="#C9610A" />
      {/* Window */}
      <rect x="118" y="32" width="34" height="20" rx="4" fill="#FEF3E2" opacity="0.8" />
      {/* Hood */}
      <rect x="70" y="55" width="45" height="25" rx="5" fill="#D97706" />
      {/* Exhaust */}
      <rect x="105" y="20" width="6" height="20" rx="3" fill="#92400E" />
      {/* Exhaust smoke */}
      <circle cx="108" cy="15" r="4" fill="#78716C" opacity="0.3" />
      <circle cx="110" cy="8" r="3" fill="#78716C" opacity="0.2" />
      {/* Large rear wheel */}
      <circle cx="100" cy="105" r="32" fill="#1C1008" />
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
      <circle cx="160" cy="108" r="18" fill="#1C1008" />
      <circle cx="160" cy="108" r="12" fill="#2D1B0A" />
      <circle cx="160" cy="108" r="5" fill="#92400E" />
      {/* Headlight */}
      <circle cx="165" cy="65" r="5" fill="#FEF3E2" />
      <circle cx="165" cy="65" r="3" fill="#FBBF24" />
      {/* Ground line */}
      <line x1="30" y1="126" x2="190" y2="126" stroke="#E7E0D5" strokeWidth="2" />
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
      <line x1="100" y1="200" x2="100" y2="0" stroke="#E8720C" strokeWidth="3" />
      {[30, 50, 70, 90, 110, 130, 150, 170].map((y, i) => (
        <g key={i}>
          <ellipse cx={100 - 18} cy={y} rx="15" ry="7" fill="#E8720C" transform={`rotate(-30,${100 - 18},${y})`} />
          <ellipse cx={100 + 18} cy={y} rx="15" ry="7" fill="#E8720C" transform={`rotate(30,${100 + 18},${y})`} />
        </g>
      ))}
    </svg>
  );
}

// ---- Operator Card ----
export function OperatorCard({
  id,
  name,
  location,
  experience,
  machineExpertise,
  availability,
}: {
  id: string | number;
  name: string;
  location: string;
  experience: number;
  machineExpertise: string[];
  availability: string;
}) {
  return (
    <Link to={`/operators/${id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300 hover:scale-[1.02]">
        <div className="h-20 bg-gradient-to-r from-green-50 to-orange-50 relative">
          <WheatWatermark className="right-0 top-0" />
        </div>
        <div className="px-4 pb-4 -mt-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center ring-2 ring-white ring-offset-1 mb-3">
            <span className="text-white text-xl font-bold">{name.charAt(0)}</span>
          </div>
          <h3
            className="text-[#1C1008] text-base mb-0.5"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {name}
          </h3>
          <p className="text-[#78716C] text-sm flex items-center gap-1 mb-2">
            <MapPin size={12} /> {location}
          </p>
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {machineExpertise.slice(0, 2).map((m, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full"
              >
                {m}
              </span>
            ))}
            {machineExpertise.length > 2 && (
              <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full">
                +{machineExpertise.length - 2}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <AvailabilityBadge status={availability} />
            <span className="text-xs text-[#78716C] flex items-center gap-1">
              <Award size={11} className="text-orange-400" /> {experience} yrs
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
}: {
  id: string | number;
  machineName: string;
  company: string;
  model: string;
  location: string;
  ownerName: string;
}) {
  return (
    <Link to={`/harvesters/${id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300 hover:scale-[1.02]">
        <div className="h-44 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative">
          <TractorIllustration size={130} />
          <span className="absolute top-3 right-3 text-xs px-2 py-1 bg-white border border-[#E7E0D5] rounded-full text-[#78716C] shadow-sm">
            {company}
          </span>
          <WheatWatermark className="left-0 top-0" />
        </div>
        <div className="p-4">
          <h3
            className="text-[#1C1008] text-base mb-0.5"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {machineName}
          </h3>
          <p className="text-[#78716C] text-sm mb-2">{model}</p>
          <p className="text-[#78716C] text-sm flex items-center gap-1 mb-3">
            <MapPin size={12} /> {location}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center">
              <span className="text-white text-xs font-bold">{ownerName.charAt(0)}</span>
            </div>
            <span className="text-xs text-[#78716C]">Owner: {ownerName}</span>
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
}: {
  id: string | number;
  title: string;
  category: string;
  shortDescription: string;
  date: string;
}) {
  return (
    <Link to={`/blogs/${id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300">
        <div className="h-48 bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
          <BookOpen size={48} className="text-orange-300" />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full">
              {category}
            </span>
            <span className="text-xs text-[#78716C]">{date}</span>
          </div>
          <h3
            className="text-[#1C1008] text-base mb-2 line-clamp-2"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {title}
          </h3>
          <p className="text-[#78716C] text-sm line-clamp-2 mb-4">{shortDescription}</p>
          <span className="text-[#E8720C] text-sm font-medium group-hover:underline">
            Read More →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---- Navbar ----
export function Navbar({ variant = "public" }: { variant?: "public" | "auth" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("tractorsewa_token");
    navigate("/");
  };

  const userName = "Rajesh";
  const token = localStorage.getItem("tractorsewa_token");

  return (
    <nav className="sticky top-0 z-50 bg-[#FDFAF4]/95 backdrop-blur-sm border-b border-[#E7E0D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={tractorSevaLogo} alt="Tractor Seva" className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        {variant === "auth" && (
          <div className="hidden md:flex items-center gap-6">
            {[
              { to: "/dashboard", label: "Home", icon: <Home size={15} /> },
              { to: "/harvesters", label: "Harvesters", icon: <Tractor size={15} /> },
              { to: "/operators", label: "Operators", icon: <User size={15} /> },
              { to: "/messages", label: "Messages", icon: <MessageSquare size={15} /> },
              { to: "/blogs", label: "Blogs", icon: <BookOpen size={15} /> },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#E8720C] transition-colors"
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {variant === "auth" ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors">
                    <Plus size={15} /> Add Listing <ChevronDown size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-[#E7E0D5] rounded-xl">
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

              <button className="relative p-2 rounded-xl hover:bg-orange-50 transition-colors">
                <Bell size={20} className="text-[#78716C]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#E8720C] rounded-full" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity">
                    {userName.charAt(0)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-[#E7E0D5] rounded-xl">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User size={15} /> View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/harvesters" className="flex items-center gap-2 cursor-pointer">
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
                className="hidden sm:block px-4 py-2 border-2 border-[#E8720C] text-[#E8720C] rounded-xl text-sm hover:bg-orange-50 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors"
              >
                Sign Up →
              </Link>
            </>
          )}

          <button
            className="md:hidden p-2 rounded-xl hover:bg-orange-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FDFAF4] border-t border-[#E7E0D5] px-4 py-4 space-y-2">
          {variant === "auth" ? (
            <>
              {[
                { to: "/dashboard", label: "Dashboard" },
                { to: "/harvesters", label: "Harvesters" },
                { to: "/operators", label: "Operators" },
                { to: "/messages", label: "Messages" },
                { to: "/blogs", label: "Blogs" },
                { to: "/add-harvester", label: "Add Harvester" },
                { to: "/add-operator", label: "Add Operator" },
                { to: "/profile", label: "My Profile" },
                { to: "/requests", label: "My Requests" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-[#78716C] hover:text-[#E8720C] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <button onClick={logout} className="block py-2 text-red-600 w-full text-left">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-[#78716C]">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-[#E8720C]">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ---- Protected Route ----
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("tractorsewa_token");
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FDFAF4] flex items-center justify-center">
        <div className="text-center">
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }} className="text-2xl text-[#1C1008] mb-4">
            Please login to continue
          </h2>
          <Link
            to="/login"
            className="px-6 py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

// ---- Mock data ----
export const MOCK_OPERATORS = [
  { id: 1, name: "Rajesh Kumar", location: "Ludhiana, Punjab", experience: 8, machineExpertise: ["Combine Harvester", "Wheat Harvester", "Rice Harvester"], availability: "Available", phone: "98765XXXXX" },
  { id: 2, name: "Suresh Patel", location: "Ahmedabad, Gujarat", experience: 5, machineExpertise: ["Sugarcane Harvester", "Maize Harvester"], availability: "Busy", phone: "87654XXXXX" },
  { id: 3, name: "Mohan Singh", location: "Jaipur, Rajasthan", experience: 12, machineExpertise: ["Combine Harvester", "Rice Harvester"], availability: "Available", phone: "76543XXXXX" },
  { id: 4, name: "Arun Verma", location: "Patna, Bihar", experience: 6, machineExpertise: ["Wheat Harvester", "Maize Harvester", "Rice Harvester"], availability: "Available", phone: "65432XXXXX" },
  { id: 5, name: "Kishan Yadav", location: "Varanasi, UP", experience: 9, machineExpertise: ["Combine Harvester", "Sugarcane Harvester"], availability: "Not Available", phone: "54321XXXXX" },
  { id: 6, name: "Ramesh Sharma", location: "Bhopal, MP", experience: 4, machineExpertise: ["Rice Harvester", "Wheat Harvester"], availability: "Available", phone: "43210XXXXX" },
];

export const MOCK_HARVESTERS = [
  { id: 1, machineName: "John Deere S660", company: "John Deere", model: "S660 Combine", location: "Amritsar, Punjab", ownerName: "Gurpreet Singh", phone: "91234XXXXX" },
  { id: 2, machineName: "Mahindra Arjun 605", company: "Mahindra", model: "Arjun 605 DI", location: "Nashik, Maharashtra", ownerName: "Sunil Pawar", phone: "81234XXXXX" },
  { id: 3, machineName: "Claas Lexion 600", company: "Claas", model: "Lexion 600", location: "Karnal, Haryana", ownerName: "Harpal Singh", phone: "71234XXXXX" },
  { id: 4, machineName: "New Holland TC5.90", company: "New Holland", model: "TC5.90", location: "Indore, MP", ownerName: "Ravi Gupta", phone: "61234XXXXX" },
  { id: 5, machineName: "Preet 987", company: "Preet", model: "987 Combine", location: "Hisar, Haryana", ownerName: "Jagdev Bishnoi", phone: "51234XXXXX" },
  { id: 6, machineName: "Sonalika Worldtrac 75", company: "Sonalika", model: "Worldtrac 75", location: "Hoshiarpur, Punjab", ownerName: "Balwinder Gill", phone: "41234XXXXX" },
];

export const MOCK_BLOGS = [
  { id: 1, title: "5 Tips to Maintain Your Combine Harvester Before Rabi Season", category: "Machine Maintenance", shortDescription: "Proper maintenance before the harvest season ensures your machine performs at its best and avoids costly breakdowns during peak time.", date: "Mar 15, 2025" },
  { id: 2, title: "How Farmers in Punjab are Using Tech to Find Operators Faster", category: "Success Stories", shortDescription: "A look at how digital platforms like Tractor Seva are helping farmers in Punjab reduce harvest delays by connecting with verified machine operators.", date: "Feb 28, 2025" },
  { id: 3, title: "Kharif Harvesting Guide: Crop-by-Crop Breakdown for 2025", category: "Harvesting Tips", shortDescription: "Complete guide to Kharif crop harvesting — including paddy, soybean, maize, and sugarcane — with the right machines and timing for each.", date: "Jan 10, 2025" },
  { id: 4, title: "Understanding Harvester Rental Rates Across Indian States", category: "Agri News", shortDescription: "State-wise comparison of combine harvester rental rates for the 2024-25 season, including breakdown of fuel, operator, and transport costs.", date: "Dec 05, 2024" },
];

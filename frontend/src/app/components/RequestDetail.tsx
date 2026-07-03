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

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown } from "./pagesShared";

// ===========================
// REQUEST DETAIL
// ===========================
export function RequestDetail() {
  const { t } = useTranslation(["pages", "static"]);
  const { id } = useParams();
  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/requests/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReq(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t("requestDetail.toastDeleteSuccess", { defaultValue: "Requirement deleted successfully!" }));
        navigate("/requests");
      } else {
        const err = await res.json();
        toast.error(err.error || t("requestDetail.toastDeleteFailed", { defaultValue: "Failed to delete requirement" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("requestDetail.toastDeleteError", { defaultValue: "Error deleting requirement" }));
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!req) return <EmptyState title={t("requestDetail.emptyTitle", { defaultValue: "Requirement not found" })} />;

  const isOwner = currentUser && req.userId === currentUser.id;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263] group transition-colors">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> {t("requestDetail.backToDashboard", { defaultValue: "Back to Dashboard" })}
        </Link>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-sm px-3 py-1 rounded-full border ${req.type === "operator" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>
              {req.type === "operator" ? t("requestDetail.needOperator", { defaultValue: "Need Operator" }) : t("requestDetail.needHarvester", { defaultValue: "Need Harvester" })}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full ${req.status === "Open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t("requests.status." + req.status.toLowerCase(), { defaultValue: req.status })}</span>
            {isOwner && (
              <span className="text-sm px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold shadow-sm">{t("requestDetail.myRequirement", { defaultValue: "My Requirement" })}</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: t("requestDetail.locationLabel", { defaultValue: "Location" }), value: req.location + (req.state ? `, ${t("states." + req.state, { ns: "static", defaultValue: req.state })}` : "") },
              { label: t("requestDetail.machineTypeLabel", { defaultValue: "Machine Type" }), value: t("machineTypes." + req.machineType, { ns: "static", defaultValue: req.machineType }) },
              { label: t("requestDetail.durationLabel", { defaultValue: "Duration" }), value: t("requestDetail.durationDays", { defaultValue: "{{count}} days", count: req.duration || 0 }) },
              { label: t("requestDetail.startDateLabel", { defaultValue: "Start Date" }), value: new Date(req.startDate).toLocaleDateString() },
            ].map((item) => (
              <div key={item.label} className="bg-[#ffffff] rounded-xl p-3 border border-[#E2E8F0]">
                <p className="text-xs text-[#57585A] mb-1">{item.label}</p>
                <p className="text-sm text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
          </div>


          <div className="mb-6">
            <h3 className="text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("requestDetail.descriptionHeading", { defaultValue: "Description" })}</h3>
            <p className="text-[#57585A] text-sm leading-relaxed">{req.description || t("requestDetail.noDescription", { defaultValue: "No description provided." })}</p>
          </div>

          <div className="h-px bg-[#E2E8F0] mb-6" />

          <div className="bg-[#ffffff] rounded-xl p-4 border border-[#E2E8F0] mb-4">
            <p className="text-sm text-[#57585A] mb-1">{isOwner ? t("requestDetail.postedByYou", { defaultValue: "Posted by You" }) : t("requestDetail.postedBy", { defaultValue: "Posted by" })}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center overflow-hidden shrink-0">
                {req.requesterProfilePic ? (
                  <img src={req.requesterProfilePic} alt={req.requesterName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{req.requesterName?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div>
                <p className="text-[#1A1A1A] text-sm" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{req.requesterName}</p>
                <p className="text-xs text-[#57585A]">+91-{req.requesterPhone || 'XXXXXXXXXX'}</p>
              </div>
            </div>
          </div>

          {isOwner ? (
            <div className="space-y-2">
              <div className="text-center text-xs py-1.5 px-3 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold mb-2">
                {t("requestDetail.ownRequirement", { defaultValue: "This is your requirement" })}
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Trash2 size={16} /> {t("requestDetail.deleteRequirement", { defaultValue: "Delete Requirement" })}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <a
                href={`https://wa.me/91${req.requesterPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center font-semibold text-center text-sm gap-2"
              >
                <MessageSquare size={16} /> {t("requestDetail.whatsappUser", { defaultValue: "WhatsApp User" })}
              </a>
              <button
                onClick={() => {
                  if (!currentUser) {
                    toast.error(t("requestDetail.toastLoginToMessage", { defaultValue: "Please log in to send a message" }));
                    navigate("/login");
                  } else {
                    navigate(`/messages?userId=${req.userId}`);
                  }
                }}
                className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors flex items-center justify-center font-semibold text-center text-sm gap-2 cursor-pointer"
              >
                <MessageCircle size={16} /> {t("requestDetail.messageUser", { defaultValue: "Message User" })}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E2E8F0]">
            <h3 className="text-lg text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("requestDetail.deleteTitle", { defaultValue: "Delete Requirement?" })}</h3>
            <p className="text-[#57585A] text-sm mb-4">{t("requestDetail.deleteDesc", { defaultValue: "Are you sure you want to delete this requirement? This action cannot be undone." })}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm">{t("requestDetail.cancelBtn", { defaultValue: "Cancel" })}</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors">{t("requestDetail.deleteBtn", { defaultValue: "Delete" })}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

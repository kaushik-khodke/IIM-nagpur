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

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown, getAllImages } from "./pagesShared";

export function HarvesterDetail() {
  const { t } = useTranslation(["pages", "common", "static", "dashboard"]);
  const { id } = useParams();
  const [harvester, setHarvester] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const isPreview = !localStorage.getItem("tractorsewa_token") && localStorage.getItem("tractorsewa_preview_mode") === "true";

  const [ratingsData, setRatingsData] = useState<{ averageRating: string | null, count: number, reviews: any[] }>({
    averageRating: null,
    count: 0,
    reviews: []
  });
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);

  const fetchRatings = async () => {
    try {
      const res = await fetch(`/api/ratings?targetType=machine&targetId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setRatingsData(data);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
    }
  };

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
        const res = await fetch(`/api/harvesters/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHarvester(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    fetchRatings();
  }, [id]);

  useEffect(() => {
    if (currentUser && ratingsData.reviews.length > 0) {
      const myRatingObj = ratingsData.reviews.find(r => r.raterId === currentUser.id);
      if (myRatingObj) {
        setUserRating(myRatingObj.rating);
        setUserReview(myRatingObj.review || "");
      }
    }
  }, [currentUser, ratingsData.reviews]);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) {
      toast.error("Please select a rating of 1 to 5 stars");
      return;
    }

    const token = localStorage.getItem("tractorsewa_token");
    if (!token) {
      toast.error("Please log in to submit a rating");
      return;
    }

    setSubmittingRating(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: 'machine',
          targetId: id,
          rating: userRating,
          review: userReview
        })
      });

      if (res.ok) {
        toast.success("Rating submitted successfully!");
        fetchRatings();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit rating");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/harvesters/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Machine listing deleted successfully!");
        navigate("/harvesters");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete machine listing");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting machine listing");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!harvester) return <EmptyState title={t("harvesterDetail.noRatingsYet", { defaultValue: "Harvester not found" })} />;

  const isOwner = currentUser && (harvester.userId === currentUser.id || harvester.ownerName === currentUser.name);
  const images = getAllImages(harvester.imagePath);

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="w-full mx-auto px-4 sm:px-6 py-8">
        <Link to="/harvesters" className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263]">
          <ArrowLeft size={16} /> {t("harvesterDetail.backToHarvesters", { defaultValue: "Back to Harvesters" })}
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Harvester Image (Left) */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            <div className="w-full h-64 md:h-80 lg:h-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center p-6 relative overflow-hidden group">
              <WheatWatermark className="absolute right-10 top-5 pointer-events-none opacity-20" />
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImageIndex]}
                    alt={`${harvester.machineName} - ${activeImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain drop-shadow-md relative z-10 transition-all duration-300"
                  />
                  {images.length > 1 && (
                    <>
                      {/* Left Control */}
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md border border-gray-100 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      {/* Right Control */}
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md border border-gray-100 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} />
                      </button>
                      {/* Indicator Badge */}
                      <div className="absolute bottom-4 right-4 z-20 px-2.5 py-1 bg-black/60 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                        {activeImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <TractorIllustration size={200} className="relative z-10" />
              )}
            </div>
            
            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-16 h-16 rounded-xl border-2 overflow-hidden bg-white shadow-sm transition-all focus:outline-none",
                      idx === activeImageIndex
                        ? "border-[#172263] ring-2 ring-blue-100 scale-105"
                        : "border-[#E2E8F0] hover:border-gray-400 hover:scale-102"
                    )}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Owner Card (Right) */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)] h-full flex flex-col justify-center">
              <h3 className="text-[#1A1A1A] mb-4 text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {isOwner ? t("harvesterDetail.ownerYou", { defaultValue: "Machine Owner (You)" }) : t("harvesterDetail.ownerTitle", { defaultValue: "Machine Owner" })}
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center ring-2 ring-blue-100 shadow-sm shrink-0 overflow-hidden">
                  {harvester.ownerProfilePic ? (
                    <img src={harvester.ownerProfilePic} alt={harvester.ownerName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{harvester.ownerName?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div>
                  <p className="text-[#1A1A1A] text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{harvester.ownerName}</p>
                  {isPreview ? (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1 font-semibold flex items-center gap-1 w-fit">
                      🔒 Login to view contact
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-[#57585A] flex items-center gap-1.5 mt-1"><Phone size={13} /> +91-{harvester.phone || 'XXXXXXXXXX'}</p>
                      {harvester.whatsapp && (
                        <p className="text-sm text-[#57585A] flex items-center gap-1.5 mt-1"><MessageCircle size={13} className="text-green-600" /> +91-{harvester.whatsapp}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-auto">
                <div className="space-y-3">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => navigate(`/harvesters/${id}/edit`)}
                        className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Pencil size={18} /> {t("harvesterDetail.editHarvester", { defaultValue: "Edit Harvester" })}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Trash2 size={18} /> {t("harvesterDetail.deleteListing", { defaultValue: "Delete Listing" })}
                      </button>
                    </>
                  ) : isPreview ? (
                    <>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("trigger-auth-required", {
                            detail: { redirectPath: `/harvesters/${id}` }
                          }));
                        }}
                        className="w-full py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer hover:bg-slate-200 hover:text-slate-600"
                      >
                        <MessageSquare size={18} /> {t("harvesterDetail.whatsAppOwner", { defaultValue: "WhatsApp Owner" })}
                      </button>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("trigger-auth-required", {
                            detail: { redirectPath: `/harvesters/${id}` }
                          }));
                        }}
                        className="w-full py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer hover:bg-slate-200 hover:text-slate-600"
                      >
                        {t("harvesterDetail.messageOwner", { defaultValue: "Message Owner" })}
                      </button>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("trigger-auth-required", {
                            detail: { redirectPath: `/harvesters/${id}` }
                          }));
                        }}
                        className="w-full py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer hover:bg-slate-200 hover:text-slate-600"
                      >
                        <Star size={18} fill="currentColor" /> {t("harvesterDetail.rateMachine", { defaultValue: "Rate Machine" })}
                      </button>
                    </>
                  ) : (
                    <>
                      <a
                        href={`https://wa.me/91${harvester.whatsapp || harvester.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <MessageSquare size={18} /> {t("harvesterDetail.whatsAppOwner", { defaultValue: "WhatsApp Owner" })}
                      </a>
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            toast.error(t("harvesterDetail.errorLoginRate", { defaultValue: "Please log in to send a message" }));
                            navigate("/login");
                          } else {
                            navigate(`/messages?userId=${harvester.userId}`);
                          }
                        }}
                        className="w-full py-3 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors font-medium cursor-pointer"
                      >
                        {t("harvesterDetail.messageOwner", { defaultValue: "Message Owner" })}
                      </button>
                      <button
                        onClick={() => {
                          document.getElementById("ratings-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2 font-semibold cursor-pointer"
                      >
                        <Star size={18} fill="currentColor" /> {t("harvesterDetail.rateMachine", { defaultValue: "Rate Machine" })}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="w-full">
            <h1
              className="text-3xl text-[#1A1A1A] mb-3"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              {harvester.machineName}
            </h1>
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200 font-medium">
                {t("companies." + harvester.company, { ns: "static", defaultValue: harvester.company })}
              </span>
              <span className="px-4 py-1.5 bg-gray-50 text-gray-700 rounded-full text-sm border border-gray-200 font-medium">{harvester.model}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {[
                { icon: <MapPin size={20} className="text-[#172263]" />, label: t("exploreHarvesters.location", { defaultValue: "Location" }), value: harvester.location },
                { icon: <Tractor size={20} className="text-[#172263]" />, label: t("addHarvester.company", { defaultValue: "Company" }), value: t("companies." + harvester.company, { ns: "static", defaultValue: harvester.company }) },
                { icon: <Award size={20} className="text-[#172263]" />, label: t("exploreHarvesters.model", { defaultValue: "Model" }), value: harvester.model },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">{item.icon}</div>
                    <span className="text-sm text-[#57585A] font-medium">{item.label}</span>
                  </div>
                  <p className="text-lg text-[#1A1A1A] ml-11" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <h3 className="text-xl text-[#1A1A1A] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("harvesterDetail.aboutThisMachine", { defaultValue: "About This Machine" })}</h3>
              <div className="w-12 h-1 bg-[#172263] rounded-full mb-6" />
              <p className="text-[#57585A] text-base leading-relaxed whitespace-pre-line">
                {harvester.description || t("harvesterDetail.aboutDescription", { company: t("companies." + harvester.company, { ns: "static", defaultValue: harvester.company }), model: harvester.model, defaultValue: `This ${harvester.company} ${harvester.model} is well-maintained and suitable for harvesting wheat, rice, and other Rabi/Kharif crops. Available for seasonal hire with experienced operator on request.` })}
              </p>
            </div>

            {/* Machine Specifications */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <h3 className="text-xl text-[#1A1A1A] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {t("harvesterDetail.machineSpecifications", { defaultValue: "Machine Specifications" })}
              </h3>
              <div className="w-12 h-1 bg-[#172263] rounded-full mb-6" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: t("harvesterDetail.specModel", { defaultValue: "Model" }), value: harvester.model, required: true },
                  { label: t("harvesterDetail.specSerialNo", { defaultValue: "Serial Number" }), value: isPreview ? "•••••••• (Login to view)" : harvester.serialNo, required: true },
                  { label: t("harvesterDetail.specChassisNo", { defaultValue: "Chassis Number" }), value: isPreview ? "•••••••• (Login to view)" : harvester.chassisNo, required: true },
                  { label: t("harvesterDetail.specMfgMonthYear", { defaultValue: "Month / Year of MFG" }), value: harvester.mfgMonthYear, required: true },
                  { label: t("harvesterDetail.specEngineNo", { defaultValue: "Engine Number" }), value: isPreview ? "•••••••• (Login to view)" : harvester.engineNo, required: true },
                  { label: t("harvesterDetail.specEnginePower", { defaultValue: "Engine Power" }), value: harvester.enginePower, required: false },
                  { label: t("harvesterDetail.specEngineMake", { defaultValue: "Engine Make" }), value: harvester.engineMake, required: false },
                  { label: t("harvesterDetail.specEngineModel", { defaultValue: "Engine Model" }), value: harvester.engineModel, required: false },
                  { label: t("harvesterDetail.specServiceHotline", { defaultValue: "Service Hotline" }), value: harvester.serviceHotlineNo, required: false },
                ].map((field, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "bg-slate-50 border rounded-xl p-4 transition-all hover:bg-slate-100/50 flex flex-col justify-between",
                      field.required ? "border-amber-200/80 bg-amber-50/10" : "border-[#E2E8F0]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] text-[#57585A] font-bold uppercase tracking-wider">
                        {field.label}
                      </span>
                      {field.required && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-200/50">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-base text-[#1A1A1A] font-semibold break-words mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {field.value || <span className="text-gray-400 font-normal text-sm">—</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ratings & Reviews Section */}
            <div id="ratings-section" className="bg-white rounded-2xl border border-[#E2E8F0] p-8 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-8">
              <div>
                <h3 className="text-xl text-[#1A1A1A] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("harvesterDetail.ratingsAndReviews", { defaultValue: "Ratings & Reviews" })}</h3>
                <div className="w-12 h-1 bg-[#172263] rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left side: average display */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl text-center border border-[#E2E8F0]">
                  {ratingsData.averageRating !== null ? (
                    <>
                      <span className="text-5xl font-black text-[#172263] font-sora mb-1">{ratingsData.averageRating}</span>
                      <div className="flex gap-0.5 text-amber-500 mb-2">
                        {Array(5).fill(0).map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            fill={i < Math.round(parseFloat(ratingsData.averageRating || "0")) ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#57585A] font-medium">
                        {t("harvesterDetail.basedOnRatings", { count: ratingsData.count, defaultValue: `Based on ${ratingsData.count} ratings` })}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-[#57585A]">{t("harvesterDetail.noRatingsYet", { defaultValue: "No ratings yet" })}</span>
                      <span className="text-xs text-[#57585A] mt-1">{t("harvesterDetail.beTheFirst", { defaultValue: "Be the first to rate this harvester!" })}</span>
                    </>
                  )}
                </div>

                {/* Right side: Submit Review form (if not owner) */}
                <div className="md:col-span-8">
                  {isOwner ? (
                    <div className="h-full flex items-center justify-center p-6 border border-dashed border-[#E2E8F0] rounded-2xl bg-slate-50/50">
                      <p className="text-xs text-[#57585A] text-center font-medium">{t("harvesterDetail.cannotRateOwn", { defaultValue: "You cannot rate your own harvester listing." })}</p>
                    </div>
                  ) : currentUser ? (
                    <form onSubmit={handleRatingSubmit} className="space-y-4">
                      <h4 className="text-sm font-bold text-[#1A1A1A] font-sora">{t("harvesterDetail.submitYourRating", { defaultValue: "Submit Your Rating" })}</h4>

                      {/* Interactive Stars */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#57585A] font-medium">{t("harvesterDetail.yourScore", { defaultValue: "Your Score:" })}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className="text-amber-500 transition-transform hover:scale-110 focus:outline-none"
                            >
                              <Star
                                size={22}
                                fill={star <= userRating ? "currentColor" : "none"}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Input */}
                      <div className="space-y-2">
                        <textarea
                          value={userReview}
                          onChange={(e) => setUserReview(e.target.value)}
                          placeholder={t("harvesterDetail.writeReviewPlaceholder", { defaultValue: "Write a brief review about your experience with this harvester (optional)..." })}
                          className="w-full p-3 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] min-h-[80px]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingRating}
                        className="px-5 py-2.5 bg-[#172263] text-white hover:bg-[#11194A] transition-colors rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {submittingRating ? t("addHarvester.submitting", { defaultValue: "Submitting..." }) : t("harvesterDetail.submitReview", { defaultValue: "Submit Review" })}
                      </button>
                    </form>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-6 border border-[#E2E8F0] rounded-2xl bg-amber-50/40 text-center">
                      <p className="text-xs text-[#57585A] font-medium mb-2">{t("harvesterDetail.mustBeLoggedIn", { defaultValue: "You must be logged in to submit a review." })}</p>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 bg-[#172263] text-white rounded-lg text-xs font-semibold hover:bg-[#11194A] transition-colors"
                      >
                        {t("shared.login", { defaultValue: "Login" })}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="border-t border-[#E2E8F0] pt-6 space-y-4">
                <h4 className="text-sm font-bold text-[#1A1A1A] font-sora">{t("harvesterDetail.userReviews", { defaultValue: "User Reviews" })}</h4>
                {ratingsData.reviews.length > 0 ? (
                  <div className="divide-y divide-[#E2E8F0] space-y-4">
                    {ratingsData.reviews.map((rev, idx) => (
                      <div key={idx} className={`${idx > 0 ? 'pt-4' : ''} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1A1A1A] font-sora">{rev.raterName}</span>
                          <span className="text-[10px] text-[#57585A]">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5 text-amber-500">
                            {Array(5).fill(0).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < rev.rating ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                        </div>
                        {rev.review && (
                          <p className="text-xs text-[#57585A] leading-relaxed whitespace-pre-line">{rev.review}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#57585A] italic">{t("harvesterDetail.noReviewsYet", { defaultValue: "No reviews have been written yet." })}</p>
                )}
              </div>
            </div>


          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E2E8F0]">
            <h3 className="text-lg text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("harvesterDetail.deleteConfirmTitle", { defaultValue: "Delete Machine Listing?" })}</h3>
            <p className="text-[#57585A] text-sm mb-4">{t("harvesterDetail.deleteConfirmDesc", { defaultValue: "Are you sure you want to delete this listing? This action cannot be undone." })}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm">{t("harvesterDetail.cancel", { defaultValue: "Cancel" })}</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors">{t("harvesterDetail.delete", { defaultValue: "Delete" })}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
// OPERATOR PROFILE
// ===========================
export function OperatorProfile() {
  const { t } = useTranslation(["pages", "static"]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [operator, setOperator] = useState<any>(null);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isPreview = !localStorage.getItem("tractorsewa_token") && localStorage.getItem("tractorsewa_preview_mode") === "true";

  const [currentUser, setCurrentUser] = useState<any>(null);
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
      const res = await fetch(`/api/ratings?targetType=operator&targetId=${id}`);
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
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/operators/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOperator(data);
        }

        const harvsRes = await fetch(`/api/harvesters?operatorId=${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (harvsRes.ok) {
          const harvsData = await harvsRes.json();
          setHarvesters(harvsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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
      toast.error(t("operatorProfile.toastSelectRating", { defaultValue: "Please select a rating of 1 to 5 stars" }));
      return;
    }

    const token = localStorage.getItem("tractorsewa_token");
    if (!token) {
      toast.error(t("operatorProfile.toastLoginToRate", { defaultValue: "Please log in to submit a rating" }));
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
          targetType: 'operator',
          targetId: id,
          rating: userRating,
          review: userReview
        })
      });

      if (res.ok) {
        toast.success(t("operatorProfile.toastRatingSuccess", { defaultValue: "Rating submitted successfully!" }));
        fetchRatings();
      } else {
        const err = await res.json();
        toast.error(err.error || t("operatorProfile.toastRatingFailed", { defaultValue: "Failed to submit rating" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("operatorProfile.toastRatingError", { defaultValue: "Error submitting rating" }));
    } finally {
      setSubmittingRating(false);
    }
  };

  const getCleanPhoneNumber = (phoneStr: string) => {
    if (!phoneStr) return "";
    const cleaned = phoneStr.replace(/\D/g, "");
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return cleaned.slice(2);
    }
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
      return cleaned.slice(1);
    }
    return cleaned.slice(-10);
  };

  if (loading) return <LoadingSpinner />;
  if (!operator) return <EmptyState title={t("operatorProfile.emptyTitle", { defaultValue: "Operator profile not found" })} />;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="w-full mx-auto px-4 sm:px-6 pt-4">
        <Link to="/operators" className="inline-flex items-center gap-2 text-[#57585A] text-sm hover:text-[#172263] transition-colors group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          {t("operatorProfile.backToOperators", { defaultValue: "Back to Operators" })}
        </Link>
      </div>
      <div className="relative mt-2">
        <div className="h-48 bg-gradient-to-r from-[#11194A] via-[#172263] to-[#2E3F96] rounded-b-3xl overflow-hidden relative">
          <WheatWatermark className="right-10 top-0 opacity-[0.06]" />
        </div>
        <div className="w-full mx-auto px-4 sm:px-6 -mt-16 pb-24 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#172263] to-[#2E3F96] flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden shrink-0">
              {operator.image_path || operator.ownerProfilePic ? (
                <img src={operator.image_path || operator.ownerProfilePic} alt={operator.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-bold">{operator.name.charAt(0)}</span>
              )}
            </div>
            <div className="pb-2">
              <h1
                className="text-2xl text-[#1A1A1A] flex items-center gap-1.5"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                <span>{operator.name}</span>
                {operator.verification_status === 'Approved' && (
                  <ShieldCheck size={22} className="text-emerald-600 animate-pulse" title="Verified Operator" />
                )}
              </h1>
              <p className="text-[#57585A] flex items-center gap-1 text-sm">
                <MapPin size={13} /> {operator.location}
              </p>
            </div>
            <div className="sm:ml-auto pb-2">
              <AvailabilityBadge status={operator.availability} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="w-full lg:w-2/3 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: t("operatorProfile.experienceYears", { defaultValue: "{{count}} Yrs", count: operator.experience }), label: t("operatorProfile.experience", { defaultValue: "Experience" }) },
                  { value: `${operator.machineExpertise?.length || 0}`, label: t("operatorProfile.machineTypes", { defaultValue: "Machine Types" }) },
                  { value: t("status." + (operator.availability === "Not Available" ? "notAvailable" : operator.availability.toLowerCase()), { ns: "static", defaultValue: operator.availability }), label: t("operatorProfile.status", { defaultValue: "Status" }) },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-[#E2E8F0]">
                    <p className="text-[#172263] text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>{s.value}</p>
                    <p className="text-xs text-[#57585A]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* About */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <h3 className="text-[#1A1A1A] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("operatorProfile.about", { defaultValue: "About" })}</h3>
                <p className="text-[#57585A] text-sm leading-relaxed">
                  {operator.description || t("operatorProfile.fallbackDesc", { defaultValue: "Experienced harvester operator with {{count}}+ years in agricultural machinery operation. Skilled in operating combine harvesters, rice harvesters, and wheat harvesters across multiple states in India.", count: operator.experience })}
                </p>
              </div>

              {/* Machine Expertise */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                <h3 className="text-[#1A1A1A] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("operatorProfile.machineExpertise", { defaultValue: "Machine Expertise" })}</h3>
                <div className="flex flex-wrap gap-2">
                  {operator.machineExpertise?.map((m: string) => (
                    <span key={m} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm">
                      {t("machineTypes." + m, { ns: "static", defaultValue: m })}
                    </span>
                  ))}
                </div>
              </div>

              {/* Listed Machines */}
              {harvesters.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                  <h3 className="text-[#1A1A1A] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("operatorProfile.listedHarvesters", { defaultValue: "Listed Harvesters" })}</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {harvesters.map((h) => (
                      <HarvesterCard key={h.id} {...h} />
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings & Reviews Section */}
              <div id="ratings-section" className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-6">
                <div>
                  <h3 className="text-lg text-[#1A1A1A] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("operatorProfile.ratingsReviews", { defaultValue: "Ratings & Reviews" })}</h3>
                  <div className="w-12 h-1 bg-[#172263] rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left display */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl text-center border border-[#E2E8F0]">
                    {ratingsData.averageRating !== null ? (
                      <>
                        <span className="text-4xl font-black text-[#172263] font-sora mb-1">{ratingsData.averageRating}</span>
                        <div className="flex gap-0.5 text-amber-500 mb-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={i < Math.round(parseFloat(ratingsData.averageRating || "0")) ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-[#57585A] font-semibold">{t("operatorProfile.basedOnRatings", { count: ratingsData.count, defaultValue: "Based on {{count}} ratings" })}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-[#57585A]">{t("operatorProfile.noRatingsYet", { defaultValue: "No ratings yet" })}</span>
                        <span className="text-[10px] text-[#57585A] mt-0.5">{t("operatorProfile.firstToRate", { defaultValue: "Be the first to rate this operator!" })}</span>
                      </>
                    )}
                  </div>

                  {/* Submit Review Form */}
                  <div className="md:col-span-8 flex flex-col">
                    {currentUser && (operator.user_id === currentUser.id) ? (
                      <div className="h-full flex items-center justify-center p-4 border border-dashed border-[#E2E8F0] rounded-2xl bg-slate-50/50">
                        <p className="text-xs text-[#57585A] text-center font-medium">{t("operatorProfile.cannotRateOwn", { defaultValue: "You cannot rate your own operator profile." })}</p>
                      </div>
                    ) : currentUser ? (
                      <form onSubmit={handleRatingSubmit} className="space-y-3">
                        <h4 className="text-xs font-bold text-[#1A1A1A] font-sora">{t("operatorProfile.submitYourRating", { defaultValue: "Submit Your Rating" })}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#57585A] font-semibold">{t("operatorProfile.yourScore", { defaultValue: "Your Score:" })}</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setUserRating(star)}
                                className="text-amber-500 transition-transform hover:scale-110 focus:outline-none"
                              >
                                <Star
                                  size={18}
                                  fill={star <= userRating ? "currentColor" : "none"}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <textarea
                            value={userReview}
                            onChange={(e) => setUserReview(e.target.value)}
                            placeholder={t("operatorProfile.reviewPlaceholder", { defaultValue: "Write a brief review about your experience with this operator (optional)..." })}
                            className="w-full p-2.5 border border-[#E2E8F0] rounded-xl text-[11px] focus:outline-none focus:border-[#172263] min-h-[70px]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingRating}
                          className="px-4 py-2 bg-[#172263] text-white hover:bg-[#11194A] transition-colors rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          {submittingRating ? t("operatorProfile.submitting", { defaultValue: "Submitting..." }) : t("operatorProfile.submitReview", { defaultValue: "Submit Review" })}
                        </button>
                      </form>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-4 border border-[#E2E8F0] rounded-2xl bg-amber-50/40 text-center">
                        <p className="text-xs text-[#57585A] font-semibold mb-1.5">{t("operatorProfile.loginToSubmitReview", { defaultValue: "You must be logged in to submit a review." })}</p>
                        <button
                          onClick={() => navigate('/login')}
                          className="px-3.5 py-1.5 bg-[#172263] text-white rounded-lg text-xs font-semibold hover:bg-[#11194A] transition-colors"
                        >
                          {t("operatorProfile.loginRegister", { defaultValue: "Log In / Register" })}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#1A1A1A] font-sora">{t("operatorProfile.userReviews", { defaultValue: "User Reviews" })}</h4>
                  {ratingsData.reviews.length > 0 ? (
                    <div className="divide-y divide-[#E2E8F0] space-y-3">
                      {ratingsData.reviews.map((rev, idx) => (
                        <div key={idx} className={`${idx > 0 ? 'pt-3' : ''} space-y-1.5`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1A1A1A] font-sora">{rev.raterName}</span>
                            <span className="text-[9px] text-[#57585A]">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5 text-amber-500">
                              {Array(5).fill(0).map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
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
                    <p className="text-xs text-[#57585A] italic">{t("operatorProfile.noReviewsYet", { defaultValue: "No reviews have been written yet." })}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Symmetrical Contact card */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)] sticky top-6">
                <h3 className="text-[#1A1A1A] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("operatorProfile.contactOperator", { defaultValue: "Contact Operator" })}</h3>
                {isPreview ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-4 font-semibold flex items-center gap-1">
                    🔒 Login to view contact info
                  </p>
                ) : (
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-[#57585A] flex items-center gap-2">
                      <Phone size={14} className="text-[#172263]" /> +91-{operator.phone || 'XXXXXXXXXX'}
                    </p>
                    {operator.whatsapp && (
                      <p className="text-sm text-[#57585A] flex items-center gap-2">
                        <MessageCircle size={14} className="text-green-600" /> +91-{operator.whatsapp}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-2.5">
                  {isPreview ? (
                    <>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("trigger-auth-required", {
                            detail: { redirectPath: `/operators/${id}` }
                          }));
                        }}
                        className="w-full py-3 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-sm transition-all flex items-center justify-center gap-2 font-medium cursor-pointer hover:bg-slate-100 hover:text-slate-600 active:scale-[0.98]"
                      >
                        <MessageSquare size={16} /> {t("operatorProfile.whatsapp", { defaultValue: "WhatsApp" })}
                      </button>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("trigger-auth-required", {
                            detail: { redirectPath: `/operators/${id}` }
                          }));
                        }}
                        className="w-full py-3 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-sm transition-all flex items-center justify-center gap-2 font-medium cursor-pointer hover:bg-slate-100 hover:text-slate-600 active:scale-[0.98]"
                      >
                        <Send size={16} /> {t("operatorProfile.sendMessage", { defaultValue: "Send Message" })}
                      </button>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("trigger-auth-required", {
                            detail: { redirectPath: `/operators/${id}` }
                          }));
                        }}
                        className="w-full py-3 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-sm transition-all flex items-center justify-center gap-2 font-medium cursor-pointer hover:bg-slate-100 hover:text-slate-600 active:scale-[0.98]"
                      >
                        <Star size={16} fill="currentColor" /> {t("operatorProfile.rateOperator", { defaultValue: "Rate Operator" })}
                      </button>
                    </>
                  ) : (
                    <>
                      <a
                        href={`https://wa.me/91${getCleanPhoneNumber(operator.whatsapp || operator.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <MessageSquare size={16} /> {t("operatorProfile.whatsapp", { defaultValue: "WhatsApp" })}
                      </a>
                      {(!currentUser || operator.user_id !== currentUser.id) && (
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              toast.error(t("operatorProfile.toastLoginToMessage", { defaultValue: "Please log in to send a message" }));
                              navigate("/login");
                            } else {
                              navigate(`/messages?userId=${operator.user_id}`);
                            }
                          }}
                          className="w-full py-3 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium cursor-pointer"
                        >
                          <Send size={16} /> {t("operatorProfile.sendMessage", { defaultValue: "Send Message" })}
                        </button>
                      )}
                      {currentUser && (operator.user_id !== currentUser.id) && (
                        <button
                          onClick={() => {
                            document.getElementById("ratings-section")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold cursor-pointer"
                        >
                          <Star size={16} fill="currentColor" /> {t("operatorProfile.rateOperator", { defaultValue: "Rate Operator" })}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E2E8F0] sm:hidden z-40">
        {isPreview ? (
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("trigger-auth-required", {
                detail: { redirectPath: `/operators/${id}` }
              }));
            }}
            className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors flex items-center justify-center font-semibold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {t("operatorProfile.callOperator", { defaultValue: "Call Operator" })}
          </button>
        ) : (
          <a
            href={`tel:+91${getCleanPhoneNumber(operator.phone)}`}
            className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors flex items-center justify-center font-semibold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {t("operatorProfile.callOperator", { defaultValue: "Call Operator" })}
          </a>
        )}
      </div>
    </div>
  );
}
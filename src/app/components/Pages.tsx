import { useState, useEffect, useRef, Fragment } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router";
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
  Trash2,
  Pencil,
  Plus,
  Upload,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const INDIAN_STATES = districtsData.states.map(s => s.state);

const MACHINE_TYPES = ["Combine Harvester", "Rice Harvester", "Wheat Harvester", "Maize Harvester", "Sugarcane Harvester", "Paddy Harvester"];
const COMPANIES = ["John Deere", "Claas", "Mahindra", "New Holland", "AGCO", "Preet", "Sonalika", "Other"];

export const HARVESTER_MODELS: Record<string, string[]> = {
  "John Deere": [
    "S760", "S770", "S780", "S790",
    "S660", "S670", "S680", "S690",
    "X9 1000", "X9 1100",
    "T670",
    "W330", "W440"
  ],
  "Claas": [
    "Lexion 8800", "Lexion 8700", "Lexion 8600",
    "Lexion 7700", "Lexion 7600", "Lexion 7500",
    "Tucano 580", "Tucano 560", "Tucano 450",
    "Crop Tiger 30", "Crop Tiger 40"
  ],
  "Mahindra": [
    "Arjun 605 DI",
    "Novo 605 DI",
    "Swaraj Pro Combine 7060",
    "Swaraj Pro Combine 7090"
  ],
  "New Holland": [
    "CR10.90", "CR9.90",
    "TC5.30", "TC5.90",
    "CX8.80", "CX8.90"
  ],
  "AGCO": [
    "Massey Ferguson 9505",
    "Massey Ferguson MF 7300",
    "Fendt Ideal 9",
    "Fendt Ideal 8",
    "Fendt Ideal 7"
  ],
  "Preet": [
    "Preet 982",
    "Preet 949",
    "Preet 749",
    "Preet 849"
  ],
  "Sonalika": [
    "Harvester 9500",
    "Harvester 7500",
    "Sonalika 5125"
  ],
  "Kartar": [
    "Kartar 4000",
    "Kartar 3600",
    "Kartar 3500"
  ],
  "Dashmesh": [
    "Dashmesh 9100",
    "Dashmesh 912",
    "Dashmesh 7100"
  ],
  "Kubota": [
    "DC-68G", "DC-70G", "DC-93", "DC-105X"
  ],
  "Other": [
    "Other / Custom Model"
  ]
};

export const HARVESTER_COMPANIES = Object.keys(HARVESTER_MODELS);

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === "mine" ? t("exploreHarvesters.noListings", { defaultValue: "You haven't listed any machines yet" }) : t("exploreHarvesters.noHarvesters", { defaultValue: "No harvesters found" })}
            description={tab === "mine" ? t("exploreHarvesters.noListingsDesc", { defaultValue: "List your harvester today to connect with farmers looking for services." }) : t("exploreHarvesters.noHarvestersDesc", { defaultValue: "Try adjusting your filters or be the first to list a machine in this area." })}
            actionLabel={t("exploreHarvesters.listYourMachine", { defaultValue: "List Your Machine" })}
            onAction={() => navigate("/add-harvester")}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((h) => (
              <HarvesterCard
                key={h.id}
                {...h}
                isOwner={currentUser && h.ownerName === currentUser.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================
// HARVESTER DETAIL
// ===========================
export function HarvesterDetail() {
  const { t } = useTranslation(["pages", "common", "static", "dashboard"]);
  const { id } = useParams();
  const [harvester, setHarvester] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="w-full mx-auto px-4 sm:px-6 py-8">
        <Link to="/harvesters" className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263]">
          <ArrowLeft size={16} /> {t("harvesterDetail.backToHarvesters", { defaultValue: "Back to Harvesters" })}
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Harvester Image (Left) */}
          <div className="w-full lg:w-2/3 h-64 md:h-80 lg:h-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-center p-6 relative overflow-hidden">
            <WheatWatermark className="absolute right-10 top-5 pointer-events-none opacity-20" />
            {harvester.imagePath ? (
              <img src={harvester.imagePath} alt={harvester.machineName} className="max-w-full max-h-full object-contain drop-shadow-md relative z-10" />
            ) : (
              <TractorIllustration size={200} className="relative z-10" />
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
                  <p className="text-sm text-[#57585A] flex items-center gap-1.5 mt-1"><Phone size={13} /> +91-{harvester.phone || 'XXXXXXXXXX'}</p>
                  {harvester.whatsapp && (
                    <p className="text-sm text-[#57585A] flex items-center gap-1.5 mt-1"><MessageCircle size={13} className="text-green-600" /> +91-{harvester.whatsapp}</p>
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
                        className="w-full py-3 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors font-medium"
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title={t("operators.emptyTitle", { defaultValue: "No operators found" })} description={t("operators.emptyDescription", { defaultValue: "Try adjusting your filters." })} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((op) => (
              <OperatorCard
                key={op.id}
                {...op}
                isOwner={currentUser && op.user_id === currentUser.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================
// OPERATOR PROFILE
// ===========================
export function OperatorProfile() {
  const { t } = useTranslation(["pages", "static"]);
  const { id } = useParams();
  const [operator, setOperator] = useState<any>(null);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="h-48 bg-gradient-to-r from-[#172263] via-[#D97706] to-[#15803D] rounded-b-3xl overflow-hidden">
          <WheatWatermark className="right-10 top-0 opacity-[0.06]" />
        </div>
        <div className="w-full mx-auto px-4 sm:px-6 -mt-16 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden shrink-0">
              {operator.image_path || operator.ownerProfilePic ? (
                <img src={operator.image_path || operator.ownerProfilePic} alt={operator.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{operator.name.charAt(0)}</span>
              )}
            </div>
            <div className="pb-2">
              <h1
                className="text-2xl text-[#1A1A1A]"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                {operator.name}
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
                  {/* Left side: average display */}
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

                  {/* Right side: Submit Review form (if not owner) */}
                  <div className="md:col-span-8 flex flex-col">
                    {currentUser && (operator.user_id === currentUser.id) ? (
                      <div className="h-full flex items-center justify-center p-4 border border-dashed border-[#E2E8F0] rounded-2xl bg-slate-50/50">
                        <p className="text-xs text-[#57585A] text-center font-medium">{t("operatorProfile.cannotRateOwn", { defaultValue: "You cannot rate your own operator profile." })}</p>
                      </div>
                    ) : currentUser ? (
                      <form onSubmit={handleRatingSubmit} className="space-y-3">
                        <h4 className="text-xs font-bold text-[#1A1A1A] font-sora">{t("operatorProfile.submitYourRating", { defaultValue: "Submit Your Rating" })}</h4>

                        {/* Interactive Stars */}
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

                        {/* Review Input */}
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

            {/* Contact card */}
            <div>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)]">
                <h3 className="text-[#1A1A1A] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("operatorProfile.contactOperator", { defaultValue: "Contact Operator" })}</h3>
                <p className="text-sm text-[#57585A] mb-2 flex items-center gap-2">
                  <Phone size={14} /> +91-{operator.phone || 'XXXXXXXXXX'}
                </p>
                {operator.whatsapp && (
                  <p className="text-sm text-[#57585A] mb-4 flex items-center gap-2">
                    <MessageCircle size={14} className="text-green-600" /> +91-{operator.whatsapp}
                  </p>
                )}
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/91${operator.whatsapp || operator.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
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
                      className="w-full py-2.5 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors"
                    >
                      {t("operatorProfile.sendMessage", { defaultValue: "Send Message" })}
                    </button>
                  )}
                  {currentUser && (operator.user_id !== currentUser.id) && (
                    <button
                      onClick={() => {
                        document.getElementById("ratings-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2 font-semibold cursor-pointer"
                    >
                      <Star size={16} fill="currentColor" /> {t("operatorProfile.rateOperator", { defaultValue: "Rate Operator" })}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E2E8F0] sm:hidden z-40">
        <a
          href={`tel:+91${operator.phone}`}
          className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors flex items-center justify-center font-semibold"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {t("operatorProfile.callOperator", { defaultValue: "Call Operator" })}
        </a>
      </div>
    </div>
  );
}

// ===========================
// ADD OPERATOR FORM
// ===========================
export function AddOperator() {
  const { t } = useTranslation(["pages", "static"]);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState("");
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [availability, setAvailability] = useState("Available");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const defaultState = localStorage.getItem("tractorsewa_default_state");
    const defaultDistrict = localStorage.getItem("tractorsewa_default_district");
    if (defaultState) setState(defaultState);
    if (defaultDistrict) setLocation(defaultDistrict);
  }, []);

  const handleDetectLocation = async () => {
    const loadingToastId = toast.loading(t("addOperator.toastDetectingLocation", { defaultValue: "Detecting location..." }));
    const detected = await detectUserLocation();
    toast.dismiss(loadingToastId);
    if (detected) {
      const matched = matchLocationWithDistricts(detected.state, detected.district);
      if (matched) {
        setState(matched.state);
        setLocation(matched.district);
        localStorage.setItem("tractorsewa_default_state", matched.state);
        localStorage.setItem("tractorsewa_default_district", matched.district);
        toast.success(t("addOperator.toastLocationSet", { defaultValue: "Location set to {{district}}, {{state}}", district: matched.district, state: matched.state }));
      } else {
        toast.error(t("addOperator.toastLocationMatchError", { defaultValue: "Could not match detected location with Indian states/districts." }));
      }
    } else {
      toast.error(t("addOperator.toastLocationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
    }
  };

  const toggleMachine = (m: string) => {
    setSelectedMachines((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !experience.trim() || !location || !state || selectedMachines.length === 0) {
      toast.error(t("addOperator.toastFillDetails", { defaultValue: "Please make sure all basic details and skills are filled out correctly from previous steps." }));
      return;
    }
    const cleanedPhone = phone.replace(/\D/g, "");
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      finalPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      finalPhone = cleanedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(finalPhone)) {
      toast.error(t("addOperator.toastPhoneError", { defaultValue: "Please enter a valid 10-digit phone number" }));
      return;
    }

    const cleanedWhatsapp = whatsapp.replace(/\D/g, "");
    let finalWhatsapp = cleanedWhatsapp;
    if (cleanedWhatsapp.length === 12 && cleanedWhatsapp.startsWith("91")) {
      finalWhatsapp = cleanedWhatsapp.substring(2);
    } else if (cleanedWhatsapp.length === 11 && cleanedWhatsapp.startsWith("0")) {
      finalWhatsapp = cleanedWhatsapp.substring(1);
    }

    if (!/^\d{10}$/.test(finalWhatsapp)) {
      toast.error(t("addOperator.toastWhatsappError", { defaultValue: "Please enter a valid 10-digit WhatsApp number" }));
      return;
    }

    setLoading(true);
    try {
      let imagePath = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imagePath = uploadData.url;
        }
      }

      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch("/api/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          experience: parseInt(experience) || 0,
          location,
          state,
          machineExpertise: selectedMachines,
          availability,
          description,
          phone: finalPhone,
          whatsapp: finalWhatsapp,
          imagePath
        })
      });

      if (res.ok) {
        toast.success(t("addOperator.toastSuccess", { defaultValue: "Profile created successfully!" }));
        navigate("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.error || t("addOperator.toastFailed", { defaultValue: "Failed to create profile" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("addOperator.toastError", { defaultValue: "Error creating profile" }));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    t("addOperator.stepBasic", { defaultValue: "Basic Info" }),
    t("addOperator.stepSkills", { defaultValue: "Skills & Equipment" }),
    t("addOperator.stepContact", { defaultValue: "Contact" })
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263] transition-colors group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          {t("addOperator.backToDashboard", { defaultValue: "Back to Dashboard" })}
        </Link>
        <PageHeader title={t("addOperator.title", { defaultValue: "Register as Operator" })} subtitle={t("addOperator.subtitle", { defaultValue: "Complete your profile to get discovered by farmers" })} />

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${step > i + 1 ? "bg-green-600 text-white" : step === i + 1 ? "bg-[#172263] text-white" : "bg-[#E2E8F0] text-[#57585A]"}`}
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-[#172263]" : "text-[#57585A]"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${step > i + 1 ? "bg-green-400" : "bg-[#E2E8F0]"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_16px_rgba(232,114,12,0.06)] p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div
                onClick={() => document.getElementById("operator-photo")?.click()}
                className="border-2 border-dashed border-[#172263] rounded-2xl bg-blue-50 py-10 text-center cursor-pointer hover:bg-blue-100 transition-colors relative overflow-hidden h-48 flex flex-col items-center justify-center"
              >
                <input
                  type="file"
                  id="operator-photo"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCropperImageSrc(URL.createObjectURL(file));
                      setCropperOpen(true);
                    }
                    e.target.value = "";
                  }}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload size={32} className="text-orange-400 mx-auto mb-2" />
                    <p className="text-sm text-[#57585A]">{t("addOperator.dropPhoto", { defaultValue: "Drop your photo here or click to upload" })}</p>
                  </>
                )}
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-1.5">{t("addOperator.fullName", { defaultValue: "Full Name" })}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]"><User size={16} /></span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("addOperator.fullNamePlaceholder", { defaultValue: "Your full name" })}
                    className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-1.5">{t("addOperator.experience", { defaultValue: "Experience (years)" })}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]"><Award size={16} /></span>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder={t("addOperator.experiencePlaceholder", { defaultValue: "e.g. 5" })}
                    className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  />
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4 my-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-[#1A1A1A]">{t("addOperator.locationDetails", { defaultValue: "Location Details" })}</span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="text-xs text-[#172263] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <MapPin size={12} className="text-[#172263]" /> {t("addOperator.autoDetect", { defaultValue: "Auto-detect Location" })}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#57585A] block mb-1">{t("addOperator.stateLabel", { defaultValue: "State *" })}</label>
                    <select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setLocation("");
                      }}
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                    >
                      <option value="">{t("addOperator.selectState", { defaultValue: "Select State" })}</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#57585A] block mb-1">{t("addOperator.districtLabel", { defaultValue: "District / City *" })}</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!state}
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] disabled:opacity-50"
                    >
                      <option value="">{t("addOperator.selectDistrict", { defaultValue: "Select District" })}</option>
                      {state &&
                        districtsData.states
                          .find((s) => s.state === state)
                          ?.districts.map((d) => (
                            <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                          ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!name.trim()) {
                    toast.error(t("addOperator.toastEnterName", { defaultValue: "Please enter your full name" }));
                    return;
                  }
                  if (!experience.trim() || isNaN(Number(experience.trim())) || parseInt(experience) <= 0) {
                    toast.error(t("addOperator.toastEnterExperience", { defaultValue: "Please enter a valid experience in years" }));
                    return;
                  }
                  if (!state) {
                    toast.error(t("addOperator.toastSelectState", { defaultValue: "Please select your state" }));
                    return;
                  }
                  if (!location) {
                    toast.error(t("addOperator.toastSelectDistrict", { defaultValue: "Please select your district location" }));
                    return;
                  }
                  setStep(2);
                }}
                className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
              >
                {t("addOperator.next", { defaultValue: "Next" })} <ArrowRight size={16} />
              </button>

            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-[#57585A] block mb-3">{t("addOperator.machineExpertise", { defaultValue: "Machine Expertise" })}</label>
                <div className="flex flex-wrap gap-2">
                  {MACHINE_TYPES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMachine(m)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selectedMachines.includes(m)
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-white border-[#E2E8F0] text-[#57585A] hover:border-blue-200"
                        }`}
                    >
                      {selectedMachines.includes(m) ? "✓ " : ""}{t("machineTypes." + m, { ns: "static", defaultValue: m })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-3">{t("addOperator.availability", { defaultValue: "Availability" })}</label>
                <div className="flex gap-2">
                  {["Available", "Busy", "Not Available"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvailability(a)}
                      className={`flex-1 py-2 rounded-xl text-sm border-2 transition-all ${availability === a
                          ? a === "Available" ? "bg-green-50 border-green-500 text-green-700"
                            : a === "Busy" ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                              : "bg-red-50 border-red-400 text-red-600"
                          : "border-[#E2E8F0] text-[#57585A] hover:border-blue-200"
                        }`}
                    >
                      {a === "Available" ? "✓" : a === "Busy" ? "⏳" : "✗"} {t("status." + (a === "Not Available" ? "notAvailable" : a.toLowerCase()), { ns: "static", defaultValue: a })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-1.5">{t("addOperator.description", { defaultValue: "Description" })}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder={t("addOperator.descPlaceholder", { defaultValue: "Tell farmers about your experience and expertise..." })}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none"
                />
                <p className="text-xs text-[#57585A] text-right">{description.length}/500</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-[#E2E8F0] text-[#57585A] rounded-xl hover:border-[#172263] hover:text-[#172263] transition-colors">{t("addOperator.back", { defaultValue: "← Back" })}</button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMachines.length === 0) {
                      toast.error(t("addOperator.toastSelectExpertise", { defaultValue: "Please select at least one machine expertise" }));
                      return;
                    }
                    if (!description.trim()) {
                      toast.error(t("addOperator.toastEnterDesc", { defaultValue: "Please enter a brief description" }));
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-1 py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
                >
                  {t("addOperator.next", { defaultValue: "Next" })} →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {[
                { 
                  label: t("addOperator.phoneLabel", { defaultValue: "Phone Number" }), 
                  value: phone, 
                  onChange: setPhone, 
                  placeholder: "9876543210",
                  errorKey: "addOperator.toastPhoneError",
                  defaultError: "Please enter a valid 10-digit phone number"
                },
                { 
                  label: t("addOperator.whatsappLabel", { defaultValue: "WhatsApp Number" }), 
                  value: whatsapp, 
                  onChange: setWhatsapp, 
                  placeholder: "9876543210",
                  errorKey: "addOperator.toastWhatsappError",
                  defaultError: "Please enter a valid 10-digit WhatsApp number"
                },
              ].map((f) => {
                const cleaned = f.value.replace(/\D/g, "");
                const isInvalid = f.value.length > 0 && cleaned.length !== 10;
                return (
                  <div key={f.label}>
                    <label className="text-sm text-[#57585A] block mb-1.5">{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#57585A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+91</span>
                      <input
                        type="tel"
                        value={f.value}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          f.onChange(val);
                        }}
                        maxLength={10}
                        placeholder={f.placeholder}
                        className={cn(
                          "w-full pl-16 pr-4 py-3 bg-[#ffffff] border rounded-xl text-sm focus:outline-none",
                          isInvalid 
                            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20" 
                            : "border-[#E2E8F0] focus:border-[#172263]"
                        )}
                      />
                    </div>
                    {isInvalid && (
                      <p className="text-xs text-red-500 mt-1 font-semibold">
                        {t(f.errorKey, { defaultValue: f.defaultError })}
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border-2 border-[#E2E8F0] text-[#57585A] rounded-xl hover:border-[#172263] hover:text-[#172263] transition-colors">{t("addOperator.back", { defaultValue: "← Back" })}</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t("addOperator.submitProfile", { defaultValue: "Submit Profile →" })}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperImageSrc}
        aspect={1}
        onCropCompleteAction={async (croppedUrl) => {
          setImagePreview(croppedUrl);
          const res = await fetch(croppedUrl);
          const blob = await res.blob();
          const file = new File([blob], "operator_photo.jpg", { type: "image/jpeg" });
          setImageFile(file);
        }}
      />
    </div>
  );
}

// ===========================
// ADD HARVESTER FORM
// ===========================
export function AddHarvester() {
  const { t } = useTranslation(["pages", "static"]);
  const [company, setCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const defaultState = localStorage.getItem("tractorsewa_default_state");
    const defaultDistrict = localStorage.getItem("tractorsewa_default_district");
    if (defaultState) setState(defaultState);
    if (defaultDistrict) setLocation(defaultDistrict);
  }, []);

  const handleDetectLocation = async () => {
    const loadingToastId = toast.loading(t("addHarvester.toastDetectingLocation", { defaultValue: "Detecting location..." }));
    const detected = await detectUserLocation();
    toast.dismiss(loadingToastId);
    if (detected) {
      const matched = matchLocationWithDistricts(detected.state, detected.district);
      if (matched) {
        setState(matched.state);
        setLocation(matched.district);
        localStorage.setItem("tractorsewa_default_state", matched.state);
        localStorage.setItem("tractorsewa_default_district", matched.district);
        toast.success(t("addHarvester.toastLocationSet", { defaultValue: "Location set to {{district}}, {{state}}", district: matched.district, state: matched.state }));
      } else {
        toast.error(t("addHarvester.toastLocationMatchError", { defaultValue: "Could not match detected location with Indian states/districts." }));
      }
    } else {
      toast.error(t("addHarvester.toastLocationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCompany = company === "Other" ? customCompany.trim() : company;
    const finalModel = model === "Other / Custom Model" ? customModel.trim() : model;

    if (!finalCompany) {
      toast.error(t("addHarvester.toastCompanyError", { defaultValue: "Please specify a manufacturer company" }));
      return;
    }
    if (!finalModel) {
      toast.error(t("addHarvester.toastModelError", { defaultValue: "Please specify a harvester model" }));
      return;
    }

    const machineName = `${finalCompany} ${finalModel}`;

    if (year && (isNaN(Number(year)) || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1)) {
      toast.error(t("addHarvester.toastYearError", { defaultValue: "Please enter a valid model year" }));
      return;
    }
    if (!state) {
      toast.error(t("addHarvester.toastSelectState", { defaultValue: "Please select the state" }));
      return;
    }
    if (!location) {
      toast.error(t("addHarvester.toastSelectDistrict", { defaultValue: "Please select the district location" }));
      return;
    }
    const cleanedPhone = phone.replace(/\D/g, "");
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      finalPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      finalPhone = cleanedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(finalPhone)) {
      toast.error(t("addHarvester.toastPhoneError", { defaultValue: "Please enter a valid 10-digit phone number" }));
      return;
    }

    let finalWhatsapp = "";
    if (whatsapp.trim()) {
      const cleanedWhatsapp = whatsapp.replace(/\D/g, "");
      finalWhatsapp = cleanedWhatsapp;
      if (cleanedWhatsapp.length === 12 && cleanedWhatsapp.startsWith("91")) {
        finalWhatsapp = cleanedWhatsapp.substring(2);
      } else if (cleanedWhatsapp.length === 11 && cleanedWhatsapp.startsWith("0")) {
        finalWhatsapp = cleanedWhatsapp.substring(1);
      }

      if (!/^\d{10}$/.test(finalWhatsapp)) {
        toast.error(t("addHarvester.toastWhatsappError", { defaultValue: "Please enter a valid 10-digit WhatsApp number" }));
        return;
      }
    }

    setLoading(true);
    try {
      let imagePath = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imagePath = uploadData.url;
        }
      }

      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch("/api/harvesters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          machineName,
          company: finalCompany,
          model: finalModel,
          year,
          location,
          state,
          phone: finalPhone,
          whatsapp: finalWhatsapp,
          description,
          imagePath
        })
      });

      if (res.ok) {
        toast.success(t("addHarvester.toastSuccess", { defaultValue: "Harvester listed successfully!" }));
        navigate("/harvesters");
      } else {
        const err = await res.json();
        toast.error(err.error || t("addHarvester.toastFailed", { defaultValue: "Failed to list harvester" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("addHarvester.toastError", { defaultValue: "Error listing harvester" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263] transition-colors group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          {t("addHarvester.backToDashboard", { defaultValue: "Back to Dashboard" })}
        </Link>
        <PageHeader title={t("addHarvester.title", { defaultValue: "List Your Harvester" })} subtitle={t("addHarvester.subtitle", { defaultValue: "Add your machine to reach thousands of farmers" })} />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_16px_rgba(232,114,12,0.06)] p-8 space-y-5">
          <div
            onClick={() => document.getElementById("harvester-photo")?.click()}
            className="border-2 border-dashed border-[#172263] rounded-2xl bg-blue-50 py-10 text-center cursor-pointer hover:bg-blue-100 transition-colors relative overflow-hidden h-44 flex flex-col items-center justify-center"
          >
            <input
              type="file"
              id="harvester-photo"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCropperImageSrc(URL.createObjectURL(file));
                  setCropperOpen(true);
                }
                e.target.value = "";
              }}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <Upload size={32} className="text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-[#57585A]">{t("addHarvester.uploadPhoto", { defaultValue: "Upload machine photo" })}</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.companyLabel", { defaultValue: "Manufacturer Company" })}</label>
              <select
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setModel("");
                  setCustomCompany("");
                  setCustomModel("");
                }}
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
              >
                <option value="">{t("addHarvester.selectCompany", { defaultValue: "Select Company" })}</option>
                {HARVESTER_COMPANIES.map((c) => <option key={c} value={c}>{t("companies." + c, { ns: "static", defaultValue: c })}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.modelLabel", { defaultValue: "Harvester Model" })}</label>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setCustomModel("");
                }}
                disabled={!company}
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] disabled:opacity-50"
              >
                <option value="">{t("addHarvester.selectModel", { defaultValue: "Select Model" })}</option>
                {company && HARVESTER_MODELS[company]?.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {company === "Other" && (
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.customCompanyLabel", { defaultValue: "Custom Company Name *" })}</label>
              <input
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder={t("addHarvester.customCompanyPlaceholder", { defaultValue: "Enter manufacturer name (e.g. John Deere)" })}
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
              />
            </div>
          )}

          {(company === "Other" || model === "Other / Custom Model") && company !== "" && (
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.customModelLabel", { defaultValue: "Custom Model Name *" })}</label>
              <input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder={t("addHarvester.customModelPlaceholder", { defaultValue: "Enter harvester model name (e.g. S660)" })}
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.yearLabel", { defaultValue: "Year of Manufacture" })}</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder={t("addHarvester.yearPlaceholder", { defaultValue: "e.g. 2020" })} className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" />
            </div>
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.phoneLabel", { defaultValue: "Phone Number *" })}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#57585A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+91</span>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                  maxLength={10}
                  placeholder="9876543210" 
                  required 
                  className={cn(
                    "w-full pl-16 pr-4 py-3 bg-[#ffffff] border rounded-xl text-sm focus:outline-none",
                    phone.length > 0 && phone.replace(/\D/g, "").length !== 10
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20" 
                      : "border-[#E2E8F0] focus:border-[#172263]"
                  )} 
                />
              </div>
              {phone.length > 0 && phone.replace(/\D/g, "").length !== 10 && (
                <p className="text-xs text-red-500 mt-1 font-semibold">
                  {t("addHarvester.toastPhoneError", { defaultValue: "Please enter a valid 10-digit phone number" })}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.whatsappLabel", { defaultValue: "WhatsApp Number" })}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#57585A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+91</span>
                <input 
                  type="tel" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                  maxLength={10}
                  placeholder="9876543210" 
                  className={cn(
                    "w-full pl-16 pr-4 py-3 bg-[#ffffff] border rounded-xl text-sm focus:outline-none",
                    whatsapp.length > 0 && whatsapp.replace(/\D/g, "").length !== 10
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20" 
                      : "border-[#E2E8F0] focus:border-[#172263]"
                  )} 
                />
              </div>
              {whatsapp.length > 0 && whatsapp.replace(/\D/g, "").length !== 10 && (
                <p className="text-xs text-red-500 mt-1 font-semibold">
                  {t("addHarvester.toastWhatsappError", { defaultValue: "Please enter a valid 10-digit WhatsApp number" })}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] pt-4 my-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-[#1A1A1A]">{t("addHarvester.locationDetails", { defaultValue: "Location Details" })}</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="text-xs text-[#172263] hover:underline flex items-center gap-1 font-semibold"
              >
                <MapPin size={12} className="text-[#172263]" /> {t("addHarvester.autoDetect", { defaultValue: "Auto-detect Location" })}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("addHarvester.stateLabel", { defaultValue: "State *" })}</label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setLocation("");
                  }}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                >
                  <option value="">{t("addHarvester.selectState", { defaultValue: "Select State" })}</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("addHarvester.districtLabel", { defaultValue: "District / City *" })}</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!state}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] disabled:opacity-50"
                >
                  <option value="">{t("addHarvester.selectDistrict", { defaultValue: "Select District" })}</option>
                  {state &&
                    districtsData.states
                      .find((s) => s.state === state)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                      ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">{t("addHarvester.descriptionLabel", { defaultValue: "Description" })}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t("addHarvester.descriptionPlaceholder", { defaultValue: "Describe the machine condition and availability..." })} className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#15803D] text-white rounded-xl hover:bg-green-700 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t("addHarvester.submitListing", { defaultValue: "Submit Listing →" })}
          </button>
        </form>
      </div>
      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperImageSrc}
        aspect={4 / 3}
        onCropCompleteAction={async (croppedUrl) => {
          setImagePreview(croppedUrl);
          const res = await fetch(croppedUrl);
          const blob = await res.blob();
          const file = new File([blob], "harvester_photo.jpg", { type: "image/jpeg" });
          setImageFile(file);
        }}
      />
    </div>
  );
}


// ===========================
// EDIT HARVESTER FORM
// ===========================
export function EditHarvester() {
  const { t } = useTranslation(["pages", "static"]);
  const { id } = useParams();
  const [company, setCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHarvester = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/harvesters/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const isStandardCompany = HARVESTER_COMPANIES.includes(data.company);
          setCompany(isStandardCompany ? data.company : "Other");
          if (!isStandardCompany) setCustomCompany(data.company);

          const isStandardModel = HARVESTER_MODELS[data.company]?.includes(data.model);
          setModel(isStandardModel ? data.model : "Other / Custom Model");
          if (!isStandardModel) setCustomModel(data.model);

          setYear(data.year?.toString() || "");
          setLocation(data.location || "");
          setState(data.state || "");
          setPhone(data.phone || "");
          setWhatsapp(data.whatsapp || "");
          setDescription(data.description || "");
          if (data.imagePath) setImagePreview(data.imagePath);
        } else {
          toast.error(t("editHarvester.toastLoadDetailsFailed", { defaultValue: "Failed to load harvester details" }));
          navigate("/harvesters");
        }
      } catch (err) {
        console.error(err);
        toast.error(t("editHarvester.toastLoadError", { defaultValue: "Error loading harvester" }));
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchHarvester();
  }, [id, navigate, t]);

  const handleDetectLocation = async () => {
    const loadingToastId = toast.loading(t("editHarvester.toastDetectingLocation", { defaultValue: "Detecting location..." }));
    const detected = await detectUserLocation();
    toast.dismiss(loadingToastId);
    if (detected) {
      const matched = matchLocationWithDistricts(detected.state, detected.district);
      if (matched) {
        setState(matched.state);
        setLocation(matched.district);
        localStorage.setItem("tractorsewa_default_state", matched.state);
        localStorage.setItem("tractorsewa_default_district", matched.district);
        toast.success(t("editHarvester.toastLocationSet", { defaultValue: "Location set to {{district}}, {{state}}", district: matched.district, state: matched.state }));
      } else {
        toast.error(t("editHarvester.toastLocationMatchError", { defaultValue: "Could not match detected location with Indian states/districts." }));
      }
    } else {
      toast.error(t("editHarvester.toastLocationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCompany = company === "Other" ? customCompany.trim() : company;
    const finalModel = model === "Other / Custom Model" ? customModel.trim() : model;

    if (!finalCompany) {
      toast.error(t("editHarvester.toastCompanyError", { defaultValue: "Please specify a manufacturer company" }));
      return;
    }
    if (!finalModel) {
      toast.error(t("editHarvester.toastModelError", { defaultValue: "Please specify a harvester model" }));
      return;
    }

    const machineName = `${finalCompany} ${finalModel}`;

    if (year && (isNaN(Number(year)) || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1)) {
      toast.error(t("editHarvester.toastYearError", { defaultValue: "Please enter a valid model year" }));
      return;
    }
    if (!state) {
      toast.error(t("editHarvester.toastSelectState", { defaultValue: "Please select the state" }));
      return;
    }
    if (!location) {
      toast.error(t("editHarvester.toastSelectDistrict", { defaultValue: "Please select the district location" }));
      return;
    }
    const cleanedPhone = phone.replace(/\D/g, "");
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      finalPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      finalPhone = cleanedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(finalPhone)) {
      toast.error(t("editHarvester.toastPhoneError", { defaultValue: "Please enter a valid 10-digit phone number" }));
      return;
    }

    let finalWhatsapp = "";
    if (whatsapp.trim()) {
      const cleanedWhatsapp = whatsapp.replace(/\D/g, "");
      finalWhatsapp = cleanedWhatsapp;
      if (cleanedWhatsapp.length === 12 && cleanedWhatsapp.startsWith("91")) {
        finalWhatsapp = cleanedWhatsapp.substring(2);
      } else if (cleanedWhatsapp.length === 11 && cleanedWhatsapp.startsWith("0")) {
        finalWhatsapp = cleanedWhatsapp.substring(1);
      }

      if (!/^\d{10}$/.test(finalWhatsapp)) {
        toast.error(t("editHarvester.toastWhatsappError", { defaultValue: "Please enter a valid 10-digit WhatsApp number" }));
        return;
      }
    }

    setLoading(true);
    try {
      let imagePath = undefined;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imagePath = uploadData.url;
        }
      }

      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/harvesters/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          machineName,
          company: finalCompany,
          model: finalModel,
          year,
          location,
          state,
          phone: finalPhone,
          whatsapp: finalWhatsapp,
          description,
          ...(imagePath && { imagePath })
        })
      });

      if (res.ok) {
        toast.success(t("editHarvester.toastSuccess", { defaultValue: "Harvester updated successfully!" }));
        navigate(`/harvesters/${id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || t("editHarvester.toastFailed", { defaultValue: "Failed to update harvester" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("editHarvester.toastError", { defaultValue: "Error updating harvester" }));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to={`/harvesters/${id}`} className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263] transition-colors group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          {t("editHarvester.backToDetail", { defaultValue: "Back to Harvester Detail" })}
        </Link>
        <PageHeader title={t("editHarvester.title", { defaultValue: "Edit Harvester" })} subtitle={t("editHarvester.subtitle", { defaultValue: "Update your machine details" })} />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_16px_rgba(232,114,12,0.06)] p-8 space-y-5">
          <div
            onClick={() => document.getElementById("harvester-photo")?.click()}
            className="border-2 border-dashed border-[#172263] rounded-2xl bg-blue-50 py-10 text-center cursor-pointer hover:bg-blue-100 transition-colors relative overflow-hidden h-44 flex flex-col items-center justify-center"
          >
            <input
              type="file"
              id="harvester-photo"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCropperImageSrc(URL.createObjectURL(file));
                  setCropperOpen(true);
                }
                e.target.value = "";
              }}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <Upload size={32} className="text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-[#57585A]">{t("editHarvester.uploadPhoto", { defaultValue: "Upload new machine photo" })}</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.companyLabel", { defaultValue: "Manufacturer Company" })}</label>
              <select
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setModel("");
                  setCustomCompany("");
                  setCustomModel("");
                }}
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
              >
                <option value="">{t("editHarvester.selectCompany", { defaultValue: "Select Company" })}</option>
                {HARVESTER_COMPANIES.map((c) => <option key={c} value={c}>{t("companies." + c, { ns: "static", defaultValue: c })}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.modelLabel", { defaultValue: "Harvester Model" })}</label>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setCustomModel("");
                }}
                disabled={!company}
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] disabled:opacity-50"
              >
                <option value="">{t("editHarvester.selectModel", { defaultValue: "Select Model" })}</option>
                {company && HARVESTER_MODELS[company]?.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {company === "Other" && (
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.customCompanyLabel", { defaultValue: "Custom Company Name *" })}</label>
              <input
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder={t("editHarvester.customCompanyPlaceholder", { defaultValue: "Enter manufacturer name (e.g. John Deere)" })}
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
              />
            </div>
          )}

          {(company === "Other" || model === "Other / Custom Model") && company !== "" && (
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.customModelLabel", { defaultValue: "Custom Model Name *" })}</label>
              <input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder={t("editHarvester.customModelPlaceholder", { defaultValue: "Enter harvester model name (e.g. S660)" })}
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.yearLabel", { defaultValue: "Year of Manufacture" })}</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder={t("editHarvester.yearPlaceholder", { defaultValue: "e.g. 2020" })} className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" />
            </div>
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.phoneLabel", { defaultValue: "Phone Number *" })}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#57585A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+91</span>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                  maxLength={10}
                  placeholder="9876543210" 
                  required 
                  className={cn(
                    "w-full pl-16 pr-4 py-3 bg-[#ffffff] border rounded-xl text-sm focus:outline-none",
                    phone.length > 0 && phone.replace(/\D/g, "").length !== 10
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20" 
                      : "border-[#E2E8F0] focus:border-[#172263]"
                  )} 
                />
              </div>
              {phone.length > 0 && phone.replace(/\D/g, "").length !== 10 && (
                <p className="text-xs text-red-500 mt-1 font-semibold">
                  {t("editHarvester.toastPhoneError", { defaultValue: "Please enter a valid 10-digit phone number" })}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.whatsappLabel", { defaultValue: "WhatsApp Number" })}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#57585A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+91</span>
                <input 
                  type="tel" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                  maxLength={10}
                  placeholder="9876543210" 
                  className={cn(
                    "w-full pl-16 pr-4 py-3 bg-[#ffffff] border rounded-xl text-sm focus:outline-none",
                    whatsapp.length > 0 && whatsapp.replace(/\D/g, "").length !== 10
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20" 
                      : "border-[#E2E8F0] focus:border-[#172263]"
                  )} 
                />
              </div>
              {whatsapp.length > 0 && whatsapp.replace(/\D/g, "").length !== 10 && (
                <p className="text-xs text-red-500 mt-1 font-semibold">
                  {t("editHarvester.toastWhatsappError", { defaultValue: "Please enter a valid 10-digit WhatsApp number" })}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[#E2E8F0] pt-4 my-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-[#1A1A1A]">{t("editHarvester.locationDetails", { defaultValue: "Location Details" })}</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="text-xs text-[#172263] hover:underline flex items-center gap-1 font-semibold"
              >
                <MapPin size={12} className="text-[#172263]" /> {t("editHarvester.autoDetect", { defaultValue: "Auto-detect Location" })}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("editHarvester.stateLabel", { defaultValue: "State *" })}</label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setLocation("");
                  }}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                >
                  <option value="">{t("editHarvester.selectState", { defaultValue: "Select State" })}</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("editHarvester.districtLabel", { defaultValue: "District / City *" })}</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!state}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] disabled:opacity-50"
                >
                  <option value="">{t("editHarvester.selectDistrict", { defaultValue: "Select District" })}</option>
                  {state &&
                    districtsData.states
                      .find((s) => s.state === state)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                      ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">{t("editHarvester.descriptionLabel", { defaultValue: "Description" })}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t("editHarvester.descriptionPlaceholder", { defaultValue: "Describe the machine condition and availability..." })} className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#15803D] text-white rounded-xl hover:bg-green-700 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t("editHarvester.saveChanges", { defaultValue: "Save Changes →" })}
          </button>
        </form>
      </div>
      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperImageSrc}
        aspect={4 / 3}
        onCropCompleteAction={async (croppedUrl) => {
          setImagePreview(croppedUrl);
          const res = await fetch(croppedUrl);
          const blob = await res.blob();
          const file = new File([blob], "harvester_photo.jpg", { type: "image/jpeg" });
          setImageFile(file);
        }}
      />
    </div>
  );
}


// ===========================
// REQUESTS
// ===========================
export function Requests() {
  const { t } = useTranslation(["pages", "static"]);
  const [requests, setRequests] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [reqType, setReqType] = useState<"operator" | "harvester">("harvester");
  const [activeReqTab, setActiveReqTab] = useState<"pending" | "history">("pending");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [newReq, setNewReq] = useState({ location: "", state: "", machineType: "", duration: "", startDate: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
      const toastId = toast(t("requests.locationPrompt", { defaultValue: "📍 Optimize search results by auto-detecting your location." }), {
        action: {
          label: t("requests.detect", { defaultValue: "Detect" }),
          onClick: async () => {
            const loadingToastId = toast.loading(t("requests.detectingLocation", { defaultValue: "Detecting location..." }));
            const detected = await detectUserLocation();
            toast.dismiss(loadingToastId);
            if (detected) {
              const matched = matchLocationWithDistricts(detected.state, detected.district);
              if (matched) {
                localStorage.setItem("tractorsewa_default_state", matched.state);
                localStorage.setItem("tractorsewa_default_district", matched.district);
                setSelectedState(matched.state);
                setSelectedDistrict(matched.district);
                toast.success(t("requests.locationSet", { defaultValue: "Location set to {{district}}, {{state}}!", district: matched.district, state: matched.state }));
              } else {
                toast.error(t("requests.locationMatchError", { defaultValue: "Could not match your location with Indian states/districts." }));
              }
            } else {
              toast.error(t("requests.locationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
            }
          }
        },
        cancel: {
          label: t("requests.dismiss", { defaultValue: "Dismiss" }),
          onClick: () => {
            localStorage.setItem("tractorsewa_location_dismissed", "true");
          }
        },
        duration: 10000,
      });
      return () => { toast.dismiss(toastId); };
    }
  }, [t]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/requests?location=${encodeURIComponent(selectedDistrict)}&state=${encodeURIComponent(selectedState)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedState, selectedDistrict]);

  // Handle auto-detect for Dialog
  const handleDialogDetectLocation = async () => {
    const loadingToastId = toast.loading(t("requests.dialogDetectingLocation", { defaultValue: "Detecting location..." }));
    const detected = await detectUserLocation();
    toast.dismiss(loadingToastId);
    if (detected) {
      const matched = matchLocationWithDistricts(detected.state, detected.district);
      if (matched) {
        setNewReq(prev => ({
          ...prev,
          state: matched.state,
          location: matched.district
        }));
        toast.success(t("requests.dialogLocationSet", { defaultValue: "Location set to {{district}}, {{state}}", district: matched.district, state: matched.state }));
      } else {
        toast.error(t("requests.dialogLocationMatchError", { defaultValue: "Could not match location with Indian states/districts." }));
      }
    } else {
      toast.error(t("requests.dialogLocationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
    }
  };

  const postReq = async () => {
    if (!newReq.location || !newReq.state || !newReq.machineType || !newReq.startDate) {
      toast.error(t("requests.toastFillRequired", { defaultValue: "Please fill out all required fields" }));
      return;
    }
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "harvester",
          ...newReq
        })
      });

      if (res.ok) {
        setShowDialog(false);
        setNewReq({ location: "", state: "", machineType: "", duration: "", startDate: "", description: "" });
        toast.success(t("requests.toastPostSuccess", { defaultValue: "Requirement posted successfully!" }));
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || t("requests.toastPostFailed", { defaultValue: "Failed to post requirement" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("requests.toastPostError", { defaultValue: "Error posting requirement" }));
    }
  };

  const deleteReq = async (id: number) => {
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setConfirmDelete(null);
        toast.success(t("requests.toastDeleteSuccess", { defaultValue: "Requirement deleted." }));
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || t("requests.toastDeleteFailed", { defaultValue: "Failed to delete" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("requests.toastDeleteError", { defaultValue: "Error deleting requirement" }));
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "Pending" || r.status === "Open");
  const historyRequests = requests.filter((r) => r.status === "Accepted" || r.status === "Rejected");
  const filtered = activeReqTab === "pending" ? pendingRequests : historyRequests;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="w-full mx-auto px-4 sm:px-6 py-8">
        <PageHeader
          title={t("requests.title", { defaultValue: "My Crop Requirements" })}
          action={
            <button
              onClick={() => {
                const defaultState = localStorage.getItem("tractorsewa_default_state") || "";
                const defaultDistrict = localStorage.getItem("tractorsewa_default_district") || "";
                setNewReq({
                  location: defaultDistrict,
                  state: defaultState,
                  machineType: "",
                  duration: "",
                  startDate: "",
                  description: ""
                });
                setShowDialog(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors"
            >
              <Plus size={16} /> {t("requests.postRequirement", { defaultValue: "Post Requirement" })}
            </button>
          }
        />

        {/* Tabs and filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveReqTab("pending")}
              className={`px-5 py-2.5 rounded-xl text-sm border-2 transition-all ${
                activeReqTab === "pending"
                  ? "border-[#172263] bg-blue-50 text-[#172263] font-semibold"
                  : "border-[#E2E8F0] text-[#57585A] hover:border-blue-200"
              }`}
            >
              {t("requests.pendingTab", { defaultValue: "Pending Requests" })} ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveReqTab("history")}
              className={`px-5 py-2.5 rounded-xl text-sm border-2 transition-all ${
                activeReqTab === "history"
                  ? "border-[#172263] bg-blue-50 text-[#172263] font-semibold"
                  : "border-[#E2E8F0] text-[#57585A] hover:border-blue-200"
              }`}
            >
              {t("requests.historyTab", { defaultValue: "Request History" })} ({historyRequests.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-white w-40"
            >
              <option value="">{t("requests.allStates", { defaultValue: "All States" })}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-white w-40 disabled:opacity-50"
            >
              <option value="">{t("requests.allDistricts", { defaultValue: "All Districts" })}</option>
              {selectedState &&
                districtsData.states
                  .find((s) => s.state === selectedState)
                  ?.districts.map((d) => (
                    <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                  ))}
            </select>
            {(selectedState || selectedDistrict) && (
              <button
                onClick={() => {
                  setSelectedState("");
                  setSelectedDistrict("");
                }}
                className="text-[#172263] text-xs px-2 hover:underline"
              >
                {t("requests.clearLocation", { defaultValue: "Clear Location" })}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                activeReqTab === "pending"
                  ? t("requests.emptyTitlePending", { defaultValue: "No pending requests" })
                  : t("requests.emptyTitleHistory", { defaultValue: "No request history" })
              }
              description={
                activeReqTab === "pending"
                  ? t("requests.emptyDescriptionPending", { defaultValue: "Post a harvester requirement to get started." })
                  : t("requests.emptyDescriptionHistory", { defaultValue: "Your accepted and rejected requests will appear here." })
              }
            />
          ) : (
            filtered.map((req) => {
              const isOwner = currentUser && req.userId === currentUser.id;
              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border border-[#E2E8F0] p-5 flex gap-4 items-start shadow-[0_2px_16px_rgba(232,114,12,0.06)] border-l-4 ${
                    req.status === "Accepted"
                      ? "border-l-emerald-500"
                      : req.status === "Rejected"
                      ? "border-l-rose-500"
                      : "border-l-amber-500"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 capitalize">
                        {req.type === "harvester" ? t("requests.harvesterType", { defaultValue: "Harvester" }) : req.type}
                      </span>
                      {req.status === "Accepted" && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 shadow-sm">
                          <CheckCircle2 size={12} /> {t("requests.status.accepted", { defaultValue: "Accepted" })}
                        </span>
                      )}
                      {req.status === "Rejected" && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1 shadow-sm">
                          <XCircle size={12} /> {t("requests.status.rejected", { defaultValue: "Rejected" })}
                        </span>
                      )}
                      {(req.status === "Pending" || req.status === "Open") && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex items-center gap-1 animate-pulse shadow-sm">
                          <Clock size={12} /> {t("requests.status.pending", { defaultValue: "Pending" })}
                        </span>
                      )}
                      {isOwner && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold shadow-sm">
                          {t("requests.myRequirement", { defaultValue: "My Requirement" })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[#57585A]">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {req.location}{req.state ? `, ${req.state}` : ""}
                      </span>
                      <span>{t("machineTypes." + req.machineType, { ns: "static", defaultValue: req.machineType })}</span>
                      <span>{t("requests.durationDays", { defaultValue: "{{count}} days", count: req.duration })}</span>
                      <span>{new Date(req.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/requests/${req.id}`} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                      {t("requests.viewBtn", { defaultValue: "View" })}
                    </Link>
                    {isOwner && (
                      <button onClick={() => setConfirmDelete(req.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Post Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-lg border border-[#E2E8F0] max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>{t("requests.postTitleHarvester", { defaultValue: "Post Harvester Requirement" })}</h3>
              <button
                type="button"
                onClick={handleDialogDetectLocation}
                className="text-xs px-3 py-1.5 bg-blue-50 border border-blue-200 text-[#172263] rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <MapPin size={12} /> {t("requests.autoDetect", { defaultValue: "Auto-detect Location" })}
              </button>
            </div>
            
            <div className="space-y-3">
              {/* State Dropdown */}
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.stateLabel", { defaultValue: "State *" })}</label>
                <select
                  value={newReq.state}
                  onChange={(e) => setNewReq(prev => ({ ...prev, state: e.target.value, location: "" }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-[#ffffff]"
                >
                  <option value="">{t("requests.selectState", { defaultValue: "Select State" })}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.districtLabel", { defaultValue: "District / Location *" })}</label>
                <select
                  value={newReq.location}
                  onChange={(e) => setNewReq(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!newReq.state}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-[#ffffff] disabled:opacity-50"
                >
                  <option value="">{t("requests.selectDistrict", { defaultValue: "Select District" })}</option>
                  {newReq.state &&
                    districtsData.states
                      .find((s) => s.state === newReq.state)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                      ))}
                </select>
              </div>

              {/* Other inputs */}
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.machineTypeLabel", { defaultValue: "Machine Type *" })}</label>
                <select
                  value={newReq.machineType}
                  onChange={(e) => setNewReq(prev => ({ ...prev, machineType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-[#ffffff]"
                >
                  <option value="">{t("requests.selectMachineType", { defaultValue: "Select Machine Type" })}</option>
                  {MACHINE_TYPES.map((tVal) => (
                    <option key={tVal} value={tVal}>{t("machineTypes." + tVal, { ns: "static", defaultValue: tVal })}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#57585A] block mb-1">{t("requests.durationLabel", { defaultValue: "Duration (days)" })}</label>
                  <input
                    type="number"
                    placeholder={t("requests.durationPlaceholder", { defaultValue: "Duration" })}
                    value={newReq.duration}
                    onChange={(e) => setNewReq(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#57585A] block mb-1">{t("requests.startDateLabel", { defaultValue: "Start Date *" })}</label>
                  <input
                    type="date"
                    value={newReq.startDate}
                    onChange={(e) => setNewReq(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.descriptionLabel", { defaultValue: "Description" })}</label>
                <textarea
                  rows={2}
                  placeholder={t("requests.descriptionPlaceholder", { defaultValue: "Describe your requirement in detail..." })}
                  value={newReq.description}
                  onChange={(e) => setNewReq((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDialog(false)} className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[#57585A] text-sm hover:bg-gray-50">{t("requests.cancelBtn", { defaultValue: "Cancel" })}</button>
              <button onClick={postReq} className="flex-1 py-2.5 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("requests.postBtn", { defaultValue: "Post Requirement →" })}</button>
            </div>
          </motion.div>
        </div>
      )}


      {/* Confirm Delete */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E2E8F0]">
            <h3 className="text-lg text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("requests.deleteTitle", { defaultValue: "Delete Requirement?" })}</h3>
            <p className="text-[#57585A] text-sm mb-4">{t("requests.deleteDesc", { defaultValue: "This action cannot be undone." })}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm">{t("requests.cancelBtn", { defaultValue: "Cancel" })}</button>
              <button onClick={() => deleteReq(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors">{t("requests.deleteBtn", { defaultValue: "Delete" })}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
                className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors flex items-center justify-center font-semibold text-center text-sm gap-2"
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

// ===========================
// BLOGS
// ===========================
export function Blogs() {
  const { t } = useTranslation(["pages", "static"]);
  const [categories, setCategories] = useState<string[]>(["All", "Harvesting Tips", "Machine Maintenance", "Success Stories", "Agri News", "Weather & Season"]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch dynamic categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/blogs/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(["All", ...data]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch blog categories", err);
      }
    };
    fetchCategories();
  }, []);

  // States for Reels/Shorts Infinite Scroll Feed (Backend Paginated)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const [hasMore, setHasMore] = useState(true);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedBlogs, setLikedBlogs] = useState<Record<string | number, boolean>>({});
  const [likesCounts, setLikesCounts] = useState<Record<string | number, number>>({});
  const [commentsCounts, setCommentsCounts] = useState<Record<string | number, number>>({});
  const [activeBlog, setActiveBlog] = useState<any | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string | number, boolean>>({});

  const feedRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pendingLikesRef = useRef<Record<string | number, boolean>>({});
  const likeTimeoutRef = useRef<any>(null);
  const currentBlogIdRef = useRef<string | number | null>(null);

  // Sync initial loading
  useEffect(() => {
    const fetchInitialBlogs = async () => {
      setLoading(true);
      const newSeed = Math.floor(Math.random() * 1000000);
      setSeed(newSeed);
      setBlogs([]);
      setHasMore(true);
      setAutoScrollPaused(false);

      try {
        const token = localStorage.getItem("tractorsewa_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const catParam = category === "All" ? "" : `category=${encodeURIComponent(category)}`;
        const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
        const limitParam = "limit=2";
        const offsetParam = "offset=0";
        const seedParam = `seed=${newSeed}`;
        const params = [catParam, searchParam, limitParam, offsetParam, seedParam].filter(Boolean).join("&");

        const res = await fetch(`/api/blogs?${params}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setBlogs(data);
          setHasMore(data.length === 2);

          // Initialize states from dynamic database values
          const initialLiked: Record<string | number, boolean> = {};
          const counts: Record<string | number, number> = {};
          const comms: Record<string | number, number> = {};
          data.forEach((b: any) => {
            initialLiked[b.id] = !!b.has_liked;
            counts[b.id] = b.likes_count || 0;
            comms[b.id] = b.comments_count || 0;
          });
          setLikedBlogs(prev => ({ ...prev, ...initialLiked }));
          setLikesCounts(prev => ({ ...prev, ...counts }));
          setCommentsCounts(prev => ({ ...prev, ...comms }));

          // Reset scroll to top
          if (feedRef.current) {
            feedRef.current.scrollTop = 0;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(() => {
      fetchInitialBlogs();
    }, 300);

    return () => clearTimeout(delay);
  }, [search, category]);

  const loadMoreBlogs = async () => {
    if (loadingMore || !hasMore || autoScrollPaused) return;
    setLoadingMore(true);

    try {
      const token = localStorage.getItem("tractorsewa_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const catParam = category === "All" ? "" : `category=${encodeURIComponent(category)}`;
      const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
      const limitParam = "limit=2";
      const offsetParam = `offset=${blogs.length}`;
      const seedParam = `seed=${seed}`;
      const params = [catParam, searchParam, limitParam, offsetParam, seedParam].filter(Boolean).join("&");

      const res = await fetch(`/api/blogs?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const existingIds = new Set(blogs.map(b => b.id));
          const filteredNewData = data.filter((b: any) => !existingIds.has(b.id));

          setBlogs(prev => [...prev, ...filteredNewData]);
          setHasMore(data.length === 2);

          const initialLiked: Record<string | number, boolean> = {};
          const counts: Record<string | number, number> = {};
          const comms: Record<string | number, number> = {};
          data.forEach((b: any) => {
            initialLiked[b.id] = !!b.has_liked;
            counts[b.id] = b.likes_count || 0;
            comms[b.id] = b.comments_count || 0;
          });
          setLikedBlogs(prev => ({ ...prev, ...initialLiked }));
          setLikesCounts(prev => ({ ...prev, ...counts }));
          setCommentsCounts(prev => ({ ...prev, ...comms }));

          // Pause after 6 blogs loaded (Initial 2 + 2 scrolls = 6 blogs)
          if (blogs.length + filteredNewData.length >= 6) {
            setAutoScrollPaused(true);
          }
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleResumeLoading = () => {
    setAutoScrollPaused(false);
    setLoadingMore(true);
    setTimeout(() => {
      const fetchNext = async () => {
        try {
          const token = localStorage.getItem("tractorsewa_token");
          const headers: Record<string, string> = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const catParam = category === "All" ? "" : `category=${encodeURIComponent(category)}`;
          const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
          const limitParam = "limit=2";
          const offsetParam = `offset=${blogs.length}`;
          const seedParam = `seed=${seed}`;
          const params = [catParam, searchParam, limitParam, offsetParam, seedParam].filter(Boolean).join("&");

          const res = await fetch(`/api/blogs?${params}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              const existingIds = new Set(blogs.map(b => b.id));
              const filteredNewData = data.filter((b: any) => !existingIds.has(b.id));

              setBlogs(prev => [...prev, ...filteredNewData]);
              setHasMore(data.length === 2);

              const initialLiked: Record<string | number, boolean> = {};
              const counts: Record<string | number, number> = {};
              const comms: Record<string | number, number> = {};
              data.forEach((b: any) => {
                initialLiked[b.id] = !!b.has_liked;
                counts[b.id] = b.likes_count || 0;
                comms[b.id] = b.comments_count || 0;
              });
              setLikedBlogs(prev => ({ ...prev, ...initialLiked }));
              setLikesCounts(prev => ({ ...prev, ...counts }));
              setCommentsCounts(prev => ({ ...prev, ...comms }));
            } else {
              setHasMore(false);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingMore(false);
        }
      };
      fetchNext();
    }, 50);
  };

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && !autoScrollPaused) {
          loadMoreBlogs();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, loadingMore, hasMore, autoScrollPaused, blogs.length]);

  // Sync likes function
  const syncPendingLikes = async () => {
    const pending = pendingLikesRef.current;
    pendingLikesRef.current = {}; // Clear immediately

    const token = localStorage.getItem("tractorsewa_token");
    if (!token) return;

    for (const [id, liked] of Object.entries(pending)) {
      try {
        await fetch(`/api/blogs/${id}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ liked }),
        });
      } catch (err) {
        console.error(`Failed to sync like for blog ${id}`, err);
      }
    }
  };

  // Sync pending changes on unmount
  useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
      if (Object.keys(pendingLikesRef.current).length > 0) {
        syncPendingLikes();
      }
    };
  }, []);

  const handleLike = (id: string | number) => {
    const token = localStorage.getItem("tractorsewa_token");
    if (!token) {
      setAuthDialogOpen(true);
      return;
    }

    const wasLiked = !!likedBlogs[id];
    const newLiked = !wasLiked;

    // Update locally
    setLikedBlogs((prev) => ({ ...prev, [id]: newLiked }));
    setLikesCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + (newLiked ? 1 : -1)),
    }));

    // Register pending change
    pendingLikesRef.current[id] = newLiked;

    // Debounce database request (1.5 seconds)
    if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
    likeTimeoutRef.current = setTimeout(() => {
      syncPendingLikes();
    }, 1500);

    toast.success(newLiked ? t("blogs.postLiked", { defaultValue: "Post liked! ❤️" }) : t("blogs.removedFromLiked", { defaultValue: "Removed from liked posts" }));
  };

  const handleShare = (id: string | number) => {
    const url = `${window.location.origin}/blogs/${id}`;
    navigator.clipboard.writeText(url);
    toast.success(t("blogs.linkCopied", { defaultValue: "Blog link copied to clipboard! 🔗" }));
  };

  const handleScrollToTop = () => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const containerHeight = e.currentTarget.clientHeight;
    if (containerHeight === 0) return;

    const index = Math.round(scrollTop / containerHeight);
    if (index >= 0 && index < blogs.length) {
      const activeBlogItem = blogs[index];
      if (activeBlogItem && activeBlogItem.id !== currentBlogIdRef.current) {
        // Blog changed! Immediately flush pending likes of previous blog
        if (Object.keys(pendingLikesRef.current).length > 0) {
          syncPendingLikes();
        }
        currentBlogIdRef.current = activeBlogItem.id;
      }
    }
  };

  const fetchBlogDetail = async (id: string | number) => {
    const token = localStorage.getItem("tractorsewa_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const res = await fetch(`/api/blogs/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setActiveBlog(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenArticle = (blog: any) => {
    setActiveBlog(blog);
    fetchBlogDetail(blog.id);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText || !newCommentText.trim() || !activeBlog) return;

    const token = localStorage.getItem("tractorsewa_token");
    if (!token) {
      setAuthDialogOpen(true);
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/blogs/${activeBlog.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newCommentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        // Update activeBlog.comments locally
        setActiveBlog((prev: any) => ({
          ...prev,
          comments: [newComment, ...(prev?.comments || [])],
        }));
        // Update commentsCount locally
        setCommentsCounts((prev) => ({
          ...prev,
          [activeBlog.id]: (prev[activeBlog.id] || 0) + 1,
        }));
        setNewCommentText("");
        toast.success(t("blogs.commentAdded", { defaultValue: "Comment added successfully!" }));
      } else {
        const data = await res.json();
        toast.error(data.error || t("blogs.failedPostComment", { defaultValue: "Failed to post comment" }));
      }
    } catch {
      toast.error(t("blogs.failedPostCommentTry", { defaultValue: "Failed to post comment. Please try again." }));
    } finally {
      setSubmittingComment(false);
    }
  };

  const fallbackImages = [
    "/blog-punjab-farmers.png",
    "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1592982537447-6f233c7f12e2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&q=80&w=800",
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#ffffff]">
      <Navbar variant="auth" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-64px)] w-full relative">
        {/* Left Sidebar - Filters & Search (Desktop Only) */}
        <aside
          className={`hidden md:flex flex-col shrink-0 border-r border-[#E2E8F0] bg-white p-6 justify-between transition-all duration-300 relative ${isSidebarOpen ? "w-80" : "w-0 p-0 border-r-0 overflow-hidden"
            }`}
        >
          {isSidebarOpen && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1A1A1A] font-sora">
                    {t("blogs.harvestingKnowledge", { defaultValue: "Harvesting Knowledge" })}
                  </h2>
                  <p className="text-xs text-[#57585A] mt-1">
                    {t("blogs.subtitle", { defaultValue: "Tips, guides, and stories from the field" })}
                  </p>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-[#57585A] hover:text-[#172263] transition-colors"
                  title={t("blogs.collapseSidebar", { defaultValue: "Collapse Sidebar" })}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("blogs.searchPlaceholder", { defaultValue: "Search articles..." })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-white transition-colors"
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#57585A]">
                  {t("blogs.categoriesLabel", { defaultValue: "Categories" })}
                </label>
                <div className="flex flex-col gap-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${category === c
                          ? "bg-[#172263] text-white border-[#172263]"
                          : "bg-white border-[#E2E8F0] text-[#57585A] hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                      {t("blogCategories." + c, { ns: "static", defaultValue: c })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isSidebarOpen && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-center mt-auto">
              <Tractor size={32} className="mx-auto text-blue-300 mb-2" />
              <p className="text-[10px] text-[#57585A]">
                {t("blogs.needHelp", { defaultValue: "Need help with a harvester machine? Connect with operators in your area." })}
              </p>
            </div>
          )}
        </aside>

        {/* Floating Toggle Button to open Sidebar when collapsed (Desktop Only) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="hidden md:flex absolute left-4 top-4 z-20 p-2.5 bg-white border border-[#E2E8F0] rounded-full shadow-md text-[#172263] hover:bg-slate-50 transition-all active:scale-95 items-center justify-center"
            title={t("blogs.openSidebar", { defaultValue: "Open Sidebar" })}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Mobile Filter & Search Header (Mobile Only) */}
        <div className="md:hidden bg-white border-b border-[#E2E8F0] p-4 flex flex-col gap-3 shrink-0 w-full">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("blogs.searchPlaceholder", { defaultValue: "Search articles..." })}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${category === c
                    ? "bg-[#172263] text-white border-[#172263]"
                    : "bg-white border-[#E2E8F0] text-[#57585A]"
                  }`}
              >
                {t("blogCategories." + c, { ns: "static", defaultValue: c })}
              </button>
            ))}
          </div>
        </div>

        {/* Infinite Scroll Snapping Container */}
        <main
          ref={feedRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth w-full flex flex-col items-center bg-[#F8FAFC]"
        >
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 size={36} className="text-[#172263] animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm max-w-sm w-full p-8 text-center">
                <EmptyState title={t("blogs.noArticlesFound", { defaultValue: "No articles found" })} description={t("blogs.tryDifferentSearch", { defaultValue: "Try a different search term or category." })} />
              </div>
            </div>
          ) : (
            <>
              {blogs.map((blog) => {
                const finalImageUrl = blog.image_url || blog.imageUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                const hasImageError = !!imageErrors[blog.id];

                return (
                  <div
                    key={blog.id}
                    className="h-[calc(100vh-178px)] md:h-[calc(100vh-64px)] w-full flex items-center justify-center shrink-0 snap-start relative p-4 md:p-6"
                  >
                    {/* Shorts-style Card - Horizontal on Desktop, Vertical on Mobile */}
                    <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#E2E8F0] overflow-hidden w-full max-w-lg md:max-w-4xl h-[92%] md:h-[84%] flex flex-col md:flex-row relative group transition-all duration-300">
                      {/* Visual Banner Header */}
                      <div className="h-[35%] md:h-full md:w-[45%] bg-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                        {!hasImageError ? (
                          <img
                            src={finalImageUrl}
                            alt={blog.title}
                            onError={() => {
                              setImageErrors((prev) => ({ ...prev, [blog.id]: true }));
                            }}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${[
                              "from-[#172263] to-[#D97706]",
                              "from-[#15803D] to-[#172263]",
                              "from-[#B91C1C] to-[#D97706]",
                              "from-[#1E3A8A] to-[#3B82F6]",
                              "from-[#78350F] to-[#D97706]"
                            ][typeof blog.id === "number" ? blog.id % 5 : 0]
                            } flex flex-col items-center justify-center p-6 text-white text-center w-full relative`}>
                            <Tractor size={40} className="text-white/20 mb-2 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full mb-1">
                              {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
                            </span>
                            <h4 className="text-xs font-bold leading-snug line-clamp-3 px-2">{blog.title}</h4>
                            <WheatWatermark className="opacity-10 scale-75" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:hidden" />

                        {/* Category Badge & Date (Only on mobile overlay) */}
                        <div className="absolute top-3 left-3 md:hidden">
                          <span className="px-2.5 py-0.5 bg-[#172263] text-white text-[9px] font-bold uppercase rounded-full shadow-md">
                            {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-12 md:hidden">
                          <h3 className="text-white text-xs sm:text-sm font-bold leading-snug drop-shadow-sm line-clamp-1">
                            {blog.title}
                          </h3>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 p-5 md:p-8 flex flex-col justify-between overflow-hidden h-[65%] md:h-full">
                        {/* Title Row (Desktop Only) */}
                        <div className="hidden md:block mb-4 shrink-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 bg-[#172263] text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                              {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
                            </span>
                            <span className="text-[10px] text-[#57585A] font-medium flex items-center gap-1">
                              <Clock size={10} /> {blog.date}
                            </span>
                          </div>
                          <h3
                            className="text-[#1A1A1A] text-xl md:text-2xl font-bold leading-tight"
                            style={{ fontFamily: "'Sora', sans-serif" }}
                          >
                            {blog.title}
                          </h3>
                        </div>

                        {/* Mobile Title Sub-row (Mobile Only) */}
                        <div className="md:hidden mb-2 shrink-0 flex items-center justify-between">
                          <span className="text-[9px] text-[#57585A] font-medium flex items-center gap-0.5">
                            <Clock size={10} /> {blog.date}
                          </span>
                        </div>

                        {/* Text description with right-padding to avoid action overlay */}
                        <div className="flex-1 overflow-y-auto pr-14 scrollbar-thin space-y-4">
                          <p className="text-[#57585A] text-xs md:text-sm leading-relaxed font-normal">
                            {blog.short_description || blog.shortDescription}
                          </p>

                          {/* Decorative Agriculture highlight */}
                          <div className="bg-amber-50/40 border-l-4 border-amber-500 p-3 md:p-4 rounded-r-xl">
                            <p className="text-[10px] md:text-[11px] italic text-[#D97706] font-medium leading-relaxed">
                              {t("blogs.agriQuote", { defaultValue: "\"Agriculture is our wisest pursuit, because in the end it will contribute most to real wealth, good morals, and happiness.\"" })}
                            </p>
                          </div>
                        </div>

                        {/* Slide Footer */}
                        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {blog.authorName ? blog.authorName.charAt(0) : "A"}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#1A1A1A]">
                                {blog.authorName || t("blogs.authorFallback", { defaultValue: "Agri Team" })}
                              </p>
                              <p className="text-[9px] text-[#57585A]">{t("blogs.expertContributor", { defaultValue: "Expert Contributor" })}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenArticle(blog)}
                            className="px-4 py-2 bg-[#172263] text-white text-xs font-bold rounded-xl hover:bg-[#11194A] transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                          >
                            <BookOpen size={13} /> {t("blogs.readArticle", { defaultValue: "Read Article" })}
                          </button>
                        </div>
                      </div>

                      {/* Reels-style Floating Action Bar (Bottom-Right on Mobile, Center-Right on Desktop) */}
                      <div className="absolute right-4 bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2 flex flex-col gap-4 items-center z-10">
                        {/* Like Heart Button */}
                        <div className="flex flex-col items-center">
                          <motion.button
                            whileTap={{ scale: 1.3 }}
                            onClick={() => handleLike(blog.id)}
                            className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md border border-[#E2E8F0] backdrop-blur-md transition-all ${likedBlogs[blog.id]
                                ? "bg-red-50 text-red-500 border-red-200"
                                : "bg-white/95 text-[#57585A] hover:text-[#172263]"
                              }`}
                          >
                            <Heart size={16} className={likedBlogs[blog.id] ? "fill-current" : ""} />
                          </motion.button>
                          <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1.5 backdrop-blur-xs shadow-xs border border-white/10 select-none">
                            {likesCounts[blog.id] || 0}
                          </span>
                        </div>

                        {/* Comment Button */}
                        <div className="flex flex-col items-center">
                          <motion.button
                            whileTap={{ scale: 1.15 }}
                            onClick={() => handleOpenArticle(blog)}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 text-[#57585A] hover:text-[#172263] flex items-center justify-center shadow-md border border-[#E2E8F0] backdrop-blur-md transition-all"
                          >
                            <MessageCircle size={15} />
                          </motion.button>
                          <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1.5 backdrop-blur-xs shadow-xs border border-white/10 select-none">
                            {commentsCounts[blog.id] || 0}
                          </span>
                        </div>

                        {/* Share Copy Button */}
                        <div className="flex flex-col items-center">
                          <motion.button
                            whileTap={{ scale: 1.15 }}
                            onClick={() => handleShare(blog.id)}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 text-[#57585A] hover:text-[#172263] flex items-center justify-center shadow-md border border-[#E2E8F0] backdrop-blur-md transition-all"
                          >
                            <Share2 size={15} />
                          </motion.button>
                          <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1.5 backdrop-blur-xs shadow-xs border border-white/10 select-none">
                            {t("blogs.share", { defaultValue: "Share" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loader Slide (Visible when scrolling to retrieve more blogs) */}
              {hasMore && (
                <div
                  ref={loaderRef}
                  className="h-[calc(100vh-178px)] md:h-[calc(100vh-64px)] w-full flex items-center justify-center shrink-0 snap-start p-4 md:p-6"
                >
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] w-full max-w-lg md:max-w-4xl h-[92%] md:h-[84%] flex flex-col justify-center items-center p-8 relative shadow-sm text-center">
                    {autoScrollPaused ? (
                      <>
                        <BookOpen size={40} className="text-[#172263] mb-4 animate-bounce" />
                        <h4 className="text-sm font-semibold text-[#1A1A1A]">Ready for more?</h4>
                        <p className="text-xs text-[#57585A] mt-1 mb-6">
                          We paused loading to optimize performance. Click below to continue loading.
                        </p>
                        <button
                          onClick={handleResumeLoading}
                          className="px-6 py-3 bg-[#172263] hover:bg-[#11194A] text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Keep Loading Blogs
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 size={36} className="text-[#172263] animate-spin mb-4" />
                        <p className="text-sm font-semibold text-[#1A1A1A]">{t("blogs.fetchingUpdates", { defaultValue: "Fetching fresh updates..." })}</p>
                        <p className="text-xs text-[#57585A] mt-1">
                          {t("blogs.bestGuides", { defaultValue: "Bringing you the best harvesting guides" })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* End of Feed Card */}
              {blogs.length > 0 && !hasMore && (
                <div className="h-[calc(100vh-178px)] md:h-[calc(100vh-64px)] w-full flex items-center justify-center shrink-0 snap-start p-4 md:p-6">
                  <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#E2E8F0] overflow-hidden w-full max-w-lg md:max-w-4xl h-[92%] md:h-[84%] flex flex-col justify-center items-center p-8 relative text-center">
                    {/* Animated Check Circle */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-16 h-16 md:w-20 md:h-20 bg-green-50 border-2 border-green-500 rounded-full flex items-center justify-center text-green-500 shadow-md mb-6 animate-pulse"
                    >
                      <CheckCircle2 size={36} className="stroke-[2.5] md:size-[44px]" />
                    </motion.div>

                    <h3
                      className="text-[#1A1A1A] text-lg md:text-xl font-bold mb-2"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {t("blogs.allCaughtUp", { defaultValue: "You're All Caught Up!" })}
                    </h3>
                    <p className="text-[#57585A] text-xs md:text-sm max-w-xs mb-8">
                      {t("blogs.allCaughtUpDesc", { defaultValue: "This was all for today. Check back tomorrow for more agri guides and harvester updates." })}
                    </p>

                    {/* Back to top button */}
                    <button
                      onClick={handleScrollToTop}
                      className="px-6 py-3 bg-[#172263] text-white text-xs md:text-sm font-bold rounded-xl hover:bg-[#11194A] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                    >
                      <ArrowLeft size={16} className="rotate-90" /> {t("blogs.backToTop", { defaultValue: "Back to Top" })}
                    </button>

                    {/* Subtle wheat watermark */}
                    <WheatWatermark className="opacity-[0.03] bottom-6 right-6 scale-90" />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Slide-Over Drawer for Full Blog content */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${activeBlog ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setActiveBlog(null)}
        />

        {/* Drawer Container */}
        <div
          className={`absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${activeBlog ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {activeBlog && (
            <>
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                    {t("blogCategories." + activeBlog.category, { ns: "static", defaultValue: activeBlog.category })}
                  </span>
                  <span className="text-xs text-[#57585A]">{activeBlog.date}</span>
                </div>
                <button
                  onClick={() => setActiveBlog(null)}
                  className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#57585A] hover:text-[#172263] hover:shadow-sm transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="h-60 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center border border-[#E2E8F0] relative overflow-hidden">
                  <img
                    src={
                      activeBlog.image_url ||
                      activeBlog.imageUrl ||
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"
                    }
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                    }}
                    alt={activeBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h1
                  className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] leading-tight"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {activeBlog.title}
                </h1>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white font-bold">
                    {activeBlog.authorName ? activeBlog.authorName.charAt(0) : "T"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      {activeBlog.authorName || t("blogs.authorTeam", { defaultValue: "Tractor Seva Agri Team" })}
                    </p>
                    <p className="text-xs text-[#57585A]">{t("blogs.authorSub", { defaultValue: "Agricultural Expert & Writer" })}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-[#E2E8F0]" />

                {/* Prose content */}
                <div className="prose prose-sm max-w-none text-[#57585A] leading-relaxed space-y-4 font-normal text-sm sm:text-base">
                  <p className="font-semibold text-[#1A1A1A] text-base">
                    {activeBlog.short_description || activeBlog.shortDescription}
                  </p>
                  <div className="text-sm text-[#57585A] leading-relaxed">
                    {activeBlog.content ? renderMarkdown(activeBlog.content) : t("blogs.loadingContent", { defaultValue: "Full article text is loading..." })}
                  </div>
                </div>

                {/* Engagement: Comments Section */}
                <div className="mt-8 pt-8 border-t border-[#E2E8F0] space-y-4">
                  <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <MessageCircle size={18} /> {t("blogs.discussion", { defaultValue: "Discussion" })} ({activeBlog.comments ? activeBlog.comments.length : commentsCounts[activeBlog.id] || 0})
                  </h3>

                  {/* Comment Form */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder={t("blogs.writeComment", { defaultValue: "Share your thoughts or ask a question..." })}
                      className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-[#F8FAFC]"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="px-4 py-2 bg-[#172263] text-white text-xs font-bold rounded-xl hover:bg-[#11194A] transition-colors disabled:opacity-60 shrink-0"
                    >
                      {submittingComment ? t("blogs.posting", { defaultValue: "Posting..." }) : t("blogs.postComment", { defaultValue: "Comment" })}
                    </button>
                  </form>

                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {activeBlog.comments && activeBlog.comments.length > 0 ? (
                      activeBlog.comments.map((comment: any) => (
                        <div key={comment.id} className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] text-xs space-y-1">
                          <div className="flex justify-between font-semibold text-[#1A1A1A]">
                            <span>{comment.user_name}</span>
                            <span className="text-[#57585A] font-normal">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[#57585A] mt-1 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#57585A] italic text-center py-4">
                        {t("blogs.noDiscussionsYet", { defaultValue: "No discussions yet. Be the first to share your thoughts!" })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal for Logged out users attempting to like/comment */}
      <AuthChooserDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        initialMode="login"
      />
    </div>
  );
}

// Helper to parse Markdown content and render styled JSX elements in blogs
export function renderMarkdown(content: string) {
  if (!content) return null;
  
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const parseInline = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    // We split by ** first for bold text
    const boldParts = text.split(/\*\*([^*]+)\*\*/g);
    return boldParts.flatMap((bPart, bIdx) => {
      if (bIdx % 2 === 1) {
        return [<strong key={`b-${bIdx}`} className="font-extrabold text-[#172263]">{bPart}</strong>];
      }
      // For non-bold parts, split by * or _ for italics
      const italicParts = bPart.split(/\*([^*]+)\*/g);
      return italicParts.flatMap((iPart, iIdx) => {
        if (iIdx % 2 === 1) {
          return [<em key={`i-${bIdx}-${iIdx}`} className="italic text-[#57585A] font-medium">{iPart}</em>];
        }
        // Also support _italic_ parsing
        const underParts = iPart.split(/_([^_]+)_/g);
        return underParts.map((uPart, uIdx) => {
          if (uIdx % 2 === 1) {
            return <em key={`u-${bIdx}-${iIdx}-${uIdx}`} className="italic text-[#57585A] font-medium">{uPart}</em>;
          }
          return uPart;
        });
      });
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Heading 1 (# Section)
    if (trimmed.startsWith('# ')) {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      const title = trimmed.replace(/^#\s+/, '');
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl md:text-2xl font-black text-[#172263] mt-8 mb-4 font-sora">
          {parseInline(title)}
        </h1>
      );
    }
    // Heading 2 (## Section)
    else if (trimmed.startsWith('## ')) {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      const title = trimmed.replace(/^##\s+/, '');
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg md:text-xl font-extrabold text-[#172263] mt-6 mb-3 font-sora">
          {parseInline(title)}
        </h2>
      );
    }
    // Heading 3 (### Sub-section)
    else if (trimmed.startsWith('### ')) {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      const title = trimmed.replace(/^###\s+/, '');
      elements.push(
        <h3 key={`h3-${index}`} className="text-base md:text-lg font-black text-[#D97706] mt-4 mb-2 font-sora">
          {parseInline(title)}
        </h3>
      );
    }
    // List item (- Item or * Item)
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      listItems.push(
        <li key={`li-${index}`} className="text-xs md:text-sm text-[#57585A] leading-relaxed">
          {parseInline(itemText)}
        </li>
      );
    }
    // Empty line
    else if (trimmed === '') {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
    }
    // Paragraph
    else {
      if (inList) {
        elements.push(<ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
        inList = false;
        listItems = [];
      }
      elements.push(
        <p key={`p-${index}`} className="text-xs md:text-sm text-[#57585A] leading-relaxed mb-3">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  if (inList) {
    elements.push(<ul key="list-final" className="list-disc pl-5 my-3 space-y-1.5">{listItems}</ul>);
  }

  return <div className="space-y-3">{elements}</div>;
}

// ===========================
// BLOG DETAIL
// ===========================
export function BlogDetail() {
  const { t } = useTranslation(["pages", "static"]);
  const { id } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBlog(data);
        }

        const relRes = await fetch(`/api/blogs?limit=4`);
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelatedBlogs(relData.filter((b: any) => String(b.id) !== id).slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!blog) return <EmptyState title={t("blogs.notFound", { defaultValue: "Blog not found" })} />;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <nav className="text-sm text-[#57585A] mb-6 flex items-center gap-2">
          <Link to="/blogs" className="hover:text-[#172263]">{t("blogs.title", { defaultValue: "Blogs" })}</Link>
          <ChevronRight size={14} />
          <span className="text-[#172263]">{t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}</span>
          <ChevronRight size={14} />
          <span className="truncate">{blog.title}</span>
        </nav>

        <div className="h-64 bg-zinc-100 rounded-2xl overflow-hidden mb-8 border border-[#E2E8F0] relative">
          <img
            src={blog.image_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">
            {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm text-[#57585A]">{t("blogs.authorFallback", { defaultValue: "Agri Team" })}</span>
          </div>
          <span className="text-sm text-[#57585A]">{blog.date}</span>
        </div>

        <h1
          className="text-4xl text-[#1A1A1A] mb-6 leading-tight"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          {blog.title}
        </h1>

        <div className="prose prose-sm max-w-none text-[#57585A] leading-relaxed space-y-4">
          <p className="font-semibold text-lg">{blog.short_description || blog.shortDescription}</p>
          <div className="w-full h-px bg-[#E2E8F0] my-4" />
          <div className="text-sm text-[#57585A] leading-relaxed">
            {blog.content ? renderMarkdown(blog.content) : t("blogs.loadingContent", { defaultValue: "Full article text is loading..." })}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#57585A] mb-3">{t("blogs.aboutAuthor", { defaultValue: "About the Author" })}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div>
              <p className="text-[#1A1A1A] text-sm" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {t("blogs.authorTeam", { defaultValue: "Tractor Seva Agri Team" })}
              </p>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                {t("blogs.authorRole", { defaultValue: "Agriculture Expert" })}
              </span>
            </div>
          </div>
        </div>

        {relatedBlogs.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl text-[#1A1A1A] mb-5" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
              {t("blogs.relatedArticles", { defaultValue: "Related Articles" })}
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedBlogs.map((b) => (
                <BlogCard key={b.id} {...b} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================
// PROFILE
// ===========================
export function Profile() {
  const { t } = useTranslation(["pages", "static"]);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [operatorProfile, setOperatorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "operator">("listings");

  const logout = () => {
    localStorage.removeItem("tractorsewa_token");
    localStorage.removeItem("tractorsewa_preview_mode");
    navigate("/");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const userRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!userRes.ok) return;
        const userData = await userRes.json();
        setUser(userData);

        if (userData.role === "admin") return;

        const opRes = await fetch(`/api/operators?userId=${userData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (opRes.ok) {
          const opData = await opRes.json();
          if (opData.length > 0) setOperatorProfile(opData[0]);
        }

        const harvsRes = await fetch(`/api/harvesters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (harvsRes.ok) {
          const harvsData = await harvsRes.json();
          setHarvesters(harvsData.filter((h: any) => h.ownerName === userData.name));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!user) return <EmptyState title={t("profile.notFound", { defaultValue: "Profile not found" })} />;

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1A1A1A]">
      <Navbar variant="auth" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#57585A] text-sm hover:text-[#172263] transition-colors group">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            {t("profile.backToDashboard", { defaultValue: "Back to Dashboard" })}
          </Link>
        </div>
        {/* Header Info Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 pb-8 border-b border-zinc-200">
          {/* Left: Avatar with modern rounded-2xl border and shadow */}
          <div className="relative shrink-0 select-none">
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-tr from-[#172263] via-[#E82326] to-amber-500 p-[3px] shadow-md">
              <div className="w-full h-full rounded-2xl bg-[#ffffff] p-[3px]">
                <div className="w-full h-full rounded-xl bg-[#F4F6FA] flex items-center justify-center overflow-hidden border border-zinc-200 shadow-inner group cursor-pointer hover:scale-[1.02] transition-transform duration-300">
                  {user.imagePath || operatorProfile?.image_path ? (
                    <img src={user.imagePath || operatorProfile.image_path} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#172263] text-3xl sm:text-5xl font-extrabold" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: User Information */}
          <div className="flex-1 flex flex-col items-center md:items-start w-full">
            {/* Username row */}
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif" }}>
                {user.name}
              </h2>
              <button
                onClick={() => navigate("/profile/edit")}
                className="p-1.5 text-zinc-400 hover:text-[#172263] hover:bg-zinc-100 rounded-full transition-colors"
                title="Edit Profile Settings"
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Stats Metric Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                onClick={() => setActiveTab("listings")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold select-none transition-all duration-200 ${activeTab === "listings"
                    ? "bg-[#172263] border-[#172263] text-white shadow-sm"
                    : "bg-[#F4F6FA] border-zinc-200 text-[#57585A] hover:bg-zinc-200/50"
                  }`}
              >
                <Tractor size={15} className={activeTab === "listings" ? "text-white" : "text-[#E82326]"} />
                <span><strong className={activeTab === "listings" ? "text-white" : "text-[#1A1A1A]"}>{user.stats?.harvesters || 0}</strong> {t("profile.harvesterListings", { defaultValue: "Harvesters" })}</span>
              </button>
              <button
                onClick={() => setActiveTab("operator")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-semibold select-none transition-all duration-200 ${activeTab === "operator"
                    ? "bg-[#172263] border-[#172263] text-white shadow-sm"
                    : "bg-[#F4F6FA] border-zinc-200 text-[#57585A] hover:bg-zinc-200/50"
                  }`}
              >
                <UserCheck size={15} className={activeTab === "operator" ? "text-white" : "text-[#172263]"} />
                <span><strong className={activeTab === "operator" ? "text-white" : "text-[#1A1A1A]"}>{user.stats?.operators || 0}</strong> {t("profile.operatorProfile", { defaultValue: "Operator Profile" })}</span>
              </button>
            </div>

            {/* Bio / Details */}
            <div className="space-y-1.5 w-full text-center md:text-left">
              <p className="text-sm text-[#57585A] font-semibold uppercase tracking-wider">{t("profile.communityMember", { defaultValue: "Tractor Seva Community Member" })}</p>

              <div className="flex flex-col gap-1 mt-2 text-sm text-[#57585A]">
                <p className="flex items-center justify-center md:justify-start gap-1.5">
                  <MapPin size={15} className="text-[#E82326]" /> {t("states." + (user.state || "Maharashtra"), { ns: "static", defaultValue: user.state || "Maharashtra" })}{user.state ? "" : ", India"}
                </p>
                <p className="flex items-center justify-center md:justify-start gap-1.5">
                  <Phone size={15} className="text-zinc-400" /> +91-{user.phone}
                </p>
                <p className="flex items-center justify-center md:justify-start gap-1.5">
                  <Mail size={15} className="text-zinc-400" /> {user.email}
                </p>
              </div>

              {/* Bio description */}
              <p className="text-sm text-[#57585A] max-w-md mt-3 leading-relaxed italic">
                "{user.bio || operatorProfile?.description || t("profile.bioFallback", { defaultValue: "Agriculture enthusiast. Verified operator/harvester member of the Tractor Seva network." })}"
              </p>

              {/* Mutual followed details */}
              <div className="flex items-center justify-center md:justify-start gap-2.5 mt-4 pt-3 border-t border-zinc-200">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#172263] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">TS</div>
                  <div className="w-6 h-6 rounded-full bg-[#E82326] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">IN</div>
                  <div className="w-6 h-6 rounded-full bg-zinc-300 border-2 border-white flex items-center justify-center text-[9px] font-bold text-zinc-700">AG</div>
                </div>
                <p className="text-xs text-zinc-500">
                  {t("profile.activeIn", { defaultValue: "Active in" })} <span className="font-semibold text-zinc-750">{t("states." + (user.state || "Maharashtra"), { ns: "static", defaultValue: user.state || "Maharashtra" })}</span> {t("profile.activeInSub", { defaultValue: "and surrounding agricultural hubs" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap gap-3 mt-6 w-full justify-center md:justify-start">
          <Link to="/profile/edit" className="flex-1 min-w-[120px]">
            <button className="w-full bg-[#F4F6FA] hover:bg-zinc-200/80 text-[#1A1A1A] text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors border border-zinc-200/80">
              {t("profile.editProfile", { defaultValue: "Edit Profile" })}
            </button>
          </Link>

          <div className="flex-1 min-w-[140px] relative group">
            <button className="w-full bg-[#172263] hover:bg-opacity-90 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1">
              {t("shared.addListing", { ns: "pages", defaultValue: "Add Listing" })} <ChevronDown size={14} />
            </button>
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#ffffff] border border-zinc-200 rounded-lg shadow-2xl py-1 z-30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link to="/add-harvester" className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-[#172263] transition-colors">
                {t("shared.addHarvester", { ns: "pages", defaultValue: "Add Harvester" })}
              </Link>
              <div className="h-px bg-zinc-200 my-1" />
              <Link to="/add-operator" className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-[#172263] transition-colors">
                {t("shared.addOperator", { ns: "pages", defaultValue: "Register Operator" })}
              </Link>
            </div>
          </div>

          <button
            onClick={logout}
            className="bg-[#E82326] hover:bg-opacity-90 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title={t("shared.logout", { ns: "pages", defaultValue: "Logout" })}
          >
            <LogOut size={16} /> <span>{t("shared.logout", { ns: "pages", defaultValue: "Logout" })}</span>
          </button>
        </div>

        {/* Quick Actions (Dashboard Action Tiles) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 mt-8 border-b border-zinc-200">
          {[
            { label: t("profile.operatorProfile", { defaultValue: "My Operator" }), desc: t("profile.myOperatorDesc", { defaultValue: "View operator details" }), icon: <UserCheck size={18} className="text-[#172263]" />, action: () => setActiveTab("operator") },
            { label: t("profile.harvesterListings", { defaultValue: "My Harvesters" }), desc: t("profile.myHarvestersDesc", { defaultValue: "View listed equipment" }), icon: <Tractor size={18} className="text-[#E82326]" />, action: () => setActiveTab("listings") },
            { label: t("shared.addOperator", { ns: "pages", defaultValue: "Add Operator" }), desc: t("profile.addOperatorDesc", { defaultValue: "List a new operator" }), icon: <Plus size={18} className="text-[#172263]" />, link: "/add-operator" },
            { label: t("messages.title", { ns: "pages", defaultValue: "Messages" }), desc: t("profile.messagesDesc", { defaultValue: "Chat with users" }), icon: <MessageSquare size={18} className="text-[#1A1A1A]" />, link: "/messages" },
          ].map((hl, i) => {
            const cardInner = (
              <div className="flex items-center gap-3 p-3.5 bg-[#F4F6FA] hover:bg-[#EAEFF8] rounded-xl border border-zinc-200/60 hover:border-[#172263]/30 transition-all duration-200 h-full group text-left">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                  {hl.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#1A1A1A] truncate">{hl.label}</h4>
                  <p className="text-xs text-zinc-500 truncate">{hl.desc}</p>
                </div>
              </div>
            );

            return hl.link ? (
              <Link key={i} to={hl.link} className="block h-full">
                {cardInner}
              </Link>
            ) : (
              <div key={i} onClick={hl.action} className="cursor-pointer h-full">
                {cardInner}
              </div>
            );
          })}
        </div>

        {/* Tab Selection (Segmented Control) */}
        <div className="flex justify-center mt-10 mb-6">
          <div className="bg-[#F4F6FA] p-1.5 rounded-xl border border-zinc-200/80 flex gap-1 select-none">
            <button
              onClick={() => setActiveTab("listings")}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "listings"
                  ? "bg-white text-[#172263] shadow-sm"
                  : "text-zinc-555 hover:text-[#1A1A1A]"
                }`}
            >
              <LayoutGrid size={15} />
              <span>{t("profile.myListings", { defaultValue: "Listings" })}</span>
            </button>
            <button
              onClick={() => setActiveTab("operator")}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "operator"
                  ? "bg-white text-[#172263] shadow-sm"
                  : "text-zinc-555 hover:text-[#1A1A1A]"
                }`}
            >
              <UserCheck size={15} />
              <span>{t("profile.operatorProfile", { defaultValue: "Operator Profile" })}</span>
            </button>
          </div>
        </div>

        {/* Grid Content */}
        {activeTab === "listings" && (
          <div>
            {harvesters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
                {harvesters.map((h) => (
                  <Link
                    key={h.id}
                    to={`/harvesters/${h.id}`}
                    className="bg-[#ffffff] border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col hover:-translate-y-0.5"
                  >
                    <div className="aspect-[4/3] w-full bg-[#F4F6FA] relative overflow-hidden border-b border-zinc-200">
                      {h.imagePath ? (
                        <img src={h.imagePath} alt={h.machineName} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tractor size={32} className="text-zinc-400 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-[#E82326]/10 text-[#E82326] border border-[#E82326]/20 rounded text-[9px] font-bold uppercase tracking-wider">
                          {t("companies." + h.company, { ns: "static", defaultValue: h.company })}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A] line-clamp-1 group-hover:text-[#172263] transition-colors">
                          {h.machineName}
                        </h4>
                        <p className="text-xs text-[#57585A] flex items-center gap-1.5 mt-1.5 font-medium">
                          <MapPin size={12} className="text-[#E82326]" /> {h.location}, {t("states." + h.state, { ns: "static", defaultValue: h.state })}
                        </p>
                      </div>
                      <div className="h-px bg-zinc-100 my-3.5" />
                      <div className="flex items-center justify-between text-[11px] text-[#57585A]">
                        <span>{t("exploreHarvesters.model", { defaultValue: "Model" })}: <strong className="text-zinc-700 font-semibold">{h.model || "N/A"}</strong></span>
                        <span>{t("addHarvester.purchaseYear", { defaultValue: "Year" })}: <strong className="text-zinc-700 font-semibold">{h.year || "N/A"}</strong></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl border border-zinc-200 bg-[#F4F6FA] flex items-center justify-center mb-4 text-zinc-400">
                  <Camera size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>{t("profile.noListingsYet", { defaultValue: "No Listings Yet" })}</h3>
                <p className="text-sm text-zinc-550 max-w-xs mb-6">{t("exploreHarvesters.noListingsDesc", { defaultValue: "List your harvester equipment so local farmers can browse and contact you." })}</p>
                <Link to="/add-harvester">
                  <button className="bg-[#172263] hover:bg-opacity-90 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm">
                    {t("exploreHarvesters.listYourMachine", { defaultValue: "List Your Harvester" })}
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "operator" && (
          <div>
            {operatorProfile ? (
              <div className="max-w-xl mx-auto mt-8 bg-[#ffffff] border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#172263] to-[#E82326] flex items-center justify-center font-bold text-white text-sm shadow-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A]">{user.name}</h4>
                      <p className="text-[10px] text-zinc-400">{operatorProfile.location || t("profile.noLocation", { defaultValue: "Location not specified" })}</p>
                    </div>
                  </div>
                  <AvailabilityBadge status={operatorProfile.availability || "Available"} />
                </div>

                <div className="space-y-4 text-sm text-[#57585A]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F4F6FA] p-3.5 rounded-xl border border-zinc-200/50">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1">{t("addOperator.experience", { defaultValue: "Experience" })}</span>
                      <span className="text-[#1A1A1A] font-bold text-base">{operatorProfile.experience} {t("profile.yearsUnit", { defaultValue: "Years" })}</span>
                    </div>
                    <div className="bg-[#F4F6FA] p-3.5 rounded-xl border border-zinc-200/50">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1">{t("addOperator.whatsappStat", { defaultValue: "WhatsApp Contact" })}</span>
                      <span className="text-[#1A1A1A] font-semibold text-sm">+91-{operatorProfile.whatsapp || user.phone}</span>
                    </div>
                  </div>

                  <div className="bg-[#F4F6FA] p-4 rounded-xl border border-zinc-200/50">
                    <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1.5">{t("exploreOperators.expertise", { defaultValue: "Machine Expertise" })}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {operatorProfile.machineExpertise && operatorProfile.machineExpertise.length > 0 ? (
                        operatorProfile.machineExpertise.map((m: string) => (
                          <span key={m} className="px-2.5 py-0.5 bg-[#ffffff] text-[#172263] border border-[#172263]/25 rounded-full text-xs font-semibold">
                            {t("machineTypes." + m, { ns: "static", defaultValue: m })}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-xs italic">{t("profile.noMachinesSelected", { defaultValue: "No machines selected" })}</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#F4F6FA] p-4 rounded-xl border border-zinc-200/50">
                    <span className="text-[10px] uppercase text-zinc-400 font-semibold tracking-wider block mb-1.5">{t("addOperator.bioStat", { defaultValue: "Description / About Me" })}</span>
                    <p className="text-xs text-zinc-650 leading-relaxed italic">
                      "{operatorProfile.description || t("profile.activeOperatorDesc", { defaultValue: "Active professional operator listed on Tractor Seva." })}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Link to="/profile/edit" className="flex-1">
                    <button className="w-full py-2.5 bg-[#F4F6FA] hover:bg-zinc-200/80 text-[#1A1A1A] text-xs font-semibold rounded-xl border border-zinc-200/80 transition-colors shadow-sm">
                      {t("profile.updateOperatorDetails", { defaultValue: "Update Operator Details" })}
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl border border-zinc-200 bg-[#F4F6FA] flex items-center justify-center mb-4 text-zinc-400">
                  <UserCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>{t("profile.becomeOperator", { defaultValue: "Become an Operator" })}</h3>
                <p className="text-sm text-zinc-550 max-w-xs mb-6">{t("profile.becomeOperatorDesc", { defaultValue: "Create your operator profile to specify your experience and machine skills so farmers can hire you." })}</p>
                <Link to="/add-operator">
                  <button className="bg-[#172263] hover:bg-opacity-90 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm">
                    {t("profile.registerOperatorProfile", { defaultValue: "Register Operator Profile" })}
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================
// MESSAGES
// ===========================
export function Messages() {
  const { t } = useTranslation(["pages", "static"]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");

  const [chatPartners, setChatPartners] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        
        let meData = null;
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          meData = await meRes.json();
          setCurrentUser(meData);
        }

        let partners = [];
        const partnersRes = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (partnersRes.ok) {
          partners = await partnersRes.json();
          setChatPartners(partners);
        }

        if (userIdParam && meData) {
          if (userIdParam === meData.id) {
            // User tried to message themselves (e.g. clicked Book Now on own listing)
            toast.error(t("messages.cannotMessageSelf", { defaultValue: "You cannot message yourself. This is your own listing." }));
            navigate("/dashboard", { replace: true });
            return;
          }
          const existingPartner = partners.find((p: any) => p.id === userIdParam);
          if (existingPartner) {
            setActive(existingPartner);
          } else {
            try {
              const partnerRes = await fetch(`/api/users/${userIdParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (partnerRes.ok) {
                const partnerData = await partnerRes.json();
                const newPartner = {
                  id: partnerData.id,
                  name: partnerData.name,
                  role: partnerData.role,
                  imagePath: partnerData.imagePath,
                  lastMessage: "",
                  lastMessageTime: null
                };
                setChatPartners((prev) => [newPartner, ...prev]);
                setActive(newPartner);
              } else {
                toast.error(t("messages.userNotFound", { defaultValue: "Could not find this user. They may no longer exist." }));
              }
            } catch (partnerErr) {
              console.error("Failed to load chat partner:", partnerErr);
              toast.error(t("messages.loadPartnerFailed", { defaultValue: "Failed to load chat partner. Please try again." }));
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [userIdParam]);

  useEffect(() => {
    if (!active) return;
    const fetchChat = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/messages?chatPartnerId=${active.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setChat(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchChat();

    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [active]);

  const sendMsg = async () => {
    if (!message.trim() || !active) return;
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: active.id,
          content: message
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChat((prev) => [...prev, newMsg]);
        setMessage("");

        setChatPartners((prevPartners) => {
          const exists = prevPartners.some(p => p.id === active.id);
          if (exists) {
            return prevPartners.map((p) => {
              if (p.id === active.id) {
                return { ...p, lastMessage: message, lastMessageTime: new Date().toISOString() };
              }
              return p;
            }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
          } else {
            return [{
              id: active.id,
              name: active.name,
              imagePath: active.imagePath,
              lastMessage: message,
              lastMessageTime: new Date().toISOString()
            }, ...prevPartners];
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return t("messages.yesterday", { defaultValue: "Yesterday" });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9]">
      <Navbar variant="auth" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-3xl border border-[#E7E0D5] overflow-hidden shadow-[0_4px_20px_rgba(23,34,99,0.04)] flex" style={{ height: "calc(100vh - 180px)", minHeight: "550px" }}>
          
          {/* Left conversations list */}
          <div className={`w-full md:w-80 border-r border-[#E7E0D5] flex flex-col flex-shrink-0 bg-white ${active ? "hidden md:flex" : "flex"}`}>
            {/* Header */}
            <div className="p-5 border-b border-[#E7E0D5]">
              <h1 className="text-xl font-extrabold text-[#172263] font-sora tracking-tight">{t("messages.title", { defaultValue: "Chats" })} 💬</h1>
            </div>
            
            {/* Conversations */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E7E0D5]/40">
              {loading ? (
                <div className="p-8 text-center text-sm text-[#57585A] flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#172263] border-t-transparent rounded-full animate-spin" />
                  {t("messages.loadingChats", { defaultValue: "Loading chats..." })}
                </div>
              ) : chatPartners.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#57585A] italic">
                  {t("messages.noConversations", { defaultValue: "No conversations yet. Open a machine or operator listing to message the owner!" })}
                </div>
              ) : (
                chatPartners.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActive(m)}
                    className={`w-full p-4 flex items-center gap-3 transition-all text-left ${
                      active?.id === m.id 
                        ? "bg-[#f5eee5] border-l-4 border-l-[#172263]" 
                        : "hover:bg-[#fcfbf9]"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-slate-100">
                      {m.imagePath ? (
                        <img src={m.imagePath} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-extrabold text-sm">{m.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-[#1A1A1A] font-extrabold font-sora truncate">{m.name}</p>
                        <span className="text-[10px] font-bold text-[#57585A]/80 shrink-0">{formatTime(m.lastMessageTime)}</span>
                      </div>
                      <p className="text-xs text-[#57585A] truncate">{m.lastMessage || t("messages.noMessages", { defaultValue: "No messages yet" })}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right chat window */}
          {active ? (
            <div className={`flex-1 flex flex-col bg-[#FAF9F6] ${active ? "flex" : "hidden md:flex"}`}>
              {/* Active Header */}
              <div className="p-4 border-b border-[#E7E0D5] bg-white flex items-center justify-between shadow-xs relative z-10">
                <div className="flex items-center gap-3">
                  <button className="md:hidden p-1 mr-1 text-[#57585A] hover:text-[#172263] hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setActive(null)}>
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-slate-100">
                    {active.imagePath ? (
                      <img src={active.imagePath} alt={active.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-extrabold text-sm">{active.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#1A1A1A] font-extrabold font-sora">{active.name}</p>
                    <p className="text-[10px] font-bold text-[#57585A] capitalize tracking-wide">
                      {active.role ? t("roles." + active.role.toLowerCase(), { ns: "static", defaultValue: active.role }) : t("roles.user", { ns: "static", defaultValue: "User" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chat.map((msg, i) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  const msgTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] relative pb-6 ${
                        isMe 
                          ? "bg-[#172263] text-white rounded-tr-none" 
                          : "bg-white border border-[#E7E0D5] text-[#1A1A1A] rounded-tl-none"
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span className={`absolute bottom-1 right-2.5 text-[9px] font-medium shrink-0 ${isMe ? "text-white/60" : "text-slate-400"}`}>
                          {msgTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Row */}
              <div className="p-4 border-t border-[#E7E0D5] bg-white flex gap-3 items-center">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                  placeholder={t("messages.typeMessage", { defaultValue: "Type a message..." })}
                  className="flex-1 px-4 py-3 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#172263] bg-[#fcfbf9] transition-all placeholder:text-[#57585A]/60"
                />
                <button 
                  onClick={sendMsg} 
                  disabled={!message.trim()}
                  className="w-11 h-11 bg-[#172263] hover:bg-[#11194A] text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:hover:bg-[#172263] shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#FAF9F6] text-[#57585A]">
              <div className="text-center max-w-sm px-6">
                <div className="w-16 h-16 bg-[#172263]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#172263]/10">
                  <MessageSquare size={32} className="text-[#172263]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora mb-2">{t("messages.yourMessages", { defaultValue: "Your Messages" })}</h3>
                <p className="text-xs text-[#57585A] leading-relaxed">
                  {t("messages.noMessagesSelect", { defaultValue: "Send private messages to machine owners and operators to negotiate prices, coordinates, and seasonal availability details." })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================
// EDIT PROFILE
// ===========================
export function EditProfile() {
  const { t } = useTranslation(["pages", "static"]);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState("");
  const [operatorProfile, setOperatorProfile] = useState<any>(null);
  const [location, setLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("Available");
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setState(data.state || "");
          setPhone(data.phone || "");
          setBio(data.bio || "");
          setImagePath(data.imagePath || "");
          setImagePreview(data.imagePath || "");

          if (data.role === "admin") {
            return; // Admin should not see edit profile page
          }

          // Always try to fetch operator profile if one exists
          const opRes = await fetch(`/api/operators?userId=${data.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (opRes.ok) {
            const opData = await opRes.json();
            if (opData.length > 0) {
              const op = opData[0];
              setOperatorProfile(op);
              setLocation(op.location || "");
              setWhatsapp(op.whatsapp || data.phone || "");
              setExperience(String(op.experience || "0"));
              setAvailability(op.availability || "Available");
              setSelectedMachines(op.machineExpertise || []);
              setDescription(op.description || "");
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPhone = phone.replace(/\D/g, "");
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      finalPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      finalPhone = cleanedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(finalPhone)) {
      toast.error(t("editProfile.errorPhone", { defaultValue: "Please enter a valid 10-digit phone number" }));
      return;
    }

    let finalWhatsapp = "";
    if (operatorProfile) {
      if (!whatsapp.trim()) {
        toast.error(t("editProfile.errorWhatsapp", { defaultValue: "Please enter your WhatsApp number" }));
        return;
      }
      const cleanedWhatsapp = whatsapp.replace(/\D/g, "");
      finalWhatsapp = cleanedWhatsapp;
      if (cleanedWhatsapp.length === 12 && cleanedWhatsapp.startsWith("91")) {
        finalWhatsapp = cleanedWhatsapp.substring(2);
      } else if (cleanedWhatsapp.length === 11 && cleanedWhatsapp.startsWith("0")) {
        finalWhatsapp = cleanedWhatsapp.substring(1);
      }

      if (!/^\d{10}$/.test(finalWhatsapp)) {
        toast.error(t("editProfile.errorWhatsappValid", { defaultValue: "Please enter a valid 10-digit WhatsApp number" }));
        return;
      }
    }

    setSaving(true);
    try {
      let finalImagePath = imagePath;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImagePath = uploadData.url;
        } else {
          toast.error(t("editProfile.errorUploadImage", { defaultValue: "Failed to upload profile image" }));
        }
      }

      const token = localStorage.getItem("tractorsewa_token");
      const body: any = { name, state, phone: finalPhone, bio, imagePath: finalImagePath };
      if (operatorProfile) {
        body.location = location;
        body.experience = parseInt(experience) || 0;
        body.machineExpertise = selectedMachines;
        body.availability = availability;
        body.description = description;
        body.whatsapp = finalWhatsapp;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        window.dispatchEvent(new Event('user-profile-updated'));
        toast.success(t("editProfile.successUpdate", { defaultValue: "Profile updated successfully!" }));
        navigate("/profile");
      } else {
        const data = await res.json();
        toast.error(data.error || t("editProfile.errorUpdate", { defaultValue: "Failed to update profile" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("editProfile.errorGeneric", { defaultValue: "Error updating profile" }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/profile" className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263]">
          <ArrowLeft size={16} /> {t("editProfile.backToProfile", { defaultValue: "Back to Profile" })}
        </Link>
        <PageHeader title={t("editProfile.title", { defaultValue: "Edit Profile" }) + " ✎"} />
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F0] p-8 space-y-5 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
          {/* Profile Picture Upload preview */}
          <div className="flex flex-col items-center gap-4 p-4 bg-[#F4F6FA] border border-zinc-200/60 rounded-2xl mb-6">
            <div className="relative w-24 h-24 rounded-2xl bg-white border border-zinc-200 shadow-sm overflow-hidden flex items-center justify-center group select-none">
              <Avatar className="w-full h-full rounded-2xl">
                {imagePreview ? <AvatarImage src={imagePreview} alt="Profile Preview" className="object-cover" /> : null}
                <AvatarFallback className="bg-white">
                  <User size={36} className="text-zinc-400" />
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="text-white" size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCropperImageSrc(URL.createObjectURL(file));
                      setCropperOpen(true);
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center">
              <span className="text-xs text-zinc-500 font-bold block">{t("editProfile.uploadAvatar", { defaultValue: "Upload Profile Image" })}</span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">{t("editProfile.uploadAvatarDesc", { defaultValue: "JPG, PNG, or WEBP up to 5MB" })}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">{t("editProfile.name", { defaultValue: "Full Name" })}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" />
          </div>
          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">{t("editProfile.phone", { defaultValue: "Phone" })}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" />
          </div>
          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">{t("editProfile.state", { defaultValue: "State" })}</label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setLocation("");
              }}
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
            >
              <option value="">{t("addOperator.statePlaceholder", { defaultValue: "Select State" })}</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[#57585A] block mb-1.5">{t("addOperator.bioStat", { defaultValue: "Bio / Description" })}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("editProfile.bioPlaceholder", { defaultValue: "Tell us about yourself..." })}
              rows={3}
              className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none"
            />
          </div>

          {operatorProfile && (
            <div>
              <label className="text-sm text-[#57585A] block mb-1.5">{t("editProfile.district", { defaultValue: "District / City *" })}</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={!state}
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] disabled:opacity-50"
              >
                <option value="">{t("addOperator.districtPlaceholder", { defaultValue: "Select District" })}</option>
                {state &&
                  districtsData.states
                    .find((s) => s.state === state)
                    ?.districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
              </select>
            </div>
          )}

          {operatorProfile && (
            <>
              <div className="h-px bg-[#E2E8F0] my-6" />
              <h3 className="text-[#1A1A1A] text-base font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                {t("profile.operatorProfile", { defaultValue: "Operator Profile" })} {t("addOperator.locationDetails", { defaultValue: "Details" })}
              </h3>

              <div>
                <label className="text-sm text-[#57585A] block mb-1.5">{t("addOperator.whatsappStat", { defaultValue: "WhatsApp Number" })}</label>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" />
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-1.5">{t("addOperator.experience", { defaultValue: "Experience (Years)" })}</label>
                <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} required className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]" />
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-1.5">{t("exploreOperators.statusStat", { defaultValue: "Availability Status" })}</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                >
                  <option value="Available">{t("status.available", { ns: "static", defaultValue: "Available" })}</option>
                  <option value="Busy">{t("status.busy", { ns: "static", defaultValue: "Busy" })}</option>
                  <option value="Not Available">{t("status.notAvailable", { ns: "static", defaultValue: "Not Available" })}</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-2">{t("exploreOperators.expertise", { defaultValue: "Machine Expertise" })}</label>
                <div className="grid grid-cols-2 gap-2">
                  {MACHINE_TYPES.map((m) => {
                    const isChecked = selectedMachines.includes(m);
                    return (
                      <label key={m} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors text-xs ${isChecked ? "border-[#172263] bg-blue-50 text-[#172263]" : "border-[#E2E8F0] bg-white text-[#57585A] hover:border-blue-200"
                        }`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedMachines((prev) =>
                              prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
                            );
                          }}
                          className="hidden"
                        />
                        {t("machineTypes." + m, { ns: "static", defaultValue: m })}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#57585A] block mb-1.5">{t("addOperator.bioStat", { defaultValue: "Operator Description" })}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none" />
              </div>
            </>
          )}

          <button type="submit" disabled={saving} className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t("editProfile.save", { defaultValue: "Save Changes" })}
          </button>
        </form>
      </div>
      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperImageSrc}
        aspect={1}
        onCropCompleteAction={async (croppedUrl) => {
          setImagePreview(croppedUrl);
          const res = await fetch(croppedUrl);
          const blob = await res.blob();
          const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
          setImageFile(file);
        }}
      />
    </div>
  );
}

// ===========================
// ADMIN CONTROL PORTAL
// ===========================
export function AdminPortal() {
  const { t } = useTranslation(["pages", "static"]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalOperators: 0, totalHarvesters: 0, totalRequests: 0, blockedUsers: 0, loginHistory: [], performers: [] });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [performerFilter, setPerformerFilter] = useState("highest_machine");
  const [adminRequestsTab, setAdminRequestsTab] = useState<"pending" | "processed">("pending");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Users listing states
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Moderator listings
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [adminBlogs, setAdminBlogs] = useState<any[]>([]);
  const [adminOperators, setAdminOperators] = useState<any[]>([]);
  const [adminFaqs, setAdminFaqs] = useState<any[]>([]);
  const [answeringFaqId, setAnsweringFaqId] = useState<string | null>(null);
  const [faqAnswerText, setFaqAnswerText] = useState("");

  // Detailed Listing Viewer States
  const [selectedListingDetail, setSelectedListingDetail] = useState<any | null>(null);
  const [selectedListingType, setSelectedListingType] = useState<'harvester' | 'operator' | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Blog Comments Moderation States
  const [activeBlogForComments, setActiveBlogForComments] = useState<any | null>(null);
  const [selectedBlogComments, setSelectedBlogComments] = useState<any[]>([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Blog Article Preview States
  const [activeBlogPreview, setActiveBlogPreview] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Selected Chart Point State
  const [selectedChartPoint, setSelectedChartPoint] = useState<any | null>(null);

  // Admin blogs editing states
  const [categories, setCategories] = useState<string[]>(["Harvesting Tips", "Machine Maintenance", "Success Stories", "Agri News", "Weather & Season"]);
  const [customCategory, setCustomCategory] = useState("");
  const [aiCustomCategory, setAiCustomCategory] = useState("");
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogCategory, setBlogCategory] = useState("Machine Maintenance");
  const [blogShortDesc, setBlogShortDesc] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogDate, setBlogDate] = useState("");
  const [blogImageUrl, setBlogImageUrl] = useState("");
  const [blogImageFile, setBlogImageFile] = useState<File | null>(null);
  const [blogImagePreview, setBlogImagePreview] = useState("");
  const [savingBlog, setSavingBlog] = useState(false);
  const [adminBlogsSearch, setAdminBlogsSearch] = useState("");
  
  // AI blog generator states
  const [showAiBlogForm, setShowAiBlogForm] = useState(false);
  const [aiPromptTitle, setAiPromptTitle] = useState("");
  const [aiPromptKeywords, setAiPromptKeywords] = useState("");
  const [aiPromptCategory, setAiPromptCategory] = useState("Machine Maintenance");
  const [generatingBlog, setGeneratingBlog] = useState(false);

  // Confirmation modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'block' | 'unblock' | 'wipe' | 'deleteHarv' | 'deleteReq' | 'deleteBlog' | 'deleteOp'>('block');
  const [confirmTargetId, setConfirmTargetId] = useState("");
  const [confirmTargetName, setConfirmTargetName] = useState("");

  const token = localStorage.getItem("tractorsewa_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          localStorage.removeItem("tractorsewa_token");
          navigate("/login");
          return;
        }
        const data = await res.json();
        if (data.role !== "admin") {
          toast.error("Unauthorized access. Admin privileges required.");
          navigate("/dashboard");
          return;
        }
        setCurrentUser(data);
        refreshAllData();
      } catch (err) {
        console.error(err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [token]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/blogs/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleCategoryChange = async (value: string, type: 'standard' | 'ai') => {
    if (value === "Add New Category...") {
      const newCat = window.prompt("Enter new category name:");
      if (newCat && newCat.trim() !== "") {
        const cleanName = newCat.trim();
        try {
          const res = await fetch("/api/admin/blogs/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: cleanName })
          });
          if (res.ok) {
            toast.success(`Category "${cleanName}" added successfully.`);
            await fetchCategories();
            if (type === 'standard') {
              setBlogCategory(cleanName);
            } else {
              setAiPromptCategory(cleanName);
            }
          } else {
            const err = await res.json();
            toast.error(err.error || "Failed to add category.");
            if (type === 'standard') {
              setBlogCategory(categories[0] || "Machine Maintenance");
            } else {
              setAiPromptCategory(categories[0] || "Machine Maintenance");
            }
          }
        } catch (err) {
          console.error(err);
          toast.error("Error adding category.");
          if (type === 'standard') {
            setBlogCategory(categories[0] || "Machine Maintenance");
          } else {
            setAiPromptCategory(categories[0] || "Machine Maintenance");
          }
        }
      } else {
        if (type === 'standard') {
          setBlogCategory(categories[0] || "Machine Maintenance");
        } else {
          setAiPromptCategory(categories[0] || "Machine Maintenance");
        }
      }
    } else {
      if (type === 'standard') {
        setBlogCategory(value);
        if (value !== "Other") {
          setCustomCategory("");
        }
      } else {
        setAiPromptCategory(value);
        if (value !== "Other") {
          setAiCustomCategory("");
        }
      }
    }
  };

  const refreshAllData = () => {
    fetchCategories();
    fetchStats();
    fetchAllUsers();
    fetchHarvesters();
    fetchRequests();
    fetchEnquiries();
    fetchAdminBlogs();
    fetchAdminOperators();
    fetchAdminFaqs();
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHarvesters = async () => {
    try {
      const res = await fetch("/api/harvesters");
      if (res.ok) {
        const data = await res.json();
        setHarvesters(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEnquiries = async () => {
    try {
      const res = await fetch("/api/admin/enquiries", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      if (res.ok) {
        const data = await res.json();
        setAdminBlogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminOperators = async () => {
    try {
      const res = await fetch("/api/operators");
      if (res.ok) {
        const data = await res.json();
        setAdminOperators(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminFaqs = async () => {
    try {
      const res = await fetch("/api/admin/faqs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminFaqs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Request status updated to ${newStatus} successfully.`);
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update request status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating request status.");
    }
  };

  const handleAnswerFaqSubmit = async (faqId: string) => {
    if (!faqAnswerText.trim()) {
      toast.error("Please enter an answer.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/faqs/${faqId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ answer: faqAnswerText.trim(), status: 'Answered' })
      });

      if (res.ok) {
        toast.success("Question answered successfully!");
        setAnsweringFaqId(null);
        setFaqAnswerText("");
        fetchAdminFaqs();
      } else {
        toast.error("Failed to submit answer.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error answering question.");
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    try {
      const res = await fetch(`/api/admin/faqs/${faqId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("FAQ deleted successfully.");
        fetchAdminFaqs();
      } else {
        toast.error("Failed to delete FAQ.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting FAQ.");
    }
  };

  const openListingDetail = (type: 'harvester' | 'operator', listing: any) => {
    setSelectedListingType(type);
    setSelectedListingDetail(listing);
    setShowDetailModal(true);
  };

  const openBlogComments = async (blog: any) => {
    setActiveBlogForComments(blog);
    setShowCommentsModal(true);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/blogs/${blog.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBlogComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.failedLoadComments", { defaultValue: "Failed to load comments." }));
    } finally {
      setLoadingComments(false);
    }
  };

  const deleteBlogComment = async (commentId: number) => {
    try {
      const res = await fetch(`/api/admin/blogs/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t("admin.commentDeleted", { defaultValue: "Comment deleted successfully." }));
        setSelectedBlogComments(prev => prev.filter(c => c.id !== commentId));
        fetchAdminBlogs();
      } else {
        toast.error(t("admin.failedDeleteComment", { defaultValue: "Failed to delete comment" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.errorDeleteComment", { defaultValue: "Error deleting comment" }));
    }
  };

  const openBlogPreview = (blog: any) => {
    setActiveBlogPreview(blog);
    setShowPreviewModal(true);
  };

  const startEditBlog = (blog: any) => {
    setEditingBlog(blog);
    setBlogTitle(blog.title || "");
    const isStandardCat = categories.includes(blog.category);
    if (isStandardCat) {
      setBlogCategory(blog.category || "Machine Maintenance");
      setCustomCategory("");
    } else {
      setBlogCategory("Other");
      setCustomCategory(blog.category || "");
    }
    setBlogShortDesc(blog.short_description || "");
    setBlogContent(blog.content || "");
    setBlogDate(blog.date || "");
    setBlogImageUrl(blog.image_url || "");
    setBlogImageFile(null);
    setBlogImagePreview(blog.image_url || "");
    setShowBlogForm(true);
  };

  const startCreateBlog = () => {
    setEditingBlog(null);
    setBlogTitle("");
    setBlogCategory(categories[0] || "Machine Maintenance");
    setCustomCategory("");
    setBlogShortDesc("");
    setBlogContent("");
    setBlogDate("");
    setBlogImageUrl("");
    setBlogImageFile(null);
    setBlogImagePreview("");
    setShowBlogForm(true);
  };

  const startAiGenerateBlog = () => {
    setAiPromptTitle("");
    setAiPromptKeywords("");
    setAiPromptCategory(categories[0] || "Machine Maintenance");
    setAiCustomCategory("");
    setShowAiBlogForm(true);
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptTitle.trim()) {
      toast.error("Please enter a title or topic.");
      return;
    }

    const categoryToSend = aiPromptCategory === "Other" ? aiCustomCategory.trim() : aiPromptCategory.trim();
    if (!categoryToSend) {
      toast.error("Please specify a category.");
      return;
    }

    setGeneratingBlog(true);
    try {
      const res = await fetch("/api/admin/blogs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: aiPromptTitle.trim(),
          keywords: aiPromptKeywords.trim(),
          category: categoryToSend
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Prefill the standard blog form with the AI generated content
        setEditingBlog(null);
        setBlogTitle(data.title || aiPromptTitle.trim());
        
        const returnedCategory = data.category || categoryToSend;
        const isStandardCat = categories.includes(returnedCategory);
        if (isStandardCat) {
          setBlogCategory(returnedCategory);
          setCustomCategory("");
        } else {
          setBlogCategory("Other");
          setCustomCategory(returnedCategory);
        }

        setBlogShortDesc(data.short_description || "");
        setBlogContent(data.content || "");
        setBlogDate("");
        setBlogImageUrl(data.image_url || "");
        setBlogImageFile(null);
        setBlogImagePreview(data.image_url || "");
        
        // Switch modals
        setShowAiBlogForm(false);
        setShowBlogForm(true);
        toast.success("Blog content generated successfully! Please review and save.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate blog content.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to generator service.");
    } finally {
      setGeneratingBlog(false);
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryToSend = blogCategory === "Other" ? customCategory.trim() : blogCategory.trim();

    if (!blogTitle.trim() || !categoryToSend || !blogShortDesc.trim() || !blogContent.trim()) {
      toast.error(t("admin.fillRequiredFields", { defaultValue: "Please fill in all required fields." }));
      return;
    }

    setSavingBlog(true);
    try {
      let uploadedUrl = blogImageUrl;
      if (blogImageFile) {
        const formData = new FormData();
        formData.append("image", blogImageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.url;
        } else {
          let errorMsg = "Failed to upload blog image.";
          try {
            const errData = await uploadRes.json();
            if (errData && errData.error) {
              errorMsg = errData.error;
            }
          } catch (_) {}
          toast.error(errorMsg);
          setSavingBlog(false);
          return;
        }
      }

      const blogData = {
        title: blogTitle.trim(),
        category: categoryToSend,
        short_description: blogShortDesc.trim(),
        content: blogContent.trim(),
        date: blogDate.trim() || undefined,
        image_url: uploadedUrl
      };

      const url = editingBlog ? `/api/admin/blogs/${editingBlog.id}` : "/api/admin/blogs";
      const method = editingBlog ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(blogData)
      });

      if (res.ok) {
        toast.success(editingBlog ? t("admin.blogUpdated", { defaultValue: "Blog updated successfully!" }) : t("admin.blogCreated", { defaultValue: "Blog created successfully!" }));
        setShowBlogForm(false);
        setEditingBlog(null);
        setBlogTitle("");
        setBlogCategory(categories[0] || "Machine Maintenance");
        setCustomCategory("");
        setBlogShortDesc("");
        setBlogContent("");
        setBlogDate("");
        setBlogImageUrl("");
        setBlogImageFile(null);
        setBlogImagePreview("");
        refreshAllData();
      } else {
        const err = await res.json();
        toast.error(err.error || t("admin.failedSaveBlog", { defaultValue: "Failed to save blog post" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.errorSaveBlog", { defaultValue: "Error saving blog post" }));
    } finally {
      setSavingBlog(false);
    }
  };

  const executeAction = async () => {
    setConfirmOpen(false);
    if (!confirmTargetId) return;

    try {
      if (confirmType === 'block') {
        const res = await fetch(`/api/admin/users/${confirmTargetId}/block`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ block: true })
        });
        if (res.ok) {
          toast.success(t("admin.userBlocked", { defaultValue: "User blocked successfully!" }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedBlock", { defaultValue: "Failed to block user" }));
        }
      } else if (confirmType === 'unblock') {
        const res = await fetch(`/api/admin/users/${confirmTargetId}/block`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ block: false })
        });
        if (res.ok) {
          toast.success(t("admin.userUnblocked", { defaultValue: "User unblocked successfully!" }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedUnblock", { defaultValue: "Failed to unblock user" }));
        }
      } else if (confirmType === 'wipe') {
        const res = await fetch(`/api/admin/users/${confirmTargetId}/data`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.userWiped", { defaultValue: "Cleared entire user posts/data and blocked user successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedWipe", { defaultValue: "Failed to wipe user data" }));
        }
      } else if (confirmType === 'deleteHarv') {
        const res = await fetch(`/api/admin/harvesters/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.harvesterDeleted", { defaultValue: "Harvester listing deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteHarvester", { defaultValue: "Failed to delete machine listing" }));
        }
      } else if (confirmType === 'deleteReq') {
        const res = await fetch(`/api/admin/requests/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.requestDeleted", { defaultValue: "Crop requirement deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteRequest", { defaultValue: "Failed to delete crop request" }));
        }
      } else if (confirmType === 'deleteBlog') {
        const res = await fetch(`/api/admin/blogs/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.blogDeleted", { defaultValue: "Blog post deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteBlog", { defaultValue: "Failed to delete blog post" }));
        }
      } else if (confirmType === 'deleteOp') {
        const res = await fetch(`/api/admin/operators/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.operatorDeleted", { defaultValue: "Operator listing deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteOperator", { defaultValue: "Failed to delete operator profile" }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.errorGenericOperation", { defaultValue: "Error executing administrative operation" }));
    }
  };

  const openConfirmModal = (type: 'block' | 'unblock' | 'wipe' | 'deleteHarv' | 'deleteReq' | 'deleteBlog', id: string, name: string) => {
    setConfirmType(type);
    setConfirmTargetId(id);
    setConfirmTargetName(name);
    setConfirmOpen(true);
  };

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.phone && u.phone.includes(userSearchTerm))
  );

  const pendingEnquiriesCount = enquiries.filter((enq: any) => enq.status === 'Active' || enq.status === 'Pending' || !enq.status).length;

  // Performers sorting
  const sortedPerformers = [...(stats.performers || [])].sort((a: any, b: any) => {
    if (performerFilter === "highest_machine") {
      return b.harvesterCount - a.harvesterCount;
    } else if (performerFilter === "rating") {
      return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
    } else if (performerFilter === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (performerFilter === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  // Calculate login logs SVG coordinates
  const maxLogins = Math.max(...(stats.loginHistory || []).map((h: any) => h.count), 1);
  const chartWidth = 550;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const points = (stats.loginHistory || []).map((h: any, idx: number) => {
    const x = paddingLeft + (idx * (chartWidth - paddingLeft - paddingRight)) / 6;
    const y = chartHeight - paddingBottom - (h.count / maxLogins) * (chartHeight - paddingTop - paddingBottom);
    return { x, y, displayDate: h.displayDate, count: h.count };
  });
  
  const linePath = points.length > 0 
    ? "M " + points.map(p => `${p.x} ${p.y}`).join(" L ")
    : "";
    
  const areaPath = points.length > 0
    ? linePath + ` L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : "";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-screen w-full bg-white font-sans overflow-hidden">
      <div className="w-full h-full flex flex-col md:flex-row">
        <div className={`bg-[#f5eee5] border-r border-[#e8dfd2] flex flex-col justify-between shrink-0 transition-all duration-300 h-full ${isSidebarOpen ? 'w-full md:w-[280px] p-5 lg:p-6' : 'w-0 md:w-[88px] p-4 md:py-6 md:px-4'}`}>
          <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden">
            {/* Logo */}
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between gap-3' : 'justify-center'} w-full shrink-0`}>
              {isSidebarOpen && (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-2 bg-[#172263] rounded-xl text-white flex items-center justify-center shrink-0">
                    <Tractor size={24} />
                  </div>
                  <span className="text-lg lg:text-xl font-black text-[#172263] tracking-tight font-sora whitespace-nowrap">Tractor Seva</span>
                </div>
              )}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 lg:p-2 text-[#172263] hover:bg-[#e8dfd2] rounded-xl transition flex items-center justify-center shrink-0"
                title={t("admin.toggleSidebar", { defaultValue: "Toggle Sidebar" })}
              >
                <Menu size={22} />
              </button>
            </div>
            
            {/* Profile info */}
            <div className="flex flex-col items-center text-center py-4 border-b border-[#e8dfd2]/60 shrink-0">
              <div className={`${isSidebarOpen ? 'w-20 h-20' : 'w-12 h-12'} rounded-full p-0.5 shadow-md mb-3 transition-all duration-300 shrink-0`}>
                <Avatar className="w-full h-full rounded-full border-2 border-transparent bg-gradient-to-br from-[#172263] to-[#D97706] bg-clip-border">
                  {currentUser?.image_path ? <AvatarImage src={currentUser.image_path} alt={currentUser.name} /> : null}
                  <AvatarFallback className="bg-[#f5eee5] text-[#172263] font-bold h-full w-full flex items-center justify-center">
                    <span className={`${isSidebarOpen ? 'text-xl' : 'text-sm'} transition-all`}>{currentUser?.name?.charAt(0) || 'A'}</span>
                  </AvatarFallback>
                </Avatar>
              </div>
              {isSidebarOpen && (
                <div className="transition-all animate-in fade-in duration-300">
                  <h4 className="text-[#1A1A1A] font-bold text-base font-sora whitespace-nowrap">{currentUser?.name || "Om"}</h4>
                  <span className="text-xs text-[#57585A] font-semibold uppercase tracking-wider mt-0.5 whitespace-nowrap">{t("admin.role", { defaultValue: "Admin" })}</span>
                </div>
              )}
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {[
                { id: "dashboard", label: t("admin.nav.dashboard", { defaultValue: "Dashboard" }), icon: <LayoutGrid size={18} /> },
                { id: "directory", label: t("admin.nav.directory", { defaultValue: "User Directory" }), icon: <User size={18} /> },
                { id: "harvesters", label: t("admin.nav.machines", { defaultValue: "Machines" }), icon: <Tractor size={18} /> },
                { id: "operators", label: t("admin.nav.operators", { defaultValue: "Operators" }), icon: <UserCheck size={18} /> },
                { id: "requests", label: t("admin.nav.requests", { defaultValue: "Requests" }), icon: <FileText size={18} /> },
                { id: "enquiries", label: t("admin.nav.enquiries", { defaultValue: "Enquiries" }), icon: <MessageSquare size={18} /> },
                { id: "blogs", label: t("admin.nav.blogs", { defaultValue: "Blogs Management" }), icon: <BookOpen size={18} /> },
                { id: "faqs", label: "FAQ Management", icon: <HelpCircle size={18} /> }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0 relative'} py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === item.id 
                      ? "bg-[#172263] text-white shadow-sm" 
                      : "text-[#57585A] hover:bg-[#e8dfd2]/40 hover:text-[#172263]"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  {item.id === "dashboard" && isSidebarOpen && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  )}
                  {item.id === "dashboard" && !isSidebarOpen && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Logout */}
          <button 
            onClick={() => {
              localStorage.removeItem("tractorsewa_token");
              localStorage.removeItem("tractorsewa_user_role");
              localStorage.removeItem("tractorsewa_preview_mode");
              navigate("/login");
            }}
            title={!isSidebarOpen ? t("shared.logout", { ns: "pages", defaultValue: "Log Out" }) : undefined}
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition mt-4`}
          >
            <span className="shrink-0"><LogOut size={18} /></span>
            {isSidebarOpen && <span className="whitespace-nowrap">{t("shared.logout", { ns: "pages", defaultValue: "Log Out" })}</span>}
          </button>
        </div>
        
        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto">
          
          {/* ================================== */}
          {/* TAB: DASHBOARD (MAIN OVERVIEW)     */}
          {/* ================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#1A1A1A] font-sora">{t("admin.nav.dashboard", { defaultValue: "Dashboard" })}</h1>
                  <p className="text-[#57585A] text-sm mt-1">{t("admin.analyticsHighlight", { defaultValue: "Platform analytics and administrative directory highlights." })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("enquiries")}
                    className="p-2.5 text-[#57585A] hover:text-[#172263] hover:bg-zinc-100 rounded-full transition relative"
                    title={t("admin.viewEnquiries", { defaultValue: "View Enquiries" })}
                  >
                    <Bell size={20} />
                    {pendingEnquiriesCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {pendingEnquiriesCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Metrics & Doughnut Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left stats: 3 quick metric cards */}
                <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Users", value: stats.totalUsers, desc: "Registered accounts", color: "text-[#172263]" },
                    { label: "Total Posts", value: stats.totalHarvesters + stats.totalOperators + stats.totalRequests, desc: "System wide entries", color: "text-[#D97706]" },
                    { label: "Active Enquiries", value: pendingEnquiriesCount, desc: "Pending resolution", color: "text-green-600" }
                  ].map((m, idx) => (
                    <div key={idx} className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                      <span className="text-[#57585A] text-xs font-bold uppercase tracking-wider">{m.label}</span>
                      <span className={`text-4xl font-extrabold my-3 font-sora ${m.color}`}>{m.value}</span>
                      <span className="text-[11px] text-[#57585A] font-medium">{m.desc}</span>
                    </div>
                  ))}
                </div>
                
                {/* Right doughnut: Platform Distribution */}
                <div className="bg-[#fcfbf9] border border-[#e8dfd2] rounded-3xl p-6 relative flex items-center justify-between shadow-sm overflow-hidden">
                  <div className="space-y-4 z-10">
                    <h4 className="text-sm font-extrabold text-[#1A1A1A] font-sora">Database Overview</h4>
                    <div className="space-y-1.5 text-xs text-[#57585A] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#172263]" />
                        Harvesters: {stats.totalHarvesters}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                        Operators: {stats.totalOperators}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                        Requests: {stats.totalRequests}
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab("harvesters")}
                      className="px-4 py-2 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl shadow-sm transition"
                    >
                      View Listings
                    </button>
                  </div>
                  
                  {/* Concentric Circular Doughnut Graph */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="64" cy="64" r="48" 
                        stroke="#E2E8F0" strokeWidth="6" fill="none"
                      />
                      <circle 
                        cx="64" cy="64" r="48" 
                        stroke="#172263" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 48}`}
                        strokeDashoffset={`${2 * Math.PI * 48 * (1 - (stats.totalHarvesters / Math.max(stats.totalHarvesters + stats.totalOperators + stats.totalRequests, 1)))}`}
                        strokeLinecap="round"
                      />
                      
                      <circle 
                        cx="64" cy="64" r="38" 
                        stroke="#E2E8F0" strokeWidth="6" fill="none"
                      />
                      <circle 
                        cx="64" cy="64" r="38" 
                        stroke="#D97706" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={`${2 * Math.PI * 38 * (1 - (stats.totalOperators / Math.max(stats.totalHarvesters + stats.totalOperators + stats.totalRequests, 1)))}`}
                        strokeLinecap="round"
                      />
                      
                      <circle 
                        cx="64" cy="64" r="28" 
                        stroke="#E2E8F0" strokeWidth="6" fill="none"
                      />
                      <circle 
                        cx="64" cy="64" r="28" 
                        stroke="#64748B" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - (stats.totalRequests / Math.max(stats.totalHarvesters + stats.totalOperators + stats.totalRequests, 1)))}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black text-[#57585A]">TOTAL</span>
                      <span className="text-base font-black text-[#1A1A1A] font-sora">
                        {stats.totalHarvesters + stats.totalOperators + stats.totalRequests}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Daily Logins Activity & Performers Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: SVG Daily Logins Curved Line Chart */}
                <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[#1A1A1A] font-bold text-lg font-sora">Activity</h3>
                      <span className="text-xs text-[#57585A]">Daily active users logging in</span>
                    </div>
                    <div className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] font-bold bg-[#fcfbf9]">
                      Last 7 Days
                    </div>
                  </div>

                  {selectedChartPoint ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-[#172263] text-xs font-bold rounded-2xl flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📊</span>
                        <span>
                          Active Users on <strong>{selectedChartPoint.displayDate}</strong>: <strong>{selectedChartPoint.count} users</strong>
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedChartPoint(null)} 
                        className="text-[#172263]/60 hover:text-[#172263] text-[10px] uppercase font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#57585A]/70 font-semibold italic">
                      💡 Click on any point/dot in the graph to view detailed active user metrics.
                    </div>
                  )}
                  
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[550px] h-[200px] relative">
                      <svg className="w-full h-full" viewBox="0 0 550 180">
                        <defs>
                          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D97706" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                          <line 
                            key={i} 
                            x1="40" y1={20 + r * 140} x2="520" y2={20 + r * 140} 
                            stroke="#F1F5F9" strokeWidth="1" 
                            strokeDasharray="4"
                          />
                        ))}
                        
                        {/* Area Fill Under Path */}
                        {areaPath && (
                          <path d={areaPath} fill="url(#chart-grad)" />
                        )}
                        
                        {/* Line Path */}
                        {linePath && (
                          <path 
                            d={linePath} 
                            fill="none" 
                            stroke="#D97706" 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        
                        {/* Points & Labels */}
                        {points.map((p, idx) => (
                          <g 
                            key={idx} 
                            className="group cursor-pointer"
                            onClick={() => {
                              setSelectedChartPoint(p);
                              toast(`Active Users: ${p.count} on ${p.displayDate}`, { icon: "📊" });
                            }}
                          >
                            <circle 
                              cx={p.x} cy={p.y} r="5" 
                              fill={selectedChartPoint?.displayDate === p.displayDate ? "#172263" : "#ffffff"} 
                              stroke="#D97706" 
                              strokeWidth="3.5"
                            />
                            <circle 
                              cx={p.x} cy={p.y} r="9" 
                              fill="#D97706" 
                              fillOpacity="0.15"
                              className={`group-hover:opacity-100 transition-opacity ${selectedChartPoint?.displayDate === p.displayDate ? "opacity-100" : "opacity-0"}`}
                            />
                            <rect 
                              x={p.x - 24} y={p.y - 30} width="48" height="20" rx="6" 
                              fill="#172263" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            />
                            <text 
                              x={p.x} y={p.y - 17} 
                              fill="#ffffff" 
                              fontSize="10" 
                              fontWeight="bold"
                              textAnchor="middle" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-sora"
                            >
                              {p.count}
                            </text>
                            
                            <text 
                              x={p.x} y="172" 
                              fill="#57585A" 
                              fontSize="10" 
                              fontWeight="bold"
                              textAnchor="middle"
                              className="font-sans"
                            >
                              {p.displayDate}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Right side: Top Performers Widget */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#1A1A1A] font-bold text-lg font-sora">Top Performers</h3>
                      <select
                        value={performerFilter}
                        onChange={(e) => setPerformerFilter(e.target.value)}
                        className="px-2.5 py-1 border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] font-bold bg-[#fcfbf9] focus:outline-none"
                      >
                        <option value="highest_machine">Highest Machines</option>
                        <option value="rating">Best Rating</option>
                        <option value="newest">Newest Accounts</option>
                        <option value="oldest">Oldest Accounts</option>
                      </select>
                    </div>
                    
                    <div className="space-y-4">
                      {sortedPerformers.slice(0, 3).map((perf: any) => (
                        <div key={perf.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#172263] to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                              {perf.imagePath ? (
                                <img src={perf.imagePath} alt={perf.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{perf.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-[#1A1A1A] font-sora line-clamp-1">{perf.name}</h4>
                              <span className="text-[10px] text-[#57585A] font-medium line-clamp-1">@{perf.email.split('@')[0]}</span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            {performerFilter === "highest_machine" && (
                              <span className="text-xs font-black text-[#172263] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                {perf.harvesterCount} Machine{perf.harvesterCount === 1 ? '' : 's'}
                              </span>
                            )}
                            {performerFilter === "rating" && (
                              <span className="text-xs font-black text-[#D97706] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 justify-end">
                                ★ {perf.avgRating}
                              </span>
                            )}
                            {performerFilter === "newest" && (
                              <span className="text-[10px] font-bold text-[#57585A]">
                                Joined {new Date(perf.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              </span>
                            )}
                            {performerFilter === "oldest" && (
                              <span className="text-[10px] font-bold text-[#57585A]">
                                Joined {new Date(perf.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {sortedPerformers.length === 0 && (
                        <p className="text-xs text-[#57585A] text-center italic py-8">No user records available.</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setActiveTab("directory")}
                    className="w-full text-center text-xs font-extrabold text-[#172263] hover:text-[#11194A] mt-4 pt-4 border-t border-slate-100 transition"
                  >
                    View More &gt;
                  </button>
                </div>
                
              </div>
              
              {/* Operational Insights (Highlights) Cards */}
              <div className="bg-[#f2f8f6] border border-emerald-100 rounded-3xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-[#172263] font-bold text-lg font-sora">Operational Highlights</h3>
                  <p className="text-emerald-700 text-xs mt-0.5">Summary of platform engagement metrics across core categories.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Harvesters listed</span>
                      <h4 className="text-[#172263] font-extrabold text-2xl font-sora mt-1">+{stats.totalHarvesters}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Active on directory
                    </span>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Operators listed</span>
                      <h4 className="text-[#D97706] font-extrabold text-2xl font-sora mt-1">+{stats.totalOperators}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Verified profiles
                    </span>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Crop requirements</span>
                      <h4 className="text-green-600 font-extrabold text-2xl font-sora mt-1">+{stats.totalRequests}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Farmer listings live
                    </span>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total enquiries</span>
                      <h4 className="text-indigo-600 font-extrabold text-2xl font-sora mt-1">+{enquiries.length}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Pending moderation
                    </span>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* ================================== */}
          {/* TAB: REGISTERED USERS DIRECTORY    */}
          {/* ================================== */}
          {activeTab === "directory" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Registered Users Account Directory</h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3 text-[#57585A]" size={16} />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#172263]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Phone</th>
                        <th className="px-6 py-3.5">State</th>
                        <th className="px-6 py-3.5">Listings Count</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">{user.name}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">{user.phone || "-"}</td>
                            <td className="px-6 py-4">{user.state || "-"}</td>
                            <td className="px-6 py-4">
                              <span className="text-[#57585A]">
                                Harvesters: {user.harvesterCount} | Requests: {user.requestCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {user.is_blocked ? (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-600">
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-600">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  openConfirmModal(
                                    user.is_blocked ? "unblock" : "block",
                                    user.id,
                                    user.name
                                  )
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${user.is_blocked
                                    ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                    : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                  }`}
                              >
                                {user.is_blocked ? "Unblock" : "Block"}
                              </button>
                              <button
                                onClick={() => openConfirmModal("wipe", user.id, user.name)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                              >
                                Wipe Data
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-[#57585A]/70">
                            No users matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* ================================== */}
          {/* TAB: MACHINES MODERATION           */}
          {/* ================================== */}
          {activeTab === "harvesters" && (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Active Machine Listings ({harvesters.length})</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[#57585A]">
                  <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                    <tr>
                      <th className="px-6 py-3.5">Machine Details</th>
                      <th className="px-6 py-3.5">Manufacturer</th>
                      <th className="px-6 py-3.5">Model</th>
                      <th className="px-6 py-3.5">Location</th>
                      <th className="px-6 py-3.5">Listed Owner</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                    {harvesters.length > 0 ? (
                      harvesters.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">{h.machineName}</td>
                          <td className="px-6 py-4">{h.company}</td>
                          <td className="px-6 py-4">{h.model}</td>
                          <td className="px-6 py-4">{h.location}, {h.state}</td>
                          <td className="px-6 py-4">{h.ownerName}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => openListingDetail("harvester", h)}
                              className="px-3 py-1.5 bg-[#f5eee5] text-[#172263] border border-[#e8dfd2] rounded-xl text-xs font-bold hover:bg-[#e8dfd2] transition cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => openConfirmModal("deleteHarv", h.id, h.machineName)}
                              className="px-3 py-1.5 bg-red-55 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                            >
                              Remove Listing
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#57585A]/70">
                          No active machine listings in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* TAB: OPERATORS MODERATION          */}
          {/* ================================== */}
          {activeTab === "operators" && (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Active Operator Listings ({adminOperators.length})</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-[#57585A]">
                  <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                    <tr>
                      <th className="px-6 py-3.5">Operator</th>
                      <th className="px-6 py-3.5">Experience</th>
                      <th className="px-6 py-3.5">Availability</th>
                      <th className="px-6 py-3.5">Location</th>
                      <th className="px-6 py-3.5">Contact Details</th>
                      <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                    {adminOperators.length > 0 ? (
                      adminOperators.map((op) => (
                        <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora flex items-center gap-3">
                            <img
                              src={op.image_path || "/avatar-placeholder.png"}
                              alt={op.name}
                              className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80";
                              }}
                            />
                            {op.name}
                          </td>
                          <td className="px-6 py-4">{op.experience} Years</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              op.availability === 'Available' 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                : "bg-zinc-50 border-zinc-200 text-zinc-600"
                            }`}>
                              {op.availability}
                            </span>
                          </td>
                          <td className="px-6 py-4">{op.location}, {op.state}</td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-[#57585A]">
                              <div>P: {op.phone || "N/A"}</div>
                              <div>W: {op.whatsapp || "N/A"}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => openListingDetail("operator", op)}
                              className="px-3 py-1.5 bg-[#f5eee5] text-[#172263] border border-[#e8dfd2] rounded-xl text-xs font-bold hover:bg-[#e8dfd2] transition cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => openConfirmModal("deleteOp", op.id, op.name)}
                              className="px-3 py-1.5 bg-red-55 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                            >
                              Remove Listing
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#57585A]/70">
                          No active operator listings in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* TAB: REQUESTS MODERATION           */}
          {/* ================================== */}
          {activeTab === "requests" && (
            <div className="space-y-6">
              {/* Request Sub-Tabs Switcher */}
              <div className="flex gap-2 p-1 bg-gray-50 border border-[#E2E8F0] rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setAdminRequestsTab("pending")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    adminRequestsTab === "pending"
                      ? "bg-white text-[#172263] shadow-sm"
                      : "text-[#57585A] hover:bg-white/50"
                  }`}
                >
                  Pending Action ({requests.filter(r => r.status === "Pending" || r.status === "Open").length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminRequestsTab("processed")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    adminRequestsTab === "processed"
                      ? "bg-white text-[#172263] shadow-sm"
                      : "text-[#57585A] hover:bg-white/50"
                  }`}
                >
                  Processed History ({requests.filter(r => r.status === "Accepted" || r.status === "Rejected").length})
                </button>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0]">
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">
                    {adminRequestsTab === "pending" ? "Pending Crop Requirements" : "Processed Crop Requirements"}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Crop Type</th>
                        <th className="px-6 py-3.5">Listing Category</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5">Duration</th>
                        <th className="px-6 py-3.5">Date Added</th>
                        <th className="px-6 py-3.5">Requester</th>
                        {adminRequestsTab === "processed" && <th className="px-6 py-3.5">Status</th>}
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {(adminRequestsTab === "pending"
                        ? requests.filter(r => r.status === "Pending" || r.status === "Open")
                        : requests.filter(r => r.status === "Accepted" || r.status === "Rejected")
                      ).length > 0 ? (
                        (adminRequestsTab === "pending"
                          ? requests.filter(r => r.status === "Pending" || r.status === "Open")
                          : requests.filter(r => r.status === "Accepted" || r.status === "Rejected")
                        ).map((r) => (
                          <Fragment key={r.id}>
                            <tr
                              onClick={() => setExpandedRequestId(expandedRequestId === r.id ? null : r.id)}
                              className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">
                                <div className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                                  <ChevronDown size={14} className={`shrink-0 transition-transform ${expandedRequestId === r.id ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
                                  <span>{r.machineType}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 capitalize">{r.type}</td>
                              <td className="px-6 py-4">{r.location}, {r.state}</td>
                              <td className="px-6 py-4">{r.duration || "Not specified"} days</td>
                              <td className="px-6 py-4">
                                {r.startDate ? new Date(r.startDate).toLocaleDateString() : "-"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-700">{r.requesterName}</span>
                                  <span className="text-xs text-slate-500">{r.requesterPhone || "No phone"}</span>
                                </div>
                              </td>
                              {adminRequestsTab === "processed" && (
                                <td className="px-6 py-4">
                                  {r.status === "Accepted" ? (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold inline-flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Accepted
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold inline-flex items-center gap-1">
                                      <XCircle size={12} /> Rejected
                                    </span>
                                  )}
                                </td>
                              )}
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end items-center gap-2">
                                  {adminRequestsTab === "pending" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateRequestStatus(r.id, "Accepted")}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateRequestStatus(r.id, "Rejected")}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRequestStatus(r.id, "Pending")}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#57585A] border border-[#E2E8F0] rounded-xl text-xs font-bold transition"
                                    >
                                      Reset to Pending
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openConfirmModal("deleteReq", r.id, `${r.machineType} requirement`)}
                                    className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50 transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedRequestId === r.id && (
                              <tr className="bg-slate-50/30">
                                <td colSpan={adminRequestsTab === "processed" ? 8 : 7} className="px-6 py-4">
                                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4 text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Requester Information</span>
                                        <div className="flex items-center gap-3">
                                          {r.requesterProfilePic ? (
                                            <img src={r.requesterProfilePic} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="" />
                                          ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#172263] font-bold border border-slate-200 text-lg">
                                              {r.requesterName ? r.requesterName.charAt(0).toUpperCase() : "U"}
                                            </div>
                                          )}
                                          <div>
                                            <div className="text-sm font-bold text-slate-800">{r.requesterName}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                              <Phone size={12} className="text-slate-400" /> {r.requesterPhone || "No phone listed"}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Requirement Schedule</span>
                                        <div className="space-y-1.5 text-sm text-slate-700">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400 font-medium">Start Date:</span>
                                            <span className="font-semibold text-slate-800">{r.startDate ? new Date(r.startDate).toLocaleDateString() : "Immediate"}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400 font-medium">Duration:</span>
                                            <span className="font-semibold text-slate-800">{r.duration ? `${r.duration} Days` : "Not specified"}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Detailed Description</span>
                                      <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50/60 p-4 rounded-xl border border-slate-100 font-medium leading-relaxed">
                                        {r.description || "No description provided by the user."}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={adminRequestsTab === "processed" ? 8 : 7} className="px-6 py-12 text-center text-[#57585A]/70">
                            {adminRequestsTab === "pending" ? "No pending crop requirements in the database." : "No processed crop requirements in the database."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* TAB: ENQUIRIES                     */}
          {/* ================================== */}
          {activeTab === "enquiries" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0]">
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">General Enquiries</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Phone</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5">Requirement</th>
                        <th className="px-6 py-3.5">Date Needed</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {enquiries.length > 0 ? (
                        enquiries.map((enq) => (
                          <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">{enq.name}</td>
                            <td className="px-6 py-4">{enq.phone}</td>
                            <td className="px-6 py-4">{enq.location}</td>
                            <td className="px-6 py-4">{enq.requirement}</td>
                            <td className="px-6 py-4">{enq.date_needed ? new Date(enq.date_needed).toLocaleDateString() : "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                enq.status === 'Fulfilled' 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                  : enq.status === 'Over'
                                    ? "bg-rose-50 border-rose-200 text-rose-600"
                                    : "bg-blue-50 border-blue-200 text-blue-600"
                                }`}>
                                {enq.status || "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              {(enq.status === 'Fulfilled' || enq.status === 'Over') ? (
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/admin/enquiries/${enq.id}/status`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                      },
                                      body: JSON.stringify({ status: 'Active' })
                                    });
                                    if (res.ok) {
                                      refreshAllData();
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                >
                                  Reopen (Active)
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={async () => {
                                      const res = await fetch(`/api/admin/enquiries/${enq.id}/status`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ status: 'Fulfilled' })
                                      });
                                      if (res.ok) {
                                        refreshAllData();
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-[#E6F4EA] text-[#137333] border-[#CEEAD6] hover:bg-[#D2EBD4]"
                                  >
                                    Mark Fulfilled
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const res = await fetch(`/api/admin/enquiries/${enq.id}/status`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ status: 'Over' })
                                      });
                                      if (res.ok) {
                                        refreshAllData();
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF] hover:bg-[#F9C3BE]"
                                  >
                                    Mark Over
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-[#57585A]/70">
                            No enquiries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* TAB: BLOGS                        */}
          {/* ================================== */}
          {activeTab === "blogs" && (
            <div className="space-y-6">
              
              {/* Cumulative Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Blogs", value: adminBlogs.length, desc: "Published posts", color: "text-[#172263]" },
                  { label: "Total Views", value: adminBlogs.reduce((sum, b) => sum + (b.views || 0), 0), desc: "Cumulative reader views", color: "text-blue-600" },
                  { label: "Total Likes", value: adminBlogs.reduce((sum, b) => sum + (b.likes_count || 0), 0), desc: "Cumulative likes", color: "text-rose-600" },
                  { label: "Total Comments", value: adminBlogs.reduce((sum, b) => sum + (b.comments_count || 0), 0), desc: "User feedback count", color: "text-[#D97706]" }
                ].map((card, idx) => (
                  <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                    <span className="text-[#57585A] text-xs font-bold uppercase tracking-wider">{card.label}</span>
                    <span className={`text-3xl font-extrabold my-2 font-sora ${card.color}`}>{card.value}</span>
                    <span className="text-[10px] text-[#57585A] font-medium">{card.desc}</span>
                  </div>
                ))}
              </div>

              {showBlogForm ? (
                /* Inline Add/Edit Blog Form */
                <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                    <h3 className="text-xl font-bold text-[#1A1A1A] font-sora">
                      {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                    </h3>
                    <button 
                      onClick={() => setShowBlogForm(false)}
                      className="px-4 py-2 border border-[#E2E8F0] hover:bg-zinc-50 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleBlogSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Blog Title *</label>
                        <input
                          type="text"
                          required
                          value={blogTitle}
                          onChange={(e) => setBlogTitle(e.target.value)}
                          placeholder="e.g. 5 Tips to Maintain Your Combine Harvester Before Rabi Season"
                          className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Category *</label>
                        <select
                          value={blogCategory}
                          onChange={(e) => handleCategoryChange(e.target.value, 'standard')}
                          className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="Other">Other (One-time...)</option>
                          <option value="Add New Category...">Add New Category...</option>
                        </select>
                        {blogCategory === "Other" && (
                          <div className="mt-2.5">
                            <input
                              type="text"
                              required
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              placeholder="Type custom one-time category..."
                              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Publication Date (Optional)</label>
                        <input
                          type="text"
                          value={blogDate}
                          onChange={(e) => setBlogDate(e.target.value)}
                          placeholder="e.g. Jun 16, 2026 (defaults to current date)"
                          className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Blog Cover Image</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBlogImageFile(file);
                                setBlogImagePreview(URL.createObjectURL(file));
                                setBlogImageUrl(""); // Clear URL input when uploading a file
                              }
                            }}
                            className="hidden"
                            id="blog-image-picker"
                          />
                          <label
                            htmlFor="blog-image-picker"
                            className="px-4 py-2.5 border border-[#E2E8F0] hover:bg-zinc-50 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-2 justify-center shrink-0"
                          >
                            <Camera size={14} /> Upload File
                          </label>
                          
                          <span className="text-xs text-gray-400 font-bold text-center self-center shrink-0">OR</span>
                          
                          <input
                            type="text"
                            value={blogImageUrl}
                            onChange={(e) => {
                              setBlogImageUrl(e.target.value);
                              setBlogImagePreview(e.target.value);
                              setBlogImageFile(null); // Clear file when entering a URL
                            }}
                            placeholder="Enter image web URL (or AI pre-filled link)..."
                            className="flex-1 min-w-0 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263]"
                          />

                          {blogImagePreview && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#E2E8F0] shrink-0 self-center">
                              <img src={blogImagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setBlogImageFile(null);
                                  setBlogImagePreview("");
                                  setBlogImageUrl("");
                                }}
                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Short Description *</label>
                      <textarea
                        required
                        rows={2}
                        value={blogShortDesc}
                        onChange={(e) => setBlogShortDesc(e.target.value)}
                        placeholder="Provide a brief summary card overview..."
                        className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Full Article Content *</label>
                      <textarea
                        required
                        rows={8}
                        value={blogContent}
                        onChange={(e) => setBlogContent(e.target.value)}
                        placeholder="Write the full body content here..."
                        className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingBlog}
                      className="w-full py-3.5 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition disabled:opacity-60 flex items-center justify-center gap-2 font-bold font-sora cursor-pointer"
                    >
                      {savingBlog ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Save Blog Post"
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Blogs Listing Table & Directory */
                <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Blogs Directory</h3>
                      <p className="text-xs text-[#57585A] mt-0.5">Manage and track views analytics for all articles.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
                        <input
                          type="text"
                          value={adminBlogsSearch}
                          onChange={(e) => setAdminBlogsSearch(e.target.value)}
                          placeholder="Search articles..."
                          className="pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263]"
                        />
                      </div>
                      <button
                        onClick={startAiGenerateBlog}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles size={14} /> Generate with AI
                      </button>
                      <button
                        onClick={startCreateBlog}
                        className="px-4 py-2 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} /> Add Blog Post
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[#57585A]">
                      <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                        <tr>
                          <th className="px-6 py-3.5 w-16">Cover</th>
                          <th className="px-6 py-3.5">Title</th>
                          <th className="px-6 py-3.5">Category</th>
                          <th className="px-6 py-3.5">Published Date</th>
                          <th className="px-6 py-3.5 text-center">Views</th>
                          <th className="px-6 py-3.5 text-center">Likes</th>
                          <th className="px-6 py-3.5 text-center">Comments</th>
                          <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                        {adminBlogs.filter(b => b.title?.toLowerCase().includes(adminBlogsSearch.toLowerCase()) || b.category?.toLowerCase().includes(adminBlogsSearch.toLowerCase())).length > 0 ? (
                          adminBlogs
                            .filter(b => b.title?.toLowerCase().includes(adminBlogsSearch.toLowerCase()) || b.category?.toLowerCase().includes(adminBlogsSearch.toLowerCase()))
                            .map((blog) => (
                              <tr key={blog.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <img
                                    src={blog.image_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"}
                                    alt="cover"
                                    className="w-10 h-10 object-cover rounded-lg border border-[#E2E8F0]"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                                    }}
                                  />
                                </td>
                                <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora max-w-xs truncate">{blog.title}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                    {blog.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{blog.date || "N/A"}</td>
                                <td className="px-6 py-4 text-center font-bold text-slate-800">{blog.views || 0}</td>
                                <td className="px-6 py-4 text-center text-rose-600 font-bold">{blog.likes_count || 0}</td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => openBlogComments(blog)}
                                    className="px-2.5 py-1 rounded-lg border border-[#e8dfd2] bg-[#fcfbf9] text-[#D97706] font-bold hover:bg-[#e8dfd2]/40 transition text-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                                    title="Moderate Comments"
                                  >
                                    <MessageCircle size={13} />
                                    {blog.comments_count || 0}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    onClick={() => openBlogPreview(blog)}
                                    className="p-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center cursor-pointer"
                                    title="Preview Article"
                                  >
                                    <BookOpen size={14} />
                                  </button>
                                  <button
                                    onClick={() => startEditBlog(blog)}
                                    className="p-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center cursor-pointer"
                                    title="Edit Blog"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => openConfirmModal("deleteBlog", String(blog.id), blog.title)}
                                    className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition inline-flex items-center justify-center cursor-pointer"
                                    title="Delete Blog"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-[#57585A]/70">
                              No blog posts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================== */}
          {/* TAB: FAQS (FAQ MANAGEMENT)        */}
          {/* ================================== */}
          {activeTab === "faqs" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>FAQ Management</h2>
                  <p className="text-xs text-[#57585A] mt-0.5">Answer submitted questions or manage existing FAQs</p>
                </div>
              </div>

              {/* FAQs Listing & Actions */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Question</th>
                        <th className="px-6 py-3.5">Answer</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Date Asked</th>
                        <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white font-medium font-sora">
                      {adminFaqs.length > 0 ? (
                        adminFaqs.map((faq) => (
                          <tr key={faq.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 max-w-xs font-semibold text-[#1A1A1A] break-words">
                              {faq.question}
                            </td>
                            <td className="px-6 py-4 max-w-sm text-xs break-words">
                              {faq.answer ? (
                                <p className="leading-relaxed">{faq.answer}</p>
                              ) : (
                                <span className="text-amber-600 font-bold italic">Unanswered</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                faq.status === 'Answered'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {faq.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-[#57585A]">
                              {new Date(faq.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {faq.status === 'Pending' ? (
                                  <button
                                    onClick={() => {
                                      setAnsweringFaqId(faq.id);
                                      setFaqAnswerText("");
                                    }}
                                    className="px-3 py-1.5 bg-[#172263] text-white hover:bg-[#11194A] text-xs font-bold rounded-xl transition cursor-pointer"
                                  >
                                    Answer
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAnsweringFaqId(faq.id);
                                      setFaqAnswerText(faq.answer || "");
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                  >
                                    Edit Answer
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteFaq(faq.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-100 rounded-xl transition cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-[#57585A]/70">
                            No FAQ questions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Answering Form Modal / Expandable Panel */}
              {answeringFaqId && (
                <div className="bg-slate-50/50 border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-[#1A1A1A] font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {adminFaqs.find(f => f.id === answeringFaqId)?.answer ? 'Edit Answer for Question' : 'Provide Answer for Question'}
                  </h3>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-[#57585A] leading-relaxed italic">
                    "{adminFaqs.find(f => f.id === answeringFaqId)?.question}"
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-[#57585A] font-bold uppercase tracking-wider block">Your Answer *</label>
                    <textarea
                      value={faqAnswerText}
                      onChange={(e) => setFaqAnswerText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none"
                      placeholder="Type your answer here..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnswerFaqSubmit(answeringFaqId)}
                      className="px-4 py-2.5 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Save and Approve
                    </button>
                    <button
                      onClick={() => {
                        setAnsweringFaqId(null);
                        setFaqAnswerText("");
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-md w-full rounded-[24px] p-6 space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Administrative Action Confirmation</h3>
                <p className="text-[#57585A] text-sm mt-1">
                  Are you absolutely sure you want to proceed?
                  {confirmType === 'block' && ` This will prevent "${confirmTargetName}" from logging into the website.`}
                  {confirmType === 'unblock' && ` This will restore account access privileges for "${confirmTargetName}".`}
                  {confirmType === 'wipe' && ` This will permanently delete all machine listings, requests, and profiles owned by "${confirmTargetName}", and block the user.`}
                  {confirmType === 'deleteHarv' && ` This will permanently delete listing "${confirmTargetName}".`}
                  {confirmType === 'deleteReq' && ` This will permanently remove request "${confirmTargetName}".`}
                  {confirmType === 'deleteBlog' && ` This will permanently delete the blog post "${confirmTargetName}".`}
                  {confirmType === 'deleteOp' && ` This will permanently delete operator profile "${confirmTargetName}".`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-[#57585A] font-bold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Listing Viewer Modal */}
      {showDetailModal && selectedListingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-2xl w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Banner/Header Cover Image */}
            <div className="h-56 bg-slate-100 relative shrink-0">
              {selectedListingType === 'harvester' ? (
                selectedListingDetail.imagePath ? (
                  <img
                    src={selectedListingDetail.imagePath}
                    alt={selectedListingDetail.machineName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center">
                    <TractorIllustration size={160} />
                  </div>
                )
              ) : (
                selectedListingDetail.image_path ? (
                  <img
                    src={selectedListingDetail.image_path}
                    alt={selectedListingDetail.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#172263]/10 to-[#E82326]/10 flex items-center justify-center">
                    <UserCheck size={80} className="text-[#172263]/60" />
                  </div>
                )
              )}
              
              {/* Category Badge */}
              <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 bg-[#172263] text-white rounded-full shadow-md uppercase tracking-wider">
                {selectedListingType === 'harvester' ? 'Harvester' : 'Operator Profile'}
              </span>

              {/* Close button */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-zinc-800 rounded-full shadow-md backdrop-blur-sm transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
              
              {/* Title Header */}
              <div>
                <h3 className="text-2xl font-extrabold text-[#1A1A1A] font-sora">
                  {selectedListingType === 'harvester' ? selectedListingDetail.machineName : selectedListingDetail.name}
                </h3>
                <p className="text-sm text-[#57585A] mt-1 font-medium flex items-center gap-1">
                  <MapPin size={14} className="text-red-500" />
                  {selectedListingDetail.location}, {selectedListingDetail.state}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#fcfbf9] p-4 border border-[#e8dfd2]/60 rounded-2xl">
                {selectedListingType === 'harvester' ? (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Company</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.company}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Model</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.model}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Model Year</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.year || 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Experience</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.experience} Years</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Availability</span>
                      <span className="mt-1 block">
                        <AvailabilityBadge status={selectedListingDetail.availability} />
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Machine Expertise if Operator */}
              {selectedListingType === 'operator' && selectedListingDetail.machineExpertise && selectedListingDetail.machineExpertise.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A]">Machine Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedListingDetail.machineExpertise.map((m: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 bg-blue-50 text-[#172263] border border-[#172263]/10 rounded-full font-semibold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner / Contact Details */}
              <div className="border-t border-[#E2E8F0]/80 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A]">Contact Information</h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fcfbf9] p-4 border border-[#e8dfd2]/60 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-[#57585A] uppercase block">Owner Name</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{selectedListingDetail.ownerName || selectedListingDetail.name || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selectedListingDetail.phone && (
                      <a
                        href={`tel:${selectedListingDetail.phone}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                      >
                        <Phone size={14} /> Call {selectedListingDetail.phone}
                      </a>
                    )}
                    {selectedListingDetail.whatsapp && (
                      <a
                        href={`https://wa.me/91${selectedListingDetail.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-[#E2E8F0]/80 pt-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A]">Description</h4>
                <p className="text-sm text-[#57585A] leading-relaxed whitespace-pre-line bg-[#fcfbf9] p-4 border border-[#e8dfd2]/30 rounded-2xl font-semibold">
                  {selectedListingDetail.description || 'No description provided.'}
                </p>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-[#fcfbf9] border-t border-[#E2E8F0] flex justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  if (selectedListingType === 'harvester') {
                    openConfirmModal("deleteHarv", selectedListingDetail.id, selectedListingDetail.machineName);
                  } else {
                    openConfirmModal("deleteOp", selectedListingDetail.id, selectedListingDetail.name);
                  }
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Remove Listing
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Blog Comments Modal */}
      {showCommentsModal && activeBlogForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-xl w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Moderate Blog Comments</h3>
                <p className="text-xs text-[#57585A] mt-0.5 line-clamp-1">Article: {activeBlogForComments.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setActiveBlogForComments(null);
                  setSelectedBlogComments([]);
                }}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comment List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 min-h-[300px]">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[#172263] animate-spin" />
                  <span className="text-xs text-[#57585A] mt-2 font-bold">Loading comments...</span>
                </div>
              ) : selectedBlogComments.length > 0 ? (
                selectedBlogComments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-[#fcfbf9] border border-[#e8dfd2]/50 rounded-2xl flex items-start gap-4 hover:border-[#e8dfd2] transition">
                    <div className="w-8 h-8 rounded-full bg-[#172263] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1A1A1A] truncate">{comment.user_name}</span>
                        <span className="text-[10px] text-[#57585A]">
                          {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-[#57585A] mt-1 whitespace-pre-line leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBlogComment(comment.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition shrink-0 cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare size={36} className="text-[#57585A]/40 mb-2" />
                  <p className="text-sm text-[#57585A]/70 font-semibold">No comments posted on this article.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#fcfbf9] border-t border-[#E2E8F0] flex justify-end shrink-0">
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setActiveBlogForComments(null);
                  setSelectedBlogComments([]);
                }}
                className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Blog Article Preview Modal */}
      {showPreviewModal && activeBlogPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-3xl w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Image Banner header */}
            <div className="h-64 bg-zinc-100 relative shrink-0">
              <img
                src={activeBlogPreview.image_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"}
                alt={activeBlogPreview.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2.5 py-0.5 bg-[#D97706] text-white rounded-full font-bold uppercase tracking-wider">
                    {activeBlogPreview.category}
                  </span>
                  <span className="text-xs text-white/70">{activeBlogPreview.date || 'N/A'}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white font-sora line-clamp-2">
                  {activeBlogPreview.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setActiveBlogPreview(null);
                }}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 font-medium font-sora text-[#1A1A1A]">
              {/* Short Summary Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Executive Summary</h4>
                <p className="text-sm font-semibold text-[#57585A] leading-relaxed italic">
                  "{activeBlogPreview.short_description || activeBlogPreview.shortDescription}"
                </p>
              </div>

              {/* Full body markdown/text */}
              <div className="text-sm text-[#1A1A1A] leading-relaxed font-medium font-sora">
                {renderMarkdown(activeBlogPreview.content)}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#fcfbf9] border-t border-[#E2E8F0] flex justify-between items-center shrink-0">
              <div className="flex gap-4 text-xs text-[#57585A] font-bold">
                <span>Views: {activeBlogPreview.views || 0}</span>
                <span>Likes: {activeBlogPreview.likes_count || 0}</span>
                <span>Comments: {activeBlogPreview.comments_count || 0}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    startEditBlog(activeBlogPreview);
                  }}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Pencil size={13} /> Edit Article
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setActiveBlogPreview(null);
                  }}
                  className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* AI Blog Generator Modal */}
      {showAiBlogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E2E8F0] max-w-lg w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Generate Blog with AI</h3>
                  <p className="text-xs text-[#57585A] mt-0.5">Let AI write a formatted blog post in seconds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiBlogForm(false)}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 rounded-full transition cursor-pointer"
                disabled={generatingBlog}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAiGenerate} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#57585A] block mb-1.5 font-bold uppercase tracking-wider">Blog Title / Topic *</label>
                <input
                  type="text"
                  required
                  value={aiPromptTitle}
                  onChange={(e) => setAiPromptTitle(e.target.value)}
                  placeholder="e.g. Tractor Maintenance Tips for Rainy Season"
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  disabled={generatingBlog}
                />
              </div>

              <div>
                <label className="text-xs text-[#57585A] block mb-1.5 font-bold uppercase tracking-wider">Keywords / Focus Areas (Comma separated)</label>
                <input
                  type="text"
                  value={aiPromptKeywords}
                  onChange={(e) => setAiPromptKeywords(e.target.value)}
                  placeholder="e.g. rust prevention, battery care, lubrication"
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  disabled={generatingBlog}
                />
              </div>

              <div>
                <label className="text-xs text-[#57585A] block mb-1.5 font-bold uppercase tracking-wider">Category *</label>
                <select
                  value={aiPromptCategory}
                  onChange={(e) => handleCategoryChange(e.target.value, 'ai')}
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                  disabled={generatingBlog}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other (One-time...)</option>
                  <option value="Add New Category...">Add New Category...</option>
                </select>
                {aiPromptCategory === "Other" && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      required
                      value={aiCustomCategory}
                      onChange={(e) => setAiCustomCategory(e.target.value)}
                      placeholder="Type custom one-time category..."
                      className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                      disabled={generatingBlog}
                    />
                  </div>
                )}
              </div>



              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2E8F0] mt-6">
                <button
                  type="button"
                  onClick={() => setShowAiBlogForm(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  disabled={generatingBlog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingBlog}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-60 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {generatingBlog ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate Article
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

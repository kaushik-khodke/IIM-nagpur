import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
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
} from "./shared";
import { toast } from "sonner";
import districtsData from "./districts.json";
import { detectUserLocation, matchLocationWithDistricts } from "./locationHelper";

const INDIAN_STATES = districtsData.states.map(s => s.state);

const MACHINE_TYPES = ["Combine Harvester","Rice Harvester","Wheat Harvester","Maize Harvester","Sugarcane Harvester","Paddy Harvester"];
const COMPANIES = ["John Deere","Claas","Mahindra","New Holland","AGCO","Preet","Sonalika","Other"];

// ===========================
// EXPLORE HARVESTERS
// ===========================
export function ExploreHarvesters() {
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "mine">("all");
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
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader
          title="Browse Harvesters 🚜"
          subtitle={`${filtered.length} machines available`}
          action={
            <Link
              to="/add-harvester"
              className="flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white rounded-xl text-sm hover:bg-green-700 transition-colors"
            >
              <Plus size={16} /> List Your Machine
            </Link>
          }
        />

        <div className="bg-white rounded-2xl p-4 border border-[#E7E0D5] shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by machine name or owner..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
              />
            </div>
            
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] w-full md:w-48"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] w-full md:w-48 disabled:opacity-50"
            >
              <option value="">All Districts</option>
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
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] w-full md:w-44"
            >
              <option value="">All Companies</option>
              {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {(search || selectedState || selectedDistrict || company) && (
              <button 
                onClick={() => { 
                  setSearch(""); 
                  setSelectedState(""); 
                  setSelectedDistrict(""); 
                  setCompany(""); 
                }} 
                className="text-[#E8720C] text-sm px-3 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
        </div>


        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E7E0D5] mb-6">
          <button
            onClick={() => setTab("all")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === "all"
                ? "border-[#E8720C] text-[#E8720C]"
                : "border-transparent text-[#78716C] hover:text-[#E8720C]"
            }`}
          >
            All Machines
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === "mine"
                ? "border-[#E8720C] text-[#E8720C]"
                : "border-transparent text-[#78716C] hover:text-[#E8720C]"
            }`}
          >
            My Listings
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === "mine" ? "You haven't listed any machines yet" : "No harvesters found"}
            description={tab === "mine" ? "List your harvester today to connect with farmers looking for services." : "Try adjusting your filters or be the first to list a machine in this area."}
            actionLabel="List Your Machine"
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
  const { id } = useParams();
  const [harvester, setHarvester] = useState<any>(null);
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
  }, [id]);

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
  if (!harvester) return <EmptyState title="Harvester not found" />;

  const isOwner = currentUser && (harvester.userId === currentUser.id || harvester.ownerName === currentUser.name);

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/harvesters" className="inline-flex items-center gap-2 text-[#78716C] text-sm mb-6 hover:text-[#E8720C]">
          <ArrowLeft size={16} /> Back to Harvesters
        </Link>

        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl aspect-video flex items-center justify-center mb-6 relative overflow-hidden border border-[#E7E0D5]">
          {harvester.imagePath ? (
            <img src={harvester.imagePath} alt={harvester.machineName} className="w-full h-full object-cover" />
          ) : (
            <TractorIllustration size={200} />
          )}
          <WheatWatermark className="right-10 top-5" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1
              className="text-3xl text-[#1C1008] mb-3"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              {harvester.machineName}
            </h1>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">{harvester.company}</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{harvester.model}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { icon: <MapPin size={18} className="text-[#E8720C]" />, label: "Location", value: harvester.location },
                { icon: <Tractor size={18} className="text-[#E8720C]" />, label: "Company", value: harvester.company },
                { icon: <Award size={18} className="text-[#E8720C]" />, label: "Model", value: harvester.model },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-4 border border-[#E7E0D5]">
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <span className="text-xs text-[#78716C]">{item.label}</span>
                  </div>
                  <p className="text-sm text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6 mb-6">
              <h3 className="text-[#1C1008] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>About This Machine</h3>
              <div className="w-full h-px bg-[#E7E0D5] mb-4" />
              <p className="text-[#78716C] text-sm leading-relaxed">
                {harvester.description || `This ${harvester.company} ${harvester.model} is well-maintained and suitable for harvesting wheat, rice, and other Rabi/Kharif crops. Available for seasonal hire with experienced operator on request.`}
              </p>
            </div>
          </div>

          {/* Owner Card */}
          <div>
            <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)]">
              <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {isOwner ? "Machine Owner (You)" : "Machine Owner"}
              </h3>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center ring-2 ring-orange-200">
                  <span className="text-white font-bold">{harvester.ownerName?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <p className="text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{harvester.ownerName}</p>
                  <p className="text-xs text-[#78716C] flex items-center gap-1"><Phone size={11} /> +91-{harvester.phone || 'XXXXXXXXXX'}</p>
                </div>
              </div>
              {isOwner ? (
                <div className="space-y-2">
                  <div className="text-center text-xs py-1.5 px-3 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold mb-2">
                    This is your listing
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Trash2 size={16} /> Delete Listing
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/91${harvester.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <MessageSquare size={16} /> WhatsApp Owner
                  </a>
                  <button
                    onClick={() => toast.success("Message feature coming soon! Or contact directly via phone.")}
                    className="w-full py-2.5 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors"
                  >
                    Message Owner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E7E0D5]">
            <h3 className="text-lg text-[#1C1008] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Delete Machine Listing?</h3>
            <p className="text-[#78716C] text-sm mb-4">Are you sure you want to delete this listing? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-[#E7E0D5] rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors">Delete</button>
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
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader title="Find Operators 👨‍🌾" subtitle={`${filtered.length} operators available`} />

        <div className="bg-white rounded-2xl p-4 border border-[#E7E0D5] shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by operator name..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
              />
            </div>
            
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] w-full md:w-48"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] w-full md:w-48 disabled:opacity-50"
            >
              <option value="">All Districts</option>
              {selectedState &&
                districtsData.states
                  .find((s) => s.state === selectedState)
                  ?.districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
            </select>

            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] w-full md:w-44"
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Not Available">Not Available</option>
            </select>
            {(search || selectedState || selectedDistrict || availability) && (
              <button 
                onClick={() => { 
                  setSearch(""); 
                  setSelectedState(""); 
                  setSelectedDistrict(""); 
                  setAvailability(""); 
                }} 
                className="text-[#E8720C] text-sm px-3 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No operators found" description="Try adjusting your filters." />
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
  const { id } = useParams();
  const [operator, setOperator] = useState<any>(null);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!operator) return <EmptyState title="Operator profile not found" />;

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-[#E8720C] via-[#D97706] to-[#15803D] rounded-b-3xl overflow-hidden">
          <WheatWatermark className="right-10 top-0 opacity-[0.06]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden">
              {operator.image_path ? (
                <img src={operator.image_path} alt={operator.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{operator.name.charAt(0)}</span>
              )}
            </div>
            <div className="pb-2">
              <h1
                className="text-2xl text-[#1C1008]"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                {operator.name}
              </h1>
              <p className="text-[#78716C] flex items-center gap-1 text-sm">
                <MapPin size={13} /> {operator.location}
              </p>
            </div>
            <div className="sm:ml-auto pb-2">
              <AvailabilityBadge status={operator.availability} />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: `${operator.experience} Yrs`, label: "Experience" },
                  { value: `${operator.machineExpertise?.length || 0}`, label: "Machine Types" },
                  { value: operator.availability, label: "Status" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-[#E7E0D5]">
                    <p className="text-[#E8720C] text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>{s.value}</p>
                    <p className="text-xs text-[#78716C]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* About */}
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                <h3 className="text-[#1C1008] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>About</h3>
                <p className="text-[#78716C] text-sm leading-relaxed">
                  {operator.description || `Experienced harvester operator with ${operator.experience}+ years in agricultural machinery operation. Skilled in operating combine harvesters, rice harvesters, and wheat harvesters across multiple states in India.`}
                </p>
              </div>

              {/* Machine Expertise */}
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                <h3 className="text-[#1C1008] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Machine Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {operator.machineExpertise?.map((m: string) => (
                    <span key={m} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Listed Machines */}
              {harvesters.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                  <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Listed Harvesters</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {harvesters.map((h) => (
                      <HarvesterCard key={h.id} {...h} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact card */}
            <div>
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)]">
                <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Contact Operator</h3>
                <p className="text-sm text-[#78716C] mb-4 flex items-center gap-2">
                  <Phone size={14} /> +91-{operator.phone || 'XXXXXXXXXX'}
                </p>
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/91${operator.whatsapp || operator.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <MessageSquare size={16} /> WhatsApp
                  </a>
                  <button
                    onClick={() => toast.success("Chat feature coming soon! Feel free to WhatsApp or call.")}
                    className="w-full py-2.5 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E7E0D5] sm:hidden z-40">
        <a
          href={`tel:+91${operator.phone}`}
          className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors flex items-center justify-center font-semibold"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Call Operator
        </a>
      </div>
    </div>
  );
}

// ===========================
// ADD OPERATOR FORM
// ===========================
export function AddOperator() {
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const defaultState = localStorage.getItem("tractorsewa_default_state");
    const defaultDistrict = localStorage.getItem("tractorsewa_default_district");
    if (defaultState) setState(defaultState);
    if (defaultDistrict) setLocation(defaultDistrict);
  }, []);

  const handleDetectLocation = async () => {
    const loadingToastId = toast.loading("Detecting location...");
    const detected = await detectUserLocation();
    toast.dismiss(loadingToastId);
    if (detected) {
      const matched = matchLocationWithDistricts(detected.state, detected.district);
      if (matched) {
        setState(matched.state);
        setLocation(matched.district);
        localStorage.setItem("tractorsewa_default_state", matched.state);
        localStorage.setItem("tractorsewa_default_district", matched.district);
        toast.success(`Location set to ${matched.district}, ${matched.state}`);
      } else {
        toast.error("Could not match detected location with Indian states/districts.");
      }
    } else {
      toast.error("Could not detect location. Please select manually.");
    }
  };

  const toggleMachine = (m: string) => {
    setSelectedMachines((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !experience.trim() || !location || !state || selectedMachines.length === 0) {
      toast.error("Please make sure all basic details and skills are filled out correctly from previous steps.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (phone.trim().length !== 10 || isNaN(Number(phone.trim()))) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!whatsapp.trim()) {
      toast.error("Please enter your WhatsApp number");
      return;
    }
    if (whatsapp.trim().length !== 10 || isNaN(Number(whatsapp.trim()))) {
      toast.error("Please enter a valid 10-digit WhatsApp number");
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
          phone,
          whatsapp,
          imagePath
        })
      });

      if (res.ok) {
        toast.success("Profile created successfully!");
        navigate("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating profile");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Basic Info", "Skills & Equipment", "Contact"];

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader title="Register as Operator 👨‍🌾" subtitle="Complete your profile to get discovered by farmers" />

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${step > i + 1 ? "bg-green-600 text-white" : step === i + 1 ? "bg-[#E8720C] text-white" : "bg-[#E7E0D5] text-[#78716C]"}`}
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-[#E8720C]" : "text-[#78716C]"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${step > i + 1 ? "bg-green-400" : "bg-[#E7E0D5]"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.06)] p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div 
                onClick={() => document.getElementById("operator-photo")?.click()}
                className="border-2 border-dashed border-[#E8720C] rounded-2xl bg-orange-50 py-10 text-center cursor-pointer hover:bg-orange-100 transition-colors relative overflow-hidden h-48 flex flex-col items-center justify-center"
              >
                <input 
                  type="file" 
                  id="operator-photo" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload size={32} className="text-orange-400 mx-auto mb-2" />
                    <p className="text-sm text-[#78716C]">Drop your photo here or click to upload</p>
                  </>
                )}
              </div>
              
              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]"><User size={16} /></span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">Experience (years)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]"><Award size={16} /></span>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
                  />
                </div>
              </div>

              <div className="border-t border-[#E7E0D5] pt-4 my-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-[#1C1008]">Location Details</span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="text-xs text-[#E8720C] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <MapPin size={12} className="text-[#E8720C]" /> Auto-detect Location
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#78716C] block mb-1">State *</label>
                    <select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setLocation("");
                      }}
                      className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#78716C] block mb-1">District / City *</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!state}
                      className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] disabled:opacity-50"
                    >
                      <option value="">Select District</option>
                      {state &&
                        districtsData.states
                          .find((s) => s.state === state)
                          ?.districts.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!name.trim()) {
                    toast.error("Please enter your full name");
                    return;
                  }
                  if (!experience.trim() || isNaN(Number(experience.trim())) || parseInt(experience) <= 0) {
                    toast.error("Please enter a valid experience in years");
                    return;
                  }
                  if (!state) {
                    toast.error("Please select your state");
                    return;
                  }
                  if (!location) {
                    toast.error("Please select your district location");
                    return;
                  }
                  setStep(2);
                }}
                className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
              >
                Next <ArrowRight size={16} />
              </button>

            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-[#78716C] block mb-3">Machine Expertise</label>
                <div className="flex flex-wrap gap-2">
                  {MACHINE_TYPES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMachine(m)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selectedMachines.includes(m)
                          ? "bg-orange-100 border-orange-300 text-orange-700"
                          : "bg-white border-[#E7E0D5] text-[#78716C] hover:border-orange-200"
                      }`}
                    >
                      {selectedMachines.includes(m) ? "✓ " : ""}{m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#78716C] block mb-3">Availability</label>
                <div className="flex gap-2">
                  {["Available","Busy","Not Available"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvailability(a)}
                      className={`flex-1 py-2 rounded-xl text-sm border-2 transition-all ${
                        availability === a
                          ? a === "Available" ? "bg-green-50 border-green-500 text-green-700"
                            : a === "Busy" ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                            : "bg-red-50 border-red-400 text-red-600"
                          : "border-[#E7E0D5] text-[#78716C] hover:border-orange-200"
                      }`}
                    >
                      {a === "Available" ? "✓" : a === "Busy" ? "⏳" : "✗"} {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell farmers about your experience and expertise..."
                  className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] resize-none"
                />
                <p className="text-xs text-[#78716C] text-right">{description.length}/500</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-[#E7E0D5] text-[#78716C] rounded-xl hover:border-[#E8720C] hover:text-[#E8720C] transition-colors">← Back</button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedMachines.length === 0) {
                      toast.error("Please select at least one machine expertise");
                      return;
                    }
                    if (!description.trim()) {
                      toast.error("Please enter a brief description");
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-1 py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {[
                { label: "Phone Number", value: phone, onChange: setPhone, placeholder: "9876543210" },
                { label: "WhatsApp Number", value: whatsapp, onChange: setWhatsapp, placeholder: "9876543210" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-sm text-[#78716C] block mb-1.5">{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">+91</span>
                    <input
                      type="tel"
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full pl-16 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
                    />
                  </div>
                </div>
              ))}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border-2 border-[#E7E0D5] text-[#78716C] rounded-xl hover:border-[#E8720C] hover:text-[#E8720C] transition-colors">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Submit Profile →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================
// ADD HARVESTER FORM
// ===========================
export function AddHarvester() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const defaultState = localStorage.getItem("tractorsewa_default_state");
    const defaultDistrict = localStorage.getItem("tractorsewa_default_district");
    if (defaultState) setState(defaultState);
    if (defaultDistrict) setLocation(defaultDistrict);
  }, []);

  const handleDetectLocation = async () => {
    const loadingToastId = toast.loading("Detecting location...");
    const detected = await detectUserLocation();
    toast.dismiss(loadingToastId);
    if (detected) {
      const matched = matchLocationWithDistricts(detected.state, detected.district);
      if (matched) {
        setState(matched.state);
        setLocation(matched.district);
        localStorage.setItem("tractorsewa_default_state", matched.state);
        localStorage.setItem("tractorsewa_default_district", matched.district);
        toast.success(`Location set to ${matched.district}, ${matched.state}`);
      } else {
        toast.error("Could not match detected location with Indian states/districts.");
      }
    } else {
      toast.error("Could not detect location. Please select manually.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the machine name");
      return;
    }
    if (!company) {
      toast.error("Please select a manufacturer company");
      return;
    }
    if (!model.trim()) {
      toast.error("Please enter the model name/number");
      return;
    }
    if (year && (isNaN(Number(year)) || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1)) {
      toast.error("Please enter a valid model year");
      return;
    }
    if (!state) {
      toast.error("Please select the state");
      return;
    }
    if (!location) {
      toast.error("Please select the district location");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter a contact phone number");
      return;
    }
    if (phone.trim().length !== 10 || isNaN(Number(phone.trim()))) {
      toast.error("Please enter a valid 10-digit phone number");
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
      const res = await fetch("/api/harvesters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          machineName: name,
          company,
          model,
          year,
          location,
          state,
          phone,
          description,
          imagePath
        })
      });

      if (res.ok) {
        toast.success("Harvester listed successfully!");
        navigate("/harvesters");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to list harvester");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error listing harvester");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader title="List Your Harvester 🚜" subtitle="Add your machine to reach thousands of farmers" />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.06)] p-8 space-y-5">
          <div 
            onClick={() => document.getElementById("harvester-photo")?.click()}
            className="border-2 border-dashed border-[#E8720C] rounded-2xl bg-orange-50 py-10 text-center cursor-pointer hover:bg-orange-100 transition-colors relative overflow-hidden h-44 flex flex-col items-center justify-center"
          >
            <input 
              type="file" 
              id="harvester-photo" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <Upload size={32} className="text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-[#78716C]">Upload machine photo</p>
              </>
            )}
          </div>

          <div>
            <label className="text-sm text-[#78716C] block mb-1.5">Machine Name</label>
            <div className="relative">
              <Tractor size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Deere S660" className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#78716C] block mb-1.5">Company</label>
              <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]">
                <option value="">Select Company</option>
                {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-[#78716C] block mb-1.5">Model</label>
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. S660" className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#78716C] block mb-1.5">Year of Manufacture</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2020" className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
            </div>
            <div>
              <label className="text-sm text-[#78716C] block mb-1.5">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">+91</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="w-full pl-16 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
              </div>
            </div>
          </div>

          <div className="border-t border-[#E7E0D5] pt-4 my-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-[#1C1008]">Location Details</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="text-xs text-[#E8720C] hover:underline flex items-center gap-1 font-semibold"
              >
                <MapPin size={12} className="text-[#E8720C]" /> Auto-detect Location
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#78716C] block mb-1">State *</label>
                <select 
                  value={state} 
                  onChange={(e) => {
                    setState(e.target.value);
                    setLocation("");
                  }} 
                  className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#78716C] block mb-1">District / City *</label>
                <select 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  disabled={!state}
                  className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] disabled:opacity-50"
                >
                  <option value="">Select District</option>
                  {state &&
                    districtsData.states
                      .find((s) => s.state === state)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#78716C] block mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the machine condition and availability..." className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] resize-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#15803D] text-white rounded-xl hover:bg-green-700 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Submit Listing →"}
          </button>
        </form>
      </div>
    </div>
  );
}


// ===========================
// REQUESTS
// ===========================
export function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [reqType, setReqType] = useState<"operator" | "harvester">("operator");
  const [tab, setTab] = useState<"operator" | "harvester">("operator");
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

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/requests?tab=${tab}&location=${encodeURIComponent(selectedDistrict)}&state=${encodeURIComponent(selectedState)}`, {
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
  }, [tab, selectedState, selectedDistrict]);

  // Handle auto-detect for Dialog
  const handleDialogDetectLocation = async () => {
    const loadingToastId = toast.loading("Detecting location...");
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
        toast.success(`Location set to ${matched.district}, ${matched.state}`);
      } else {
        toast.error("Could not match location with Indian states/districts.");
      }
    } else {
      toast.error("Could not detect location. Please select manually.");
    }
  };

  const postReq = async () => {
    if (!newReq.location || !newReq.state || !newReq.machineType || !newReq.startDate) {
      toast.error("Please fill out all required fields");
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
          type: reqType,
          ...newReq
        })
      });

      if (res.ok) {
        setShowDialog(false);
        setNewReq({ location: "", state: "", machineType: "", duration: "", startDate: "", description: "" });
        toast.success("Requirement posted successfully!");
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to post requirement");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error posting requirement");
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
        toast.success("Requirement deleted.");
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting requirement");
    }
  };

  const filtered = requests;

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader
          title="Browse Requirements 📋"
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
              className="flex items-center gap-2 px-4 py-2 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors"
            >
              <Plus size={16} /> Post Requirement
            </button>
          }
        />

        {/* Tabs and filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {(["operator", "harvester"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm border-2 transition-all ${
                  tab === t ? "border-[#E8720C] bg-orange-50 text-[#E8720C]" : "border-[#E7E0D5] text-[#78716C] hover:border-orange-200"
                }`}
              >
                {t === "operator" ? "👨‍🌾 Need Operator" : "🚜 Need Harvester"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="px-3 py-2 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] bg-white w-40"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="px-3 py-2 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] bg-white w-40 disabled:opacity-50"
            >
              <option value="">All Districts</option>
              {selectedState &&
                districtsData.states
                  .find((s) => s.state === selectedState)
                  ?.districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
            </select>
            {(selectedState || selectedDistrict) && (
              <button 
                onClick={() => { 
                  setSelectedState(""); 
                  setSelectedDistrict(""); 
                }} 
                className="text-[#E8720C] text-xs px-2 hover:underline"
              >
                Clear Location
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState title="No requirements posted" description="Post your first requirement to find operators or harvesters." />
          ) : (
            filtered.map((req) => {
              const isOwner = currentUser && req.userId === currentUser.id;
              return (
                <div key={req.id} className={`bg-white rounded-2xl border border-[#E7E0D5] p-5 flex gap-4 items-start shadow-[0_2px_16px_rgba(232,114,12,0.06)] border-l-4 ${req.type === "operator" ? "border-l-[#E8720C]" : "border-l-[#15803D]"}`}>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${req.type === "operator" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                        {req.type === "operator" ? "👨‍🌾 Need Operator" : "🚜 Need Harvester"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${req.status === "Open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {req.status}
                      </span>
                      {isOwner && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold shadow-sm">
                          My Requirement
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[#78716C]">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {req.location}{req.state ? `, ${req.state}` : ""}
                      </span>
                      <span>{req.machineType}</span>
                      <span>{req.duration} days</span>
                      <span>{new Date(req.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/requests/${req.id}`} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium">
                      View
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
            className="bg-white rounded-2xl p-6 w-full max-w-lg border border-[#E7E0D5] max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>Post a Requirement</h3>
              <button 
                type="button" 
                onClick={handleDialogDetectLocation}
                className="text-xs px-3 py-1.5 bg-orange-50 border border-orange-200 text-[#E8720C] rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1"
              >
                <MapPin size={12} /> Auto-detect Location
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              {(["operator", "harvester"] as const).map((t) => (
                <button key={t} onClick={() => setReqType(t)} className={`flex-1 py-2 rounded-xl text-sm border-2 transition-all ${reqType === t ? "border-[#E8720C] bg-orange-50 text-[#E8720C]" : "border-[#E7E0D5] text-[#78716C]"}`}>
                  {t === "operator" ? "👨‍🌾 Need Operator" : "🚜 Need Harvester"}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {/* State Dropdown */}
              <div>
                <label className="text-xs text-[#78716C] block mb-1">State *</label>
                <select
                  value={newReq.state}
                  onChange={(e) => setNewReq(prev => ({ ...prev, state: e.target.value, location: "" }))}
                  className="w-full px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] bg-[#FDFAF4]"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label className="text-xs text-[#78716C] block mb-1">District / Location *</label>
                <select
                  value={newReq.location}
                  onChange={(e) => setNewReq(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!newReq.state}
                  className="w-full px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] bg-[#FDFAF4] disabled:opacity-50"
                >
                  <option value="">Select District</option>
                  {newReq.state &&
                    districtsData.states
                      .find((s) => s.state === newReq.state)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                </select>
              </div>

              {/* Other inputs */}
              <div>
                <label className="text-xs text-[#78716C] block mb-1">Machine Type *</label>
                <select
                  value={newReq.machineType}
                  onChange={(e) => setNewReq(prev => ({ ...prev, machineType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] bg-[#FDFAF4]"
                >
                  <option value="">Select Machine Type</option>
                  {MACHINE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#78716C] block mb-1">Duration (days)</label>
                  <input
                    type="number"
                    placeholder="Duration"
                    value={newReq.duration}
                    onChange={(e) => setNewReq(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#78716C] block mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={newReq.startDate}
                    onChange={(e) => setNewReq(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#78716C] block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe your requirement in detail..."
                  value={newReq.description}
                  onChange={(e) => setNewReq((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDialog(false)} className="flex-1 py-2.5 border border-[#E7E0D5] rounded-xl text-[#78716C] text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={postReq} className="flex-1 py-2.5 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Post Requirement →</button>
            </div>
          </motion.div>
        </div>
      )}


      {/* Confirm Delete */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E7E0D5]">
            <h3 className="text-lg text-[#1C1008] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Delete Requirement?</h3>
            <p className="text-[#78716C] text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-[#E7E0D5] rounded-xl text-sm">Cancel</button>
              <button onClick={() => deleteReq(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors">Delete</button>
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
        toast.success("Requirement deleted successfully!");
        navigate("/requests");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete requirement");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting requirement");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!req) return <EmptyState title="Requirement not found" />;

  const isOwner = currentUser && req.userId === currentUser.id;

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/requests" className="inline-flex items-center gap-2 text-[#78716C] text-sm mb-6 hover:text-[#E8720C]">
          <ArrowLeft size={16} /> Back to Requests
        </Link>
        <div className="bg-white rounded-2xl border border-[#E7E0D5] p-8 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-sm px-3 py-1 rounded-full border ${req.type === "operator" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-green-50 text-green-700 border-green-200"}`}>
              {req.type === "operator" ? "👨‍🌾 Need Operator" : "🚜 Need Harvester"}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full ${req.status === "Open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{req.status}</span>
            {isOwner && (
              <span className="text-sm px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold shadow-sm">My Requirement</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Location", value: req.location + (req.state ? `, ${req.state}` : "") },
              { label: "Machine Type", value: req.machineType },
              { label: "Duration", value: `${req.duration || '0'} days` },
              { label: "Start Date", value: new Date(req.startDate).toLocaleDateString() },
            ].map((item) => (
              <div key={item.label} className="bg-[#FDFAF4] rounded-xl p-3 border border-[#E7E0D5]">
                <p className="text-xs text-[#78716C] mb-1">{item.label}</p>
                <p className="text-sm text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
          </div>


          <div className="mb-6">
            <h3 className="text-[#1C1008] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Description</h3>
            <p className="text-[#78716C] text-sm leading-relaxed">{req.description || "No description provided."}</p>
          </div>

          <div className="h-px bg-[#E7E0D5] mb-6" />

          <div className="bg-[#FDFAF4] rounded-xl p-4 border border-[#E7E0D5] mb-4">
            <p className="text-sm text-[#78716C] mb-1">{isOwner ? "Posted by You" : "Posted by"}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center">
                <span className="text-white font-bold">{req.requesterName?.charAt(0) || 'U'}</span>
              </div>
              <div>
                <p className="text-[#1C1008] text-sm" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{req.requesterName}</p>
                <p className="text-xs text-[#78716C]">+91-{req.requesterPhone || 'XXXXXXXXXX'}</p>
              </div>
            </div>
          </div>

          {isOwner ? (
            <div className="space-y-2">
              <div className="text-center text-xs py-1.5 px-3 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold mb-2">
                This is your requirement
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Trash2 size={16} /> Delete Requirement
              </button>
            </div>
          ) : (
            <a
              href={`https://wa.me/91${req.requesterPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors flex items-center justify-center font-semibold text-center"
            >
              WhatsApp User →
            </a>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E7E0D5]">
            <h3 className="text-lg text-[#1C1008] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Delete Requirement?</h3>
            <p className="text-[#78716C] text-sm mb-4">Are you sure you want to delete this requirement? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-[#E7E0D5] rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors">Delete</button>
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
const CATEGORIES = ["All","Harvesting Tips","Machine Maintenance","Success Stories","Agri News","Weather & Season"];

export function Blogs() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const catParam = category === "All" ? "" : `category=${encodeURIComponent(category)}`;
        const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
        const params = [catParam, searchParam].filter(Boolean).join("&");
        const res = await fetch(`/api/blogs?${params}`);
        if (res.ok) {
          const data = await res.json();
          setBlogs(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(() => {
      fetchBlogs();
    }, 300);

    return () => clearTimeout(delay);
  }, [search, category]);

  const filtered = blogs;

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="public" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader title="Harvesting Knowledge 📚" subtitle="Tips, guides, and stories from the field" />

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-3 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] bg-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-all ${
                category === c ? "bg-[#E8720C] text-white border-[#E8720C]" : "bg-white border-[#E7E0D5] text-[#78716C] hover:border-orange-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No articles found" description="Try a different search term or category." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b) => <BlogCard key={b.id} {...b} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================
// BLOG DETAIL
// ===========================
export function BlogDetail() {
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
  if (!blog) return <EmptyState title="Blog not found" />;

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="public" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <nav className="text-sm text-[#78716C] mb-6 flex items-center gap-2">
          <Link to="/blogs" className="hover:text-[#E8720C]">Blogs</Link>
          <ChevronRight size={14} />
          <span className="text-[#E8720C]">{blog.category}</span>
          <ChevronRight size={14} />
          <span className="truncate">{blog.title}</span>
        </nav>

        <div className="h-64 bg-gradient-to-br from-green-50 to-orange-50 rounded-2xl flex items-center justify-center mb-8 border border-[#E7E0D5]">
          <BookOpen size={64} className="text-orange-300" />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">{blog.category}</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm text-[#78716C]">Agri Team</span>
          </div>
          <span className="text-sm text-[#78716C]">{blog.date}</span>
        </div>

        <h1
          className="text-4xl text-[#1C1008] mb-6 leading-tight"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          {blog.title}
        </h1>

        <div className="prose prose-sm max-w-none text-[#78716C] leading-relaxed space-y-4">
          <p className="font-semibold text-lg">{blog.short_description || blog.shortDescription}</p>
          <div className="w-full h-px bg-[#E7E0D5] my-4" />
          <p>{blog.content || "Full article text is loading..."}</p>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-[#E7E0D5] p-5">
          <p className="text-xs text-[#78716C] mb-3">About the Author</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div>
              <p className="text-[#1C1008] text-sm" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Tractor Seva Agri Team</p>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Agriculture Expert</span>
            </div>
          </div>
        </div>

        {relatedBlogs.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl text-[#1C1008] mb-5" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Related Articles</h3>
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
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [operatorProfile, setOperatorProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("tractorsewa_token");
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

        if (userData.role === "operator" || userData.role === "both") {
          const opRes = await fetch(`/api/operators?userId=${userData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (opRes.ok) {
            const opData = await opRes.json();
            if (opData.length > 0) {
              setOperatorProfile(opData[0]);
            }
          }
        }

        const harvsRes = await fetch(`/api/harvesters`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (harvsRes.ok) {
          const harvsData = await harvsRes.json();
          setHarvesters(harvsData.filter((h: any) => h.ownerName === userData.name));
        }

        const reqsRes = await fetch(`/api/requests?userId=me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          setRequests(reqsData);
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
  if (!user) return <EmptyState title="Profile not found" />;

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="relative">
        <div className="h-52 bg-gradient-to-r from-[#E8720C] to-[#15803D] rounded-b-3xl overflow-hidden">
          <WheatWatermark className="right-10 top-0 opacity-[0.06]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden">
              <span className="text-white text-3xl font-bold">{user.name?.charAt(0)}</span>
            </div>
            <div className="pb-2 flex-1">
              <h1 className="text-2xl text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>{user.name}</h1>
              <p className="text-[#78716C] text-sm flex items-center gap-1"><MapPin size={13} /> {user.state || "India"}</p>
            </div>
            <Link to="/profile/edit" className="pb-2">
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#E8720C] text-[#E8720C] rounded-xl text-sm hover:bg-orange-50 transition-colors">
                <Pencil size={14} /> Edit Profile
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-sm uppercase font-semibold text-xs tracking-wider">Role: {user.role}</span>
            <AvailabilityBadge status="Available" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: `${user.stats?.harvesters || 0}`, label: "Harvesters Listed" },
              { value: `${user.stats?.operators || 0}`, label: "Operator Profiles" },
              { value: `${user.stats?.requests || 0}`, label: "Requests Posted" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
                <p className="text-[#E8720C] text-2xl" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>{s.value}</p>
                <p className="text-xs text-[#78716C]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                <h3 className="text-[#1C1008] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Contact Details</h3>
                <p className="text-sm text-[#78716C]"><strong>Phone:</strong> +91-{user.phone}</p>
                <p className="text-sm text-[#78716C] mt-1"><strong>Email:</strong> {user.email}</p>
              </div>

              {operatorProfile && (
                <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                  <h3 className="text-[#1C1008] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Operator Profile</h3>
                  <div className="space-y-2 text-sm text-[#78716C]">
                    <p><strong>Experience:</strong> {operatorProfile.experience} years</p>
                    <p className="flex items-center gap-2"><strong>Availability:</strong> <AvailabilityBadge status={operatorProfile.availability} /></p>
                    <p><strong>WhatsApp:</strong> +91-{operatorProfile.whatsapp || user.phone}</p>
                    <p><strong>Machine Expertise:</strong> {operatorProfile.machineExpertise && operatorProfile.machineExpertise.length > 0 ? operatorProfile.machineExpertise.join(", ") : "None specified"}</p>
                    {operatorProfile.description && <p><strong>Description:</strong> {operatorProfile.description}</p>}
                  </div>
                </div>
              )}

              {harvesters.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                  <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>My Harvesters</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {harvesters.map((h) => (
                      <HarvesterCard key={h.id} {...h} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
                <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Settings</h3>
                <div className="space-y-2">
                  <Link to="/profile/edit" className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-orange-50 transition-colors text-sm text-[#78716C] hover:text-[#E8720C]">
                    <span>Edit Profile</span><ChevronRight size={16} />
                  </Link>
                  <div className="h-px bg-[#E7E0D5]" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-red-50 transition-colors text-sm text-red-500"
                  >
                    <span>Logout</span><ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================
// MESSAGES
// ===========================
export function Messages() {
  const [chatPartners, setChatPartners] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData);
        }

        const partnersRes = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (partnersRes.ok) {
          const partnersData = await partnersRes.json();
          setChatPartners(partnersData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

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
              role: active.role,
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

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader title="Messages 💬" />
        <div className="bg-white rounded-2xl border border-[#E7E0D5] overflow-hidden shadow-[0_2px_16px_rgba(232,114,12,0.06)] flex" style={{ height: "60vh" }}>
          {/* Sidebar */}
          <div className={`w-full md:w-72 border-r border-[#E7E0D5] flex-shrink-0 overflow-y-auto ${active ? "hidden md:block" : ""}`}>
            {loading ? (
              <div className="p-4 text-center text-sm text-[#78716C]">Loading conversations...</div>
            ) : chatPartners.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#78716C]">No conversations yet.</div>
            ) : (
              chatPartners.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActive(m)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors border-b border-[#E7E0D5] text-left ${active?.id === m.id ? "bg-orange-50" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{m.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{m.name}</p>
                      <span className="text-xs text-[#78716C]">{m.lastMessageTime ? new Date(m.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
                    </div>
                    <p className="text-xs text-[#78716C] truncate">{m.lastMessage || "No messages yet"}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat area */}
          {active ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-[#E7E0D5] flex items-center gap-3">
                <button className="md:hidden text-[#78716C] hover:text-[#E8720C]" onClick={() => setActive(null)}>
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{active.name?.charAt(0)}</span>
                </div>
                <p className="text-sm text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{active.name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chat.map((msg, i) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : ""}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-[#E8720C] text-white" : "bg-[#FDFAF4] border border-[#E7E0D5] text-[#1C1008]"}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-[#E7E0D5] flex gap-3">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
                />
                <button onClick={sendMsg} className="px-4 py-2.5 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center text-[#78716C]">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3 text-orange-200" />
                <p>Select a conversation to start chatting</p>
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
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
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

          if (data.role === "operator" || data.role === "both") {
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
    setSaving(true);
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const body: any = { name, state, phone };
      if (operatorProfile) {
        body.location = location;
        body.experience = parseInt(experience) || 0;
        body.machineExpertise = selectedMachines;
        body.availability = availability;
        body.description = description;
        body.whatsapp = whatsapp;
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
        toast.success("Profile updated successfully!");
        navigate("/profile");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/profile" className="inline-flex items-center gap-2 text-[#78716C] text-sm mb-6 hover:text-[#E8720C]">
          <ArrowLeft size={16} /> Back to Profile
        </Link>
        <PageHeader title="Edit Profile ✎" />
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E7E0D5] p-8 space-y-5 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
          <div>
            <label className="text-sm text-[#78716C] block mb-1.5">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
          </div>
          <div>
            <label className="text-sm text-[#78716C] block mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
          </div>
          <div>
            <label className="text-sm text-[#78716C] block mb-1.5">State</label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setLocation("");
              }}
              className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {operatorProfile && (
            <div>
              <label className="text-sm text-[#78716C] block mb-1.5">District / City *</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={!state}
                className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] disabled:opacity-50"
              >
                <option value="">Select District</option>
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
              <div className="h-px bg-[#E7E0D5] my-6" />
              <h3 className="text-[#1C1008] text-base font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>Operator Profile Details</h3>
              
              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">WhatsApp Number</label>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
              </div>

              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">Experience (Years)</label>
                <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} required className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
              </div>

              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">Availability Status</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-[#78716C] block mb-2">Machine Expertise</label>
                <div className="grid grid-cols-2 gap-2">
                  {MACHINE_TYPES.map((m) => {
                    const isChecked = selectedMachines.includes(m);
                    return (
                      <label key={m} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors text-xs ${
                        isChecked ? "border-[#E8720C] bg-orange-50 text-[#E8720C]" : "border-[#E7E0D5] bg-white text-[#78716C] hover:border-orange-200"
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
                        {m}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">Operator Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] resize-none" />
              </div>
            </>
          )}

          <button type="submit" disabled={saving} className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===========================
// ADMIN CONTROL PORTAL
// ===========================
export function AdminPortal() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalOperators: 0, totalHarvesters: 0, totalRequests: 0, blockedUsers: 0 });
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  // NL query states
  const [nlQuery, setNlQuery] = useState("");
  const [parsedFilter, setParsedFilter] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Users listing states
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // CSV bulk states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [defaultPassword, setDefaultPassword] = useState("Welcome123");
  const [csvReport, setCsvReport] = useState<any>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  // Moderator listings
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  // Confirmation modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'block' | 'unblock' | 'wipe' | 'deleteHarv' | 'deleteReq'>('block');
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

  const refreshAllData = () => {
    fetchStats();
    fetchAllUsers();
    fetchHarvesters();
    fetchRequests();
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

  const handleNlSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users/query?q=${encodeURIComponent(nlQuery)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setParsedFilter(data.parsed);
        setSearchResults(data.results);
      } else {
        toast.error("Failed to parse natural language search");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error executing English search query");
    } finally {
      setSearching(false);
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
          toast.success("User blocked successfully!");
          refreshAllData();
          if (nlQuery) handleNlSearch({ preventDefault: () => {} } as any);
        } else {
          toast.error("Failed to block user");
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
          toast.success("User unblocked successfully!");
          refreshAllData();
          if (nlQuery) handleNlSearch({ preventDefault: () => {} } as any);
        } else {
          toast.error("Failed to unblock user");
        }
      } else if (confirmType === 'wipe') {
        const res = await fetch(`/api/admin/users/${confirmTargetId}/data`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success("Cleared entire user posts/data and blocked user successfully.");
          refreshAllData();
          if (nlQuery) handleNlSearch({ preventDefault: () => {} } as any);
        } else {
          toast.error("Failed to wipe user data");
        }
      } else if (confirmType === 'deleteHarv') {
        const res = await fetch(`/api/admin/harvesters/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success("Harvester listing deleted successfully.");
          refreshAllData();
        } else {
          toast.error("Failed to delete machine listing");
        }
      } else if (confirmType === 'deleteReq') {
        const res = await fetch(`/api/admin/requests/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success("Crop requirement deleted successfully.");
          refreshAllData();
        } else {
          toast.error("Failed to delete crop request");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error executing administrative operation");
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error("Select a valid CSV file first.");
      return;
    }

    setUploadingCsv(true);
    setCsvReport(null);

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("defaultPassword", defaultPassword);

    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("CSV user registration completed successfully.");
        setCsvReport(data);
        setCsvFile(null);
        refreshAllData();
      } else {
        toast.error(data.error || "Error uploading user data file.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error during CSV upload execution");
    } finally {
      setUploadingCsv(false);
    }
  };

  const openConfirmModal = (type: 'block' | 'unblock' | 'wipe' | 'deleteHarv' | 'deleteReq', id: string, name: string) => {
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200">
      <Navbar variant="auth" />

      {/* Admin Title Banner */}
      <div className="bg-[#1E293B] border-b border-slate-700 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-orange-500" style={{ fontFamily: "'Sora', sans-serif" }}>
              Admin Control Center ⚙️
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage system operators, harvesters, and listings parameters.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full">
              System Admin Role
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 mb-8 overflow-x-auto gap-1">
          {[
            { id: "dashboard", label: "Overview & Users" },
            { id: "nlSearch", label: "NL English Search" },
            { id: "csvImport", label: "CSV Bulk Import" },
            { id: "harvesters", label: "Machines Moderation" },
            { id: "requests", label: "Requests Moderation" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-400 bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================================== */}
        {/* TAB 1: OVERVIEW & USERS LIST       */}
        {/* ================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
                { label: "Listed Operators", value: stats.totalOperators, color: "text-green-400" },
                { label: "Listed Machines", value: stats.totalHarvesters, color: "text-orange-400" },
                { label: "Crop Requirements", value: stats.totalRequests, color: "text-amber-400" },
                { label: "Blocked Accounts", value: stats.blockedUsers, color: "text-red-400" }
              ].map((card, i) => (
                <div key={i} className="bg-[#1E293B] border border-slate-700/60 p-5 rounded-2xl">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.color}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Users list panel */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-white">Registered Users Account Directory</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3.5">Name</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Phone</th>
                      <th className="px-6 py-3.5">State</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Listings Count</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">{user.phone || "-"}</td>
                          <td className="px-6 py-4">{user.state || "-"}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold capitalize bg-slate-700 px-2.5 py-0.5 rounded-full">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-400">
                              Harvesters: {user.harvesterCount} | Requests: {user.requestCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {user.is_blocked ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400">
                                Blocked
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                user.is_blocked
                                  ? "bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30"
                                  : "bg-amber-600/20 text-amber-400 border border-amber-600/30 hover:bg-amber-600/30"
                              }`}
                            >
                              {user.is_blocked ? "Unblock" : "Block"}
                            </button>
                            <button
                              onClick={() => openConfirmModal("wipe", user.id, user.name)}
                              className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs font-semibold hover:bg-red-600/30 transition"
                            >
                              Wipe Data & Block
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
        {/* TAB 2: NL ENGLISH SEARCH           */}
        {/* ================================== */}
        {activeTab === "nlSearch" && (
          <div className="space-y-6">
            <div className="bg-[#1E293B] border border-slate-700 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-2">English Query User Search</h3>
              <p className="text-slate-400 text-sm mb-4">
                Type search parameters in natural English. The system automatically extracts name patterns and locations. E.g. *"Show users from Punjab named Rajesh"* or *"Maharashtra Pune operators"*
              </p>
              
              <form onSubmit={handleNlSearch} className="flex gap-2">
                <input
                  type="text"
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  placeholder="e.g. Find users in Maharashtra named Vikram"
                  required
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
                >
                  {searching ? "Searching..." : "Parse & Search"}
                </button>
              </form>
            </div>

            {/* Parsed Output Details */}
            {parsedFilter && (
              <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl flex gap-6 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">Detected Name</span>
                  <span className="text-white font-medium mt-0.5 block">{parsedFilter.name || "None"}</span>
                </div>
                <div className="border-l border-slate-700 pl-6">
                  <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">Detected State</span>
                  <span className="text-white font-medium mt-0.5 block">{parsedFilter.state || "None"}</span>
                </div>
                <div className="border-l border-slate-700 pl-6">
                  <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">Detected District</span>
                  <span className="text-white font-medium mt-0.5 block">{parsedFilter.district || "None"}</span>
                </div>
              </div>
            )}

            {/* Results Table */}
            {nlQuery && (
              <div className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h4 className="text-sm font-semibold text-white">Search Results ({searchResults.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Phone</th>
                        <th className="px-6 py-3.5">State</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">{user.phone || "-"}</td>
                            <td className="px-6 py-4">{user.state || "-"}</td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-semibold capitalize bg-slate-700 px-2.5 py-0.5 rounded-full">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {user.is_blocked ? (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400">
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
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
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                  user.is_blocked
                                    ? "bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30"
                                    : "bg-amber-600/20 text-amber-400 border border-amber-600/30 hover:bg-amber-600/30"
                                }`}
                              >
                                {user.is_blocked ? "Unblock" : "Block"}
                              </button>
                              <button
                                onClick={() => openConfirmModal("wipe", user.id, user.name)}
                                className="px-2.5 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs font-semibold hover:bg-red-600/30 transition"
                              >
                                Wipe Data
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            No records found. Try simplifying your query tags.
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
        {/* TAB 3: CSV BULK IMPORT             */}
        {/* ================================== */}
        {activeTab === "csvImport" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload form card */}
            <div className="bg-[#1E293B] border border-slate-700 p-6 rounded-2xl shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Bulk Import Users</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Upload a standard CSV file to instantly register users on the network and auto-provision operator profiles.
                </p>
              </div>

              <form onSubmit={handleCsvUpload} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">CSV File Selection</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Assigned Default Password</label>
                  <input
                    type="text"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Welcome123"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingCsv}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingCsv ? "Processing CSV..." : "Process Bulk Upload"}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-400">Format Verification Checklist</span>
                <a
                  href="/sample_users.csv"
                  download="sample_users.csv"
                  className="text-orange-400 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Download Sample CSV 📥
                </a>
              </div>
            </div>

            {/* Results Report card */}
            <div className="bg-[#1E293B] border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Bulk Import Operations Report</h3>
                
                {csvReport ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-center">
                        <span className="text-slate-400 text-xs block">Success Count</span>
                        <span className="text-2xl font-bold text-green-400 mt-1 block">{csvReport.successCount}</span>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
                        <span className="text-slate-400 text-xs block">Failed Count</span>
                        <span className="text-2xl font-bold text-red-400 mt-1 block">{csvReport.failedCount}</span>
                      </div>
                    </div>

                    {csvReport.errors && csvReport.errors.length > 0 && (
                      <div>
                        <span className="text-xs text-red-400 font-semibold block mb-2">Row-by-Row Upload Failures:</span>
                        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl max-h-48 overflow-y-auto text-xs font-mono space-y-1.5 text-slate-400">
                          {csvReport.errors.map((err: string, i: number) => (
                            <div key={i} className="text-red-300">⚠️ {err}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm text-center py-12 border-2 border-dashed border-slate-700/60 rounded-2xl">
                    Upload a CSV file and run parser to generate imports report here.
                  </div>
                )}
              </div>
              
              <div className="bg-slate-800/40 p-4 rounded-xl text-xs text-slate-400 border border-slate-700/40 mt-4">
                <strong>CSV Template Structure:</strong><br />
                Columns must be named exactly: <code className="text-orange-400 font-mono">name,email,phone,state,role</code>.<br />
                Valid roles are: <code className="text-slate-300 font-mono">operator</code>, <code className="text-slate-300 font-mono">harvester</code>, or <code className="text-slate-300 font-mono">both</code>.
              </div>
            </div>
          </div>
        )}

        {/* ================================== */}
        {/* TAB 4: MACHINES MODERATION         */}
        {/* ================================== */}
        {activeTab === "harvesters" && (
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Active Machine Listings ({harvesters.length})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3.5">Machine Details</th>
                    <th className="px-6 py-3.5">Manufacturer</th>
                    <th className="px-6 py-3.5">Model</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Listed Owner</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {harvesters.length > 0 ? (
                    harvesters.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{h.machineName}</td>
                        <td className="px-6 py-4">{h.company}</td>
                        <td className="px-6 py-4">{h.model}</td>
                        <td className="px-6 py-4">{h.location}, {h.state}</td>
                        <td className="px-6 py-4">{h.ownerName}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openConfirmModal("deleteHarv", h.id, h.machineName)}
                            className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs font-semibold hover:bg-red-600/30 transition"
                          >
                            Remove Listing
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
        {/* TAB 5: REQUESTS MODERATION         */}
        {/* ================================== */}
        {activeTab === "requests" && (
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Posted Crop Requirements ({requests.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3.5">Crop Type</th>
                    <th className="px-6 py-3.5">Listing Category</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5">Date Added</th>
                    <th className="px-6 py-3.5">Requester</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {requests.length > 0 ? (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{r.machineType}</td>
                        <td className="px-6 py-4 capitalize">{r.type}</td>
                        <td className="px-6 py-4">{r.location}, {r.state}</td>
                        <td className="px-6 py-4">{r.duration || "Not specified"}</td>
                        <td className="px-6 py-4">
                          {r.startDate ? new Date(r.startDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4">{r.requesterName}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openConfirmModal("deleteReq", r.id, `${r.machineType} requirement`)}
                            className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs font-semibold hover:bg-red-600/30 transition"
                          >
                            Delete Request
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No posted crop requirements in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 max-w-md w-full rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Administrative Action Confirmation</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Are you absolutely sure you want to proceed?
                  {confirmType === 'block' && ` This will prevent "${confirmTargetName}" from logging into the website.`}
                  {confirmType === 'unblock' && ` This will restore account access privileges for "${confirmTargetName}".`}
                  {confirmType === 'wipe' && ` This will permanently delete all machine listings, requests, and profiles owned by "${confirmTargetName}", and block the user.`}
                  {confirmType === 'deleteHarv' && ` This will permanently delete listing "${confirmTargetName}".`}
                  {confirmType === 'deleteReq' && ` This will permanently remove request "${confirmTargetName}".`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

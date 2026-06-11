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
  MOCK_OPERATORS,
  MOCK_HARVESTERS,
  MOCK_BLOGS,
} from "./shared";
import { toast } from "sonner";

const INDIAN_STATES = [
  "Andhra Pradesh","Bihar","Chhattisgarh","Gujarat","Haryana","Himachal Pradesh",
  "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Odisha",
  "Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","Uttarakhand","West Bengal",
];
const MACHINE_TYPES = ["Combine Harvester","Rice Harvester","Wheat Harvester","Maize Harvester","Sugarcane Harvester","Paddy Harvester"];
const COMPANIES = ["John Deere","Claas","Mahindra","New Holland","AGCO","Preet","Sonalika","Other"];

// ===========================
// EXPLORE HARVESTERS
// ===========================
export function ExploreHarvesters() {
  const [harvesters, setHarvesters] = useState<typeof MOCK_HARVESTERS>([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      setHarvesters(MOCK_HARVESTERS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = harvesters.filter(
    (h) =>
      (!search || h.machineName.toLowerCase().includes(search.toLowerCase()) || h.ownerName.toLowerCase().includes(search.toLowerCase())) &&
      (!location || h.location.toLowerCase().includes(location.toLowerCase())) &&
      (!company || h.company === company)
  );

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

        <div className="bg-white rounded-2xl p-4 border border-[#E7E0D5] shadow-sm mb-8">
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
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location..."
                className="pl-9 pr-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] w-full md:w-40"
              />
            </div>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]"
            >
              <option value="">All Companies</option>
              {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {(search || location || company) && (
              <button onClick={() => { setSearch(""); setLocation(""); setCompany(""); }} className="text-[#E8720C] text-sm px-3">
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
          <EmptyState
            title="No harvesters found"
            description="Try adjusting your filters or be the first to list a machine in this area."
            actionLabel="List Your Machine"
            onAction={() => navigate("/add-harvester")}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((h) => <HarvesterCard key={h.id} {...h} />)}
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
  const harvester = MOCK_HARVESTERS.find((h) => String(h.id) === id) || MOCK_HARVESTERS[0];

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/harvesters" className="inline-flex items-center gap-2 text-[#78716C] text-sm mb-6 hover:text-[#E8720C]">
          <ArrowLeft size={16} /> Back to Harvesters
        </Link>

        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl aspect-video flex items-center justify-center mb-6 relative overflow-hidden border border-[#E7E0D5]">
          <TractorIllustration size={200} />
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
                This {harvester.company} {harvester.model} is well-maintained and suitable for harvesting wheat, rice, and other Rabi/Kharif crops. Available for seasonal hire with experienced operator on request.
              </p>
            </div>
          </div>

          {/* Owner Card */}
          <div>
            <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)]">
              <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Machine Owner</h3>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center ring-2 ring-orange-200">
                  <span className="text-white font-bold">{harvester.ownerName.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{harvester.ownerName}</p>
                  <p className="text-xs text-[#78716C] flex items-center gap-1"><Phone size={11} /> +91-{harvester.phone}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare size={16} /> WhatsApp Owner
                </button>
                <button
                  onClick={() => toast.success("Message sent!")}
                  className="w-full py-2.5 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors"
                >
                  Message Owner
                </button>
                <Link to={`/operators/1`} className="block text-center text-sm text-[#E8720C] hover:underline mt-2">
                  View Owner Profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================
// EXPLORE OPERATORS
// ===========================
export function ExploreOperators() {
  const [operators, setOperators] = useState<typeof MOCK_OPERATORS>([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      setOperators(MOCK_OPERATORS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = operators.filter(
    (op) =>
      (!search || op.name.toLowerCase().includes(search.toLowerCase())) &&
      (!location || op.location.toLowerCase().includes(location.toLowerCase())) &&
      (!availability || op.availability === availability)
  );

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
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location..."
                className="pl-9 pr-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] w-full md:w-40"
              />
            </div>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]"
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Not Available">Not Available</option>
            </select>
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
            {filtered.map((op) => <OperatorCard key={op.id} {...op} />)}
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
  const operator = MOCK_OPERATORS.find((op) => String(op.id) === id) || MOCK_OPERATORS[0];

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-[#E8720C] via-[#D97706] to-[#15803D] rounded-b-3xl overflow-hidden">
          <WheatWatermark className="right-10 top-0 opacity-[0.06]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center ring-4 ring-white shadow-lg">
              <span className="text-white text-3xl font-bold">{operator.name.charAt(0)}</span>
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
                  { value: `${operator.machineExpertise.length}`, label: "Machine Types" },
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
                  Experienced harvester operator with {operator.experience}+ years in agricultural machinery operation. Skilled in operating combine harvesters, rice harvesters, and wheat harvesters across multiple states in India.
                </p>
              </div>

              {/* Machine Expertise */}
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                <h3 className="text-[#1C1008] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Machine Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {operator.machineExpertise.map((m) => (
                    <span key={m} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact card */}
            <div>
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.08)]">
                <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Contact Operator</h3>
                <p className="text-sm text-[#78716C] mb-4 flex items-center gap-2">
                  <Phone size={14} /> +91-{operator.phone}
                </p>
                <div className="space-y-2">
                  <button className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> WhatsApp
                  </button>
                  <button
                    onClick={() => toast.success("Message sent to " + operator.name)}
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
        <button
          onClick={() => toast.success("Message sent!")}
          className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
        >
          Contact Operator
        </button>
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleMachine = (m: string) => {
    setSelectedMachines((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Profile created successfully!");
    navigate("/dashboard");
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
              <div className="border-2 border-dashed border-[#E8720C] rounded-2xl bg-orange-50 py-10 text-center cursor-pointer hover:bg-orange-100 transition-colors">
                <Upload size={32} className="text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-[#78716C]">Drop your photo here or click to upload</p>
              </div>
              {[
                { label: "Full Name", value: name, onChange: setName, icon: <User size={16} />, placeholder: "Your full name" },
                { label: "Experience (years)", value: experience, onChange: setExperience, icon: <Award size={16} />, placeholder: "e.g. 5", type: "number" },
                { label: "Location / District", value: location, onChange: setLocation, icon: <MapPin size={16} />, placeholder: "e.g. Ludhiana" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-sm text-[#78716C] block mb-1.5">{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]">{f.icon}</span>
                    <input
                      type={f.type || "text"}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-sm text-[#78716C] block mb-1.5">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                onClick={() => setStep(2)}
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
                <button onClick={() => setStep(1)} className="flex-1 py-3 border-2 border-[#E7E0D5] text-[#78716C] rounded-xl hover:border-[#E8720C] hover:text-[#E8720C] transition-colors">← Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Next →</button>
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Harvester listed successfully!");
    navigate("/harvesters");
  };

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader title="List Your Harvester 🚜" subtitle="Add your machine to reach thousands of farmers" />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.06)] p-8 space-y-5">
          <div className="border-2 border-dashed border-[#E8720C] rounded-2xl bg-orange-50 py-10 text-center cursor-pointer hover:bg-orange-100 transition-colors">
            <Upload size={32} className="text-orange-400 mx-auto mb-2" />
            <p className="text-sm text-[#78716C]">Upload machine photo</p>
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
              <label className="text-sm text-[#78716C] block mb-1.5">Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="District" className="w-full pl-9 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#78716C] block mb-1.5">State</label>
            <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C]">
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-[#78716C] block mb-1.5">Phone</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">+91</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="w-full pl-16 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
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
const MOCK_REQUESTS = [
  { id: 1, type: "operator", location: "Ludhiana, Punjab", machineType: "Combine Harvester", duration: "14", startDate: "2025-10-01", status: "Open", description: "Need experienced operator for wheat harvesting." },
  { id: 2, type: "harvester", location: "Nashik, Maharashtra", machineType: "Rice Harvester", duration: "7", startDate: "2025-11-15", status: "Open", description: "Need rice harvester on rent for Kharif season." },
  { id: 3, type: "operator", location: "Bhopal, MP", machineType: "Maize Harvester", duration: "10", startDate: "2025-09-20", status: "Closed", description: "Maize harvesting in Vidisha district." },
];

export function Requests() {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [showDialog, setShowDialog] = useState(false);
  const [reqType, setReqType] = useState<"operator" | "harvester">("operator");
  const [tab, setTab] = useState<"operator" | "harvester">("operator");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [newReq, setNewReq] = useState({ location: "", machineType: "", duration: "", startDate: "", description: "" });

  const postReq = () => {
    setRequests((prev) => [
      ...prev,
      { id: Date.now(), type: reqType, status: "Open", ...newReq },
    ]);
    setShowDialog(false);
    toast.success("Requirement posted successfully!");
  };

  const deleteReq = (id: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setConfirmDelete(null);
    toast.success("Requirement deleted.");
  };

  const filtered = requests.filter((r) => r.type === tab);

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader
          title="My Requirements 📋"
          action={
            <button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8720C] text-white rounded-xl text-sm hover:bg-[#C9610A] transition-colors"
            >
              <Plus size={16} /> Post Requirement
            </button>
          }
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
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

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <EmptyState title="No requirements posted" description="Post your first requirement to find operators or harvesters." />
          ) : (
            filtered.map((req) => (
              <div key={req.id} className={`bg-white rounded-2xl border border-[#E7E0D5] p-5 flex gap-4 items-start shadow-[0_2px_16px_rgba(232,114,12,0.06)] border-l-4 ${req.type === "operator" ? "border-l-[#E8720C]" : "border-l-[#15803D]"}`}>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${req.type === "operator" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                      {req.type === "operator" ? "👨‍🌾 Need Operator" : "🚜 Need Harvester"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${req.status === "Open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[#78716C]">
                    <span className="flex items-center gap-1"><MapPin size={13} /> {req.location}</span>
                    <span>{req.machineType}</span>
                    <span>{req.duration} days</span>
                    <span>{req.startDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/requests/${req.id}`} className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                    View
                  </Link>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#78716C]"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmDelete(req.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Post Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-lg border border-[#E7E0D5]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>Post a Requirement</h3>
            <div className="flex gap-2 mb-4">
              {(["operator", "harvester"] as const).map((t) => (
                <button key={t} onClick={() => setReqType(t)} className={`flex-1 py-2 rounded-xl text-sm border-2 transition-all ${reqType === t ? "border-[#E8720C] bg-orange-50 text-[#E8720C]" : "border-[#E7E0D5] text-[#78716C]"}`}>
                  {t === "operator" ? "👨‍🌾 Need Operator" : "🚜 Need Harvester"}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { key: "location", placeholder: "Location", icon: <MapPin size={14} /> },
                { key: "machineType", placeholder: "Machine Type" },
                { key: "duration", placeholder: "Duration (days)", type: "number" },
                { key: "startDate", placeholder: "Start Date", type: "date" },
              ].map((f) => (
                <div key={f.key} className={f.icon ? "relative" : ""}>
                  {f.icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]">{f.icon}</span>}
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={(newReq as Record<string, string>)[f.key]}
                    onChange={(e) => setNewReq((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className={`w-full ${f.icon ? "pl-9" : "px-4"} pr-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]`}
                  />
                </div>
              ))}
              <textarea
                rows={2}
                placeholder="Description..."
                value={newReq.description}
                onChange={(e) => setNewReq((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] resize-none"
              />
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
  const req = MOCK_REQUESTS.find((r) => String(r.id) === id) || MOCK_REQUESTS[0];

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
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Location", value: req.location },
              { label: "Machine Type", value: req.machineType },
              { label: "Duration", value: `${req.duration} days` },
              { label: "Start Date", value: req.startDate },
            ].map((item) => (
              <div key={item.label} className="bg-[#FDFAF4] rounded-xl p-3 border border-[#E7E0D5]">
                <p className="text-xs text-[#78716C] mb-1">{item.label}</p>
                <p className="text-sm text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-[#1C1008] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Description</h3>
            <p className="text-[#78716C] text-sm leading-relaxed">{req.description}</p>
          </div>

          <div className="h-px bg-[#E7E0D5] mb-6" />

          <div className="bg-[#FDFAF4] rounded-xl p-4 border border-[#E7E0D5] mb-4">
            <p className="text-sm text-[#78716C] mb-1">Posted by</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <div>
                <p className="text-[#1C1008] text-sm" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Rajesh Kumar</p>
                <p className="text-xs text-[#78716C]">+91-98765XXXXX</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => toast.success("Message sent!")}
            className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            Message User →
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================
// BLOGS
// ===========================
const CATEGORIES = ["All","Harvesting Tips","Machine Maintenance","Success Stories","Agri News","Weather & Season"];

export function Blogs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = MOCK_BLOGS.filter(
    (b) =>
      (category === "All" || b.category === category) &&
      (!search || b.title.toLowerCase().includes(search.toLowerCase()))
  );

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
  const blog = MOCK_BLOGS.find((b) => String(b.id) === id) || MOCK_BLOGS[0];

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
          <p>{blog.shortDescription}</p>
          <p>
            India's agricultural sector relies heavily on timely harvesting to ensure crop quality and yield. With the advent of modern machinery, farmers can now complete harvest operations much faster than traditional methods allowed.
          </p>
          <h2 className="text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Key Takeaways</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Regular maintenance extends machine life by 30-40%</li>
            <li>Proper operator training reduces fuel consumption</li>
            <li>Seasonal preparation is critical for uptime during harvest</li>
            <li>Digital platforms reduce time to find operators by 70%</li>
          </ul>
          <p>
            Platforms like Tractor Seva are revolutionizing how farmers and operators connect across India, making it easier than ever to find the right machinery and skills for each harvest season.
          </p>
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

        <div className="mt-10">
          <h3 className="text-xl text-[#1C1008] mb-5" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Related Articles</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {MOCK_BLOGS.filter((b) => String(b.id) !== id).slice(0, 3).map((b) => (
              <BlogCard key={b.id} {...b} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================
// PROFILE
// ===========================
export function Profile() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("tractorsewa_token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="relative">
        <div className="h-52 bg-gradient-to-r from-[#E8720C] to-[#15803D] rounded-b-3xl overflow-hidden">
          <WheatWatermark className="right-10 top-0 opacity-[0.06]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center ring-4 ring-white shadow-lg">
              <span className="text-white text-3xl font-bold">R</span>
            </div>
            <div className="pb-2 flex-1">
              <h1 className="text-2xl text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>Rajesh Kumar</h1>
              <p className="text-[#78716C] text-sm flex items-center gap-1"><MapPin size={13} /> Ludhiana, Punjab</p>
            </div>
            <Link to="/profile/edit" className="pb-2">
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#E8720C] text-[#E8720C] rounded-xl text-sm hover:bg-orange-50 transition-colors">
                <Pencil size={14} /> Edit Profile
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-sm">🚜 Harvester Owner</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">👨‍🌾 Operator</span>
            <AvailabilityBadge status="Available" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: "2", label: "Harvesters Listed" },
              { value: "1", label: "Operator Profiles" },
              { value: "3", label: "Requests Posted" },
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
                <h3 className="text-[#1C1008] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>About</h3>
                <p className="text-[#78716C] text-sm leading-relaxed">Experienced farmer and harvester owner from Punjab. Managing 2 machines across wheat and rice harvesting seasons.</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6">
                <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>My Harvesters</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {MOCK_HARVESTERS.slice(0, 2).map((h) => (
                    <HarvesterCard key={h.id} {...h} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl border border-[#E7E0D5] p-6 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
                <h3 className="text-[#1C1008] mb-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>Settings</h3>
                <div className="space-y-2">
                  <Link to="/profile/edit" className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-orange-50 transition-colors text-sm text-[#78716C] hover:text-[#E8720C]">
                    <span>Edit Profile</span><ChevronRight size={16} />
                  </Link>
                  <button className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-orange-50 transition-colors text-sm text-[#78716C] hover:text-[#E8720C]">
                    <span>Change Password</span><ChevronRight size={16} />
                  </button>
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
const MOCK_MESSAGES = [
  { id: 1, name: "Rajesh Kumar", lastMsg: "Can you come to Ludhiana next week?", time: "2 min", unread: 2 },
  { id: 2, name: "Suresh Patel", lastMsg: "Yes I have sugarcane harvester available.", time: "1 hr", unread: 0 },
  { id: 3, name: "Mohan Singh", lastMsg: "Rate is ₹2500 per day including fuel.", time: "Yesterday", unread: 1 },
];

export function Messages() {
  const [active, setActive] = useState<null | typeof MOCK_MESSAGES[0]>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    { from: "them", text: "Hello, is the machine available in October?" },
    { from: "me", text: "Yes, it will be available from Oct 5th." },
    { from: "them", text: "Great! What's the daily rate?" },
  ]);

  const sendMsg = () => {
    if (!message.trim()) return;
    setChat((prev) => [...prev, { from: "me", text: message }]);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader title="Messages 💬" />
        <div className="bg-white rounded-2xl border border-[#E7E0D5] overflow-hidden shadow-[0_2px_16px_rgba(232,114,12,0.06)] flex" style={{ height: "60vh" }}>
          {/* Sidebar */}
          <div className={`w-full md:w-72 border-r border-[#E7E0D5] flex-shrink-0 overflow-y-auto ${active ? "hidden md:block" : ""}`}>
            {MOCK_MESSAGES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors border-b border-[#E7E0D5] text-left ${active?.id === m.id ? "bg-orange-50" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{m.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{m.name}</p>
                    <span className="text-xs text-[#78716C]">{m.time}</span>
                  </div>
                  <p className="text-xs text-[#78716C] truncate">{m.lastMsg}</p>
                </div>
                {m.unread > 0 && (
                  <span className="w-5 h-5 bg-[#E8720C] text-white rounded-full text-xs flex items-center justify-center shrink-0">
                    {m.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Chat area */}
          {active ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-[#E7E0D5] flex items-center gap-3">
                <button className="md:hidden text-[#78716C] hover:text-[#E8720C]" onClick={() => setActive(null)}>
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8720C] to-[#D97706] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{active.name.charAt(0)}</span>
                </div>
                <p className="text-sm text-[#1C1008]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{active.name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : ""}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.from === "me" ? "bg-[#E8720C] text-white" : "bg-[#FDFAF4] border border-[#E7E0D5] text-[#1C1008]"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
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
// EDIT PROFILE (stub)
// ===========================
export function EditProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState("Rajesh Kumar");
  const [location, setLocation] = useState("Ludhiana, Punjab");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Profile updated successfully!");
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/profile" className="inline-flex items-center gap-2 text-[#78716C] text-sm mb-6 hover:text-[#E8720C]">
          <ArrowLeft size={16} /> Back to Profile
        </Link>
        <PageHeader title="Edit Profile ✎" />
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E7E0D5] p-8 space-y-5 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
          {[
            { label: "Full Name", value: name, onChange: setName },
            { label: "Location", value: location, onChange: setLocation },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-sm text-[#78716C] block mb-1.5">{f.label}</label>
              <input value={f.value} onChange={(e) => f.onChange(e.target.value)} className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C]" />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

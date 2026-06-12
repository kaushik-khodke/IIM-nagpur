import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Tractor,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { TractorIllustration, WheatWatermark } from "./shared";
import { ThreeBackground } from "./ThreeBackground";
import { toast } from "sonner";
import tractorSevaLogo from "@/assets/tractor-seva-logo.png";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      localStorage.setItem("tractorsewa_token", data.token);
      toast.success("Welcome back to Tractor Seva!");
      navigate("/dashboard");
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#FEF3E2] to-[#F0FDF4] flex-col items-center justify-center p-12 overflow-hidden">
        <ThreeBackground variant="auth" />
        <WheatWatermark className="right-10 top-10" />
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8">
            <TractorIllustration size={180} />
          </div>
          <h2
            className="text-3xl text-[#1C1008] mb-3"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Grow Your Harvest Business
          </h2>
          <p className="text-[#78716C] mb-8">
            Trusted by 500+ operators and farmers across India.
          </p>
          <div className="space-y-4">
            {["Verified operator profiles", "Instant messaging", "Free to join"].map((t) => (
              <div key={t} className="flex items-center gap-3 text-left">
                <CheckCircle size={18} className="text-green-600 shrink-0" />
                <span className="text-[#78716C] text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FDFAF4]">
        <motion.div
          className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(232,114,12,0.1)] border border-[#E7E0D5] p-8 w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <img src={tractorSevaLogo} alt="Tractor Seva" className="h-9 w-auto" />
          </div>
          <h1
            className="text-2xl text-[#1C1008] mb-1"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Welcome Back 👋
          </h1>
          <p className="text-[#78716C] text-sm mb-8">Login to your account</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-[#78716C] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-[#78716C]">Password</label>
                <button type="button" className="text-xs text-[#E8720C] hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#E8720C]"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-colors shadow-[0_4px_14px_rgba(232,114,12,0.3)] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Login to Tractor Seva <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E7E0D5]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#78716C] bg-white px-3">
              or continue with
            </div>
          </div>

          <button className="w-full py-3 border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] hover:bg-gray-50 transition-colors flex items-center justify-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-sm text-[#78716C] mt-6">
            New here?{" "}
            <Link to="/register" className="text-[#E8720C] hover:underline">
              Create a free account →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [role, setRole] = useState<"owner" | "operator" | "both">("operator");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!agreed) { toast.error("Please agree to the Terms of Service"); return; }
    if (password !== confirmPass) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, state, phone })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      localStorage.setItem("tractorsewa_token", data.token);
      toast.success("Account created! Welcome to Tractor Seva 🌾");
      navigate("/dashboard");
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "owner" as const, emoji: "🚜", label: "Harvester Owner" },
    { id: "operator" as const, emoji: "👨‍🌾", label: "Operator" },
    { id: "both" as const, emoji: "🤝", label: "Both" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#FEF3E2] to-[#F0FDF4] flex-col items-center justify-center p-12 overflow-hidden">
        <ThreeBackground variant="auth" />
        <WheatWatermark className="right-10 top-10" />
        <div className="relative z-10 text-center max-w-md">
          <TractorIllustration size={180} />
          <h2
            className="text-3xl text-[#1C1008] mt-6 mb-3"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Join Tractor Seva 🌾
          </h2>
          <p className="text-[#78716C]">
            Connect with 500+ operators and grow your harvest business across India.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FDFAF4]">
        <motion.div
          className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(232,114,12,0.1)] border border-[#E7E0D5] p-8 w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl text-[#1C1008] mb-1"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Create Free Account
          </h1>
          <p className="text-[#78716C] text-sm mb-8">Start your harvest journey today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C] transition-colors"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C] transition-colors"
              />
            </div>

            {/* Confirm Pass */}
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirm Password"
                className="w-full pl-10 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C] transition-colors"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-sm text-[#78716C] block mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`py-3 px-2 rounded-xl text-xs border-2 transition-all text-center ${
                      role === r.id
                        ? "border-[#E8720C] bg-orange-50 text-[#E8720C]"
                        : "border-[#E7E0D5] bg-white text-[#78716C] hover:border-orange-200"
                    }`}
                  >
                    <div className="text-lg mb-0.5">{r.emoji}</div>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* State */}
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm text-[#78716C] focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C]"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Phone */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full pl-16 pr-4 py-3 bg-[#FDFAF4] border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#E8720C] focus:ring-1 focus:ring-[#E8720C] transition-colors"
              />
            </div>

            {/* Agree */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-[#E7E0D5] accent-[#E8720C]"
              />
              <span className="text-xs text-[#78716C]">
                I agree to the{" "}
                <span className="text-[#E8720C] hover:underline cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="text-[#E8720C] hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#15803D] text-white rounded-xl hover:bg-green-700 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Create Free Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#78716C] mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#E8720C] hover:underline">
              Login →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

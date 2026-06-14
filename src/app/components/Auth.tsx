import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { TractorIllustration, WheatWatermark } from "./shared";
import { toast } from "sonner";
import tractorSevaLogo from "@/assets/tractor-seva-logo.png";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

// ---- Shared illustration panel content ----
function IllustrationPanel({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#F4F6FA] to-[#eef0f7] flex flex-col items-center justify-center p-12 overflow-hidden">
      <WheatWatermark className="right-10 top-10" />
      <WheatWatermark className="left-0 bottom-10 opacity-[0.03]" />
      <div className="relative z-10 text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <TractorIllustration size={180} />
        </div>
        {mode === "login" ? (
          <>
            <h2 className="text-3xl text-[#1A1A1A] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
              Grow Your Harvest Business
            </h2>
            <p className="text-[#57585A] mb-8">Trusted by 500+ operators and farmers across India.</p>
            <div className="space-y-4">
              {["Verified operator profiles", "Instant messaging", "Free to join"].map((t) => (
                <div key={t} className="flex items-center gap-3 text-left">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <span className="text-[#57585A] text-sm">{t}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl text-[#1A1A1A] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
              Join Tractor Seva 🌾
            </h2>
            <p className="text-[#57585A]">Connect with 500+ operators and grow your harvest business across India.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Login Form ----
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Login failed"); return; }
      localStorage.setItem("tractorsewa_token", data.token);
      localStorage.removeItem("tractorsewa_preview_mode");
      toast.success("Welcome back to Tractor Seva!");
      const redirectPath = localStorage.getItem("tractorsewa_redirect_after_auth") || "/dashboard";
      localStorage.removeItem("tractorsewa_redirect_after_auth");
      navigate(redirectPath);
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[#57585A] text-sm mb-6 hover:text-[#172263] transition-colors group">
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
      </Link>
      <div className="flex items-center gap-2 mb-6">
        <img src={tractorSevaLogo} alt="Tractor Seva" className="h-9 w-auto" />
      </div>
      <h1 className="text-2xl text-[#1A1A1A] mb-1" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
        Welcome Back 👋
      </h1>
      <p className="text-[#57585A] text-sm mb-8">Login to your account</p>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm text-[#57585A] mb-1.5">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263] transition-colors" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-[#57585A]">Password</label>
            <button type="button" className="text-xs text-[#172263] hover:underline">Forgot Password?</button>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263] transition-colors" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57585A] hover:text-[#172263]">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors shadow-[0_4px_14px_rgba(232,114,12,0.3)] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
          {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Login to Tractor Seva <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]" /></div>
        <div className="relative flex justify-center text-xs text-[#57585A] bg-white px-3">or continue with</div>
      </div>
      <button className="w-full py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] hover:bg-gray-50 transition-colors flex items-center justify-center gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>
      <p className="text-center text-sm text-[#57585A] mt-6">
        New here?{" "}
        <button onClick={onSwitchToRegister} className="text-[#172263] hover:underline font-medium cursor-pointer">
          Create a free account →
        </button>
      </p>
    </div>
  );
}

// ---- Register Form ----
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) { toast.error("Please fill in all required fields"); return; }
    if (!agreed) { toast.error("Please agree to the Terms of Service"); return; }
    if (password !== confirmPass) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, state, phone })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Registration failed"); return; }
      localStorage.setItem("tractorsewa_token", data.token);
      localStorage.removeItem("tractorsewa_preview_mode");
      toast.success("Account created! Welcome to Tractor Seva 🌾");
      const redirectPath = localStorage.getItem("tractorsewa_redirect_after_auth") || "/dashboard";
      localStorage.removeItem("tractorsewa_redirect_after_auth");
      navigate(redirectPath);
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[#57585A] text-sm mb-6 hover:text-[#172263] transition-colors group">
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
      </Link>
      <h1 className="text-2xl text-[#1A1A1A] mb-1" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
        Create Free Account
      </h1>
      <p className="text-[#57585A] text-sm mb-8">Start your harvest journey today</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name"
            className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263] transition-colors" />
        </div>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address"
            className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263] transition-colors" />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263] transition-colors" />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
          <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirm Password"
            className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263] transition-colors" />
        </div>
        <select value={state} onChange={(e) => setState(e.target.value)}
          className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263]">
          <option value="">Select State</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#57585A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">+91</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number"
            className="w-full pl-16 pr-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] focus:ring-1 focus:ring-[#172263] transition-colors" />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded border-[#E2E8F0] accent-[#172263]" />
          <span className="text-xs text-[#57585A]">
            I agree to the{" "}
            <span className="text-[#172263] hover:underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="text-[#172263] hover:underline cursor-pointer">Privacy Policy</span>
          </span>
        </label>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#15803D] text-white rounded-xl hover:bg-green-700 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
          {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Create Free Account <ArrowRight size={16} /></>}
        </button>
      </form>
      <p className="text-center text-sm text-[#57585A] mt-6">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="text-[#172263] hover:underline font-medium cursor-pointer">
          Login →
        </button>
      </p>
    </div>
  );
}

// ---- Unified Auth Page with sliding transition ----
export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(
    location.pathname === "/register" ? "register" : "login"
  );

  const switchToRegister = () => {
    setMode("register");
    navigate("/register", { replace: true });
  };

  const switchToLogin = () => {
    setMode("login");
    navigate("/login", { replace: true });
  };

  // login:    [illustration LEFT] [form RIGHT]
  // register: [form LEFT]         [illustration RIGHT]
  const isLogin = mode === "login";

  const slideVariants = {
    enterFromLeft:  { x: "-100%", opacity: 0 },
    enterFromRight: { x:  "100%", opacity: 0 },
    center:         { x: 0,       opacity: 1 },
    exitToLeft:     { x: "-100%", opacity: 0 },
    exitToRight:    { x:  "100%", opacity: 0 },
  };

  const transition = { type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.55 };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── LEFT PANEL (50%) ── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isLogin ? (
            /* Login → left shows illustration */
            <motion.div
              key="left-illustration"
              className="absolute inset-0"
              initial="enterFromLeft"
              animate="center"
              exit="exitToLeft"
              variants={slideVariants}
              transition={transition}
            >
              <IllustrationPanel mode="login" />
            </motion.div>
          ) : (
            /* Register → left shows the register form */
            <motion.div
              key="left-register"
              className="absolute inset-0 bg-white flex items-center justify-center p-10"
              initial="enterFromRight"
              animate="center"
              exit="exitToRight"
              variants={slideVariants}
              transition={transition}
            >
              <RegisterForm onSwitchToLogin={switchToLogin} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT PANEL (50% desktop / full on mobile) ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isLogin ? (
            /* Login → right shows login form */
            <motion.div
              key="right-login"
              className="absolute inset-0 bg-white flex items-center justify-center p-6"
              initial="enterFromRight"
              animate="center"
              exit="exitToRight"
              variants={slideVariants}
              transition={transition}
            >
              <LoginForm onSwitchToRegister={switchToRegister} />
            </motion.div>
          ) : (
            /* Register → right shows illustration */
            <motion.div
              key="right-illustration"
              className="absolute inset-0 hidden lg:block"
              initial="enterFromLeft"
              animate="center"
              exit="exitToLeft"
              variants={slideVariants}
              transition={transition}
            >
              <IllustrationPanel mode="register" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile fallback for register (right panel is illustration, so show form on mobile) */}
        {!isLogin && (
          <div className="lg:hidden absolute inset-0 bg-white flex items-center justify-center p-6">
            <RegisterForm onSwitchToLogin={switchToLogin} />
          </div>
        )}
      </div>
    </div>
  );
}

// Keep named exports for backward compatibility
export function Login() { return <AuthPage />; }
export function Register() { return <AuthPage />; }

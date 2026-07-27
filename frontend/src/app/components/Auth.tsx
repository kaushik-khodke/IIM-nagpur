import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useGoogleLogin } from "@react-oauth/google";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

// ---- Google Login Hook Wrapper ----
function useGoogleAuth({ 
  setLoading, 
  onGoogleSuccessNeedProfileCompletion 
}: { 
  setLoading: (loading: boolean) => void;
  onGoogleSuccessNeedProfileCompletion: (token: string, user: any) => void;
}) {
  const navigate = useNavigate();
  return useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Google authentication failed.");
          return;
        }

        localStorage.setItem("tractorsewa_token", data.token);
        localStorage.setItem("tractorsewa_user_role", data.user.role || "user");
        localStorage.removeItem("tractorsewa_preview_mode");

        if (data.isNewUser || !data.user.phone || !data.user.state) {
          onGoogleSuccessNeedProfileCompletion(data.token, data.user);
        } else {
          toast.success("Welcome back to Tractor Seva!");
          let redirectPath = localStorage.getItem("tractorsewa_redirect_after_auth");
          if (!redirectPath) {
            redirectPath = data.user.role === "admin" ? "/admin" : "/dashboard";
          }
          localStorage.removeItem("tractorsewa_redirect_after_auth");
          navigate(redirectPath);
        }
      } catch (err) {
        toast.error("Failed to authenticate with Google.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error("Google Sign-In was cancelled or failed.");
    }
  });
}

// ---- Login Form ----
function LoginForm({ 
  onSwitchToRegister, 
  onGoogleSuccessNeedProfileCompletion 
}: { 
  onSwitchToRegister: () => void;
  onGoogleSuccessNeedProfileCompletion: (token: string, user: any) => void;
}) {
  const { t } = useTranslation(["auth", "messages"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) { toast.error(t("error.fillAllFields", { ns: "messages", defaultValue: "Please fill in all fields" })); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || t("error.login", { ns: "messages", defaultValue: "Login failed" })); return; }
      localStorage.setItem("tractorsewa_token", data.token);
      localStorage.setItem("tractorsewa_user_role", data.user.role || "user");
      localStorage.removeItem("tractorsewa_preview_mode");
      toast.success(t("success.login", { ns: "messages", defaultValue: "Welcome back to Tractor Seva!" }));
      let redirectPath = localStorage.getItem("tractorsewa_redirect_after_auth");
      if (!redirectPath) {
        redirectPath = data.user.role === "admin" ? "/admin" : "/dashboard";
      }
      localStorage.removeItem("tractorsewa_redirect_after_auth");
      navigate(redirectPath);
    } catch {
      toast.error(t("error.login", { ns: "messages", defaultValue: "Login failed. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleAuth({ setLoading, onGoogleSuccessNeedProfileCompletion });

  return (
    <div className="w-full max-w-sm flex flex-col justify-center">
      {/* Centered Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <img src={tractorSevaLogo} alt="Tractor Seva Logo" className="h-12 w-auto object-contain mb-3" />
        <h1
          className="text-2xl text-[#16237A] font-bold text-center"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          {t("login.title", { defaultValue: "Login to Tractor Seva" })}
        </h1>
        <p className="text-[#57585A] text-xs mt-1 text-center">{t("login.loginToAccount", { defaultValue: "Login to your account" })}</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs text-[#57585A] mb-1 font-medium">{t("login.email")}</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#57585A] font-medium">{t("login.password")}</label>
            <button type="button" className="text-[10px] text-[#16237A] hover:underline font-medium">{t("login.forgotPassword")}</button>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-9 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57585A] hover:text-[#16237A]"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#16237A] text-white rounded-xl hover:bg-[#0E1754] transition-all duration-200 shadow-md disabled:opacity-60 flex items-center justify-center gap-2 text-xs cursor-pointer"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>{t("login.loginButton")} <ArrowRight size={15} /></>
          )}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]" /></div>
        <div className="relative flex justify-center text-xs text-[#57585A] bg-white px-2">{t("login.orContinueWith", { defaultValue: "or continue with" })}</div>
      </div>
      <button 
        type="button"
        onClick={() => googleLogin()}
        className="w-full py-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {t("login.googleSignIn", { defaultValue: "Sign in with Google" })}
      </button>
      <p className="text-center text-xs text-[#57585A] mt-5 md:hidden">
        {t("login.noAccount")}{" "}
        <button onClick={onSwitchToRegister} className="text-[#16237A] hover:underline font-semibold cursor-pointer">
          {t("login.registerLink")}
        </button>
      </p>
    </div>
  );
}

// ---- Register Form ----
function RegisterForm({ 
  onSwitchToLogin, 
  onGoogleSuccessNeedProfileCompletion 
}: { 
  onSwitchToLogin: () => void;
  onGoogleSuccessNeedProfileCompletion: (token: string, user: any) => void;
}) {
  const { t } = useTranslation(["auth", "static", "messages"]);
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
    if (e) e.preventDefault();
    if (!name || !email || !password || !state || !phone) { toast.error(t("error.fillAllFields", { ns: "messages", defaultValue: "Please fill in all required fields including State" })); return; }
    if (!agreed) { toast.error(t("error.agreeTerms", { ns: "messages", defaultValue: "Please agree to the Terms of Service" })); return; }
    if (password !== confirmPass) { toast.error(t("error.passwordMismatch", { ns: "messages", defaultValue: "Passwords do not match" })); return; }

    const cleanedPhone = phone.replace(/\D/g, "");
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      finalPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      finalPhone = cleanedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(finalPhone)) {
      toast.error(t("error.invalidPhone", { ns: "messages", defaultValue: "Please enter a valid 10-digit mobile number" }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, state, phone: finalPhone })
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || t("error.register", { ns: "messages", defaultValue: "Registration failed" })); return; }
      localStorage.setItem("tractorsewa_token", data.token);
      localStorage.setItem("tractorsewa_user_role", data.user.role || "user");
      localStorage.removeItem("tractorsewa_preview_mode");
      window.dispatchEvent(new Event("auth-changed"));
      toast.success(t("success.register", { ns: "messages", defaultValue: "Account created! Welcome to Tractor Seva" }));
      let redirectPath = localStorage.getItem("tractorsewa_redirect_after_auth");
      if (!redirectPath) {
        redirectPath = data.user.role === "admin" ? "/admin" : "/dashboard";
      }
      localStorage.removeItem("tractorsewa_redirect_after_auth");
      navigate(redirectPath);
    } catch {
      toast.error(t("error.register", { ns: "messages", defaultValue: "Registration failed. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleAuth({ setLoading, onGoogleSuccessNeedProfileCompletion });

  return (
    <div className="w-full max-w-sm flex flex-col justify-center">
      {/* Centered Brand Header */}
      <div className="flex flex-col items-center mb-5">
        <img src={tractorSevaLogo} alt="Tractor Seva Logo" className="h-12 w-auto object-contain mb-3" />
        <h1
          className="text-2xl text-[#16237A] font-bold text-center"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          {t("register.title", { defaultValue: "Create Your Account" })}
        </h1>
        <p className="text-[#57585A] text-xs mt-1 text-center">{t("register.joinNetwork", { defaultValue: "Start your harvest journey today" })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("register.fullName", { defaultValue: "Full Name" })}
            className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
          />
        </div>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("register.email", { defaultValue: "Email Address" })}
            className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("register.password", { defaultValue: "Password" })}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
            />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder={t("register.confirmPassword", { defaultValue: "Confirm" })}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A]"
          >
            <option value="">{t("register.selectState", { defaultValue: "Select State" })}</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>)}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#57585A] bg-blue-50 px-1 py-0.5 rounded border border-blue-100">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("register.phone", { defaultValue: "Phone" })}
              className="w-full pl-12 pr-4 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
            />
          </div>
        </div>
        <label className="flex items-start gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded border-[#E2E8F0] accent-[#16237A]"
          />
          <span className="text-[10px] text-[#57585A] leading-tight">
            {t("register.agreeTo", { defaultValue: "I agree to the" })}{" "}
            <span className="text-[#16237A] hover:underline cursor-pointer font-medium">{t("register.terms", { defaultValue: "Terms" })}</span>{" "}
            {t("register.and", { defaultValue: "and" })}{" "}
            <span className="text-[#16237A] hover:underline cursor-pointer font-medium">{t("register.privacy", { defaultValue: "Privacy" })}</span>.
          </span>
        </label>
        {/* Agricultural Red Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#D61E1E] text-white rounded-xl hover:bg-[#B51717] transition-all duration-200 shadow-md disabled:opacity-60 flex items-center justify-center gap-2 text-xs mt-2 cursor-pointer"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>{t("register.registerButton", { defaultValue: "Register" })} <ArrowRight size={15} /></>
          )}
        </button>
      </form>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]" /></div>
        <div className="relative flex justify-center text-[10px] text-[#57585A] bg-white px-2">{t("login.orContinueWith", { defaultValue: "or continue with" })}</div>
      </div>
      <button 
        type="button"
        onClick={() => googleLogin()}
        className="w-full py-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {t("register.googleSignUp", { defaultValue: "Sign up with Google" })}
      </button>
      <p className="text-center text-xs text-[#57585A] mt-5 md:hidden">
        {t("register.haveAccount")}{" "}
        <button onClick={onSwitchToLogin} className="text-[#16237A] hover:underline font-semibold cursor-pointer">
          {t("register.loginLink")}
        </button>
      </p>
    </div>
  );
}

// ---- Profile Completion Form ----
function ProfileCompletionForm({ 
  token, 
  user, 
  onCancel 
}: { 
  token: string; 
  user: any; 
  onCancel: () => void;
}) {
  const { t } = useTranslation(["auth", "static", "messages"]);
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!state || !phone) { 
      toast.error("Please select a state and enter your phone number."); 
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
      toast.error(t("error.invalidPhone", { ns: "messages", defaultValue: "Please enter a valid 10-digit mobile number" }));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: user.name, 
          state, 
          phone: finalPhone, 
          bio: "", 
          imagePath: user.image_path 
        })
      });
      const data = await res.json();
      if (!res.ok) { 
        toast.error(data.error || "Failed to update profile."); 
        return; 
      }
      
      toast.success("Profile completed successfully!");
      let redirectPath = localStorage.getItem("tractorsewa_redirect_after_auth");
      if (!redirectPath) {
        redirectPath = user.role === "admin" ? "/admin" : "/dashboard";
      }
      localStorage.removeItem("tractorsewa_redirect_after_auth");
      navigate(redirectPath);
    } catch {
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col justify-center">
      <div className="flex flex-col items-center mb-6">
        <img src={tractorSevaLogo} alt="Tractor Seva Logo" className="h-12 w-auto object-contain mb-3" />
        <h1
          className="text-xl text-[#16237A] font-bold text-center"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          Complete Your Profile
        </h1>
        <p className="text-[#57585A] text-xs mt-1 text-center">Please provide your location and phone number to complete registration.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-[#57585A] mb-1 font-medium">Select State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A]"
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#57585A] mb-1 font-medium">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#57585A] bg-blue-50 px-1 py-0.5 rounded border border-blue-100">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full pl-12 pr-4 py-2.5 bg-[#F5F5F5] border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#16237A] focus:ring-1 focus:ring-[#16237A] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] hover:bg-gray-50 transition-colors font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-[#16237A] text-white rounded-xl hover:bg-[#0E1754] transition-all duration-200 shadow-md disabled:opacity-60 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Unified Auth Page with sliding transition ----
export function AuthPage() {
  const { t } = useTranslation(["auth"]);
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(
    location.pathname === "/register" ? "register" : "login"
  );
  const [pendingProfileCompletion, setPendingProfileCompletion] = useState<{ token: string, user: any } | null>(null);

  const switchToRegister = () => {
    setMode("register");
    navigate("/register", { replace: true });
  };

  const switchToLogin = () => {
    setMode("login");
    navigate("/login", { replace: true });
  };

  const isSignUp = mode === "register";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 relative overflow-hidden select-none"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      {/* Subtle dark overlay and background blur to let card stand out */}
      <div className="absolute inset-0 bg-[#0A0F26]/40 backdrop-blur-[5px] pointer-events-none z-0" />

      {/* Floating Back Button */}
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
        className="fixed top-6 left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-white/20 shadow-md hover:shadow-lg text-[#57585A] hover:text-[#16237A] transition-all duration-200 group focus:outline-none backdrop-blur-md"
        title="Go Back"
      >
        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
      </button>

      {/* Main Sliding Card Container with Glassmorphism */}
      <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_24px_50px_-12px_rgba(22,35,122,0.22)] border border-white/40 w-[820px] max-w-full min-h-[540px] overflow-hidden flex flex-col md:block z-10">
        
        {/* ---- SIGN IN FORM PANEL ---- */}
        <div className={`absolute top-0 left-0 h-full w-full md:w-1/2 transition-all duration-700 ease-in-out z-2 flex items-center justify-center p-8 bg-transparent
          ${isSignUp ? 'opacity-0 pointer-events-none md:translate-x-full md:z-1' : 'opacity-100 md:z-2'}`}
        >
          {pendingProfileCompletion ? (
            <ProfileCompletionForm 
              token={pendingProfileCompletion.token} 
              user={pendingProfileCompletion.user} 
              onCancel={() => {
                localStorage.removeItem("tractorsewa_token");
                localStorage.removeItem("tractorsewa_user_role");
                setPendingProfileCompletion(null);
              }}
            />
          ) : (
            <LoginForm 
              onSwitchToRegister={switchToRegister} 
              onGoogleSuccessNeedProfileCompletion={(token, user) => setPendingProfileCompletion({ token, user })}
            />
          )}
        </div>

        {/* ---- SIGN UP FORM PANEL ---- */}
        <div className={`absolute top-0 left-0 h-full w-full md:w-1/2 transition-all duration-700 ease-in-out z-1 flex items-center justify-center p-8 bg-transparent
          ${isSignUp ? 'opacity-100 md:translate-x-full md:z-5' : 'opacity-0 pointer-events-none md:z-1'}`}
        >
          {pendingProfileCompletion ? (
            <ProfileCompletionForm 
              token={pendingProfileCompletion.token} 
              user={pendingProfileCompletion.user} 
              onCancel={() => {
                localStorage.removeItem("tractorsewa_token");
                localStorage.removeItem("tractorsewa_user_role");
                setPendingProfileCompletion(null);
              }}
            />
          ) : (
            <RegisterForm 
              onSwitchToLogin={switchToLogin} 
              onGoogleSuccessNeedProfileCompletion={(token, user) => setPendingProfileCompletion({ token, user })}
            />
          )}
        </div>

        {/* ---- DESKTOP OVERLAY SLIDER (Hidden on Mobile) ---- */}
        <div className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-10
          ${isSignUp ? 'transform -translate-x-full' : ''}`}
        >
          {/* Inner Sliding Gradient Container - Translucent deep navy to royal blue gradient with depth */}
          <div className={`relative left-[-100%] h-full w-[200%] bg-gradient-to-br from-[#16237A]/94 via-[#1E2E87]/88 to-[#2E3FAE]/94 text-white transition-transform duration-700 ease-in-out
            ${isSignUp ? 'transform translate-x-1/2' : ''}`}
          >
            {/* 1. Subtle Lavender & Sky Blue Radial Glows for light reflection/depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(224,231,255,0.14),transparent_40%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(147,197,253,0.08),transparent_50%)]" />
            <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-purple-400/8 blur-3xl pointer-events-none" />

            {/* 2. Repeating Agricultural Patterns (Crop Rows & Tire Tracks) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="crop-rows" width="20" height="20" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="1" opacity="0.035" />
                  <line x1="10" y1="0" x2="10" y2="20" stroke="white" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.02" />
                </pattern>
                <pattern id="tire-tracks" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                  <path d="M 5,0 L 15,10 M 15,0 L 5,10 M 20,15 L 10,25" stroke="white" strokeWidth="1" opacity="0.025" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#crop-rows)" />
              <rect width="100%" height="100%" fill="url(#tire-tracks)" />
            </svg>

            {/* 3. Abstract Curves/Waves SVG layer representing farm contour lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]" viewBox="0 0 820 540" fill="none" preserveAspectRatio="none">
              <path d="M-100 280 C150 180, 400 380, 920 300" stroke="white" strokeWidth="2" strokeDasharray="8 4" />
              <path d="M-100 340 C180 260, 450 440, 920 360" stroke="white" strokeWidth="2" />
              <path d="M-100 400 C210 320, 500 500, 920 420" stroke="white" strokeWidth="1" opacity="0.5" />
              {/* Soft curved filled shape at the bottom */}
              <path d="M-100 420 C250 350, 550 520, 920 450 L920 540 L-100 540 Z" fill="white" opacity="0.05" />
            </svg>

            {/* Wheat Watermarks */}
            <WheatWatermark className="right-10 top-10 opacity-[0.08] scale-150" />
            <WheatWatermark className="left-10 bottom-10 opacity-[0.06] scale-150" />

            {/* Left Overlay Panel */}
            <div className={`absolute top-0 left-0 h-full w-1/2 flex flex-col items-center justify-center text-center px-10 transition-transform duration-700 ease-in-out
              ${isSignUp ? 'transform translate-x-0' : 'transform -translate-x-[20%]'}`}
            >
              <div className="mb-4">
                <TractorIllustration size={100} className="stroke-white" />
              </div>
              <h2 className="text-2xl font-bold font-sora mb-2">{t("login.title", { defaultValue: "Login to Tractor Seva" })}</h2>
              <p className="text-slate-250 text-xs leading-relaxed max-w-[280px] mb-6">
                {t("login.welcomeBackPanelDesc", { defaultValue: "To stay connected with verified operators and listings, please login with your account info." })}
              </p>
              <button
                onClick={switchToLogin}
                className="px-8 py-2 bg-transparent border-2 border-white text-white rounded-xl text-xs hover:bg-white hover:text-[#16237A] transition-all duration-200 font-bold uppercase tracking-wider cursor-pointer"
              >
                {t("login.loginButton", { defaultValue: "Login" })}
              </button>
            </div>

            {/* Right Overlay Panel */}
            <div className={`absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center text-center px-10 transition-transform duration-700 ease-in-out
              ${isSignUp ? 'transform translate-x-[20%]' : 'transform translate-x-0'}`}
            >
              <div className="mb-4">
                <TractorIllustration size={100} className="stroke-white" />
              </div>
              <h2 className="text-2xl font-bold font-sora mb-2">{t("register.title", { defaultValue: "Create Your Account" })}</h2>
              <p className="text-slate-250 text-xs leading-relaxed max-w-[280px] mb-6">
                {t("register.joinDesc", { defaultValue: "Enter your details to create a free account and start your harvest matching journey today." })}
              </p>
              <button
                onClick={switchToRegister}
                className="px-8 py-2 bg-transparent border-2 border-white text-white rounded-xl text-xs hover:bg-white hover:text-[#16237A] transition-all duration-200 font-bold uppercase tracking-wider cursor-pointer"
              >
                {t("register.registerButton", { defaultValue: "Register" })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep named exports for backward compatibility
export function Login() { return <AuthPage />; }
export function Register() { return <AuthPage />; }

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  Eye,
  ShieldCheck,
  HelpCircle,
  ChevronRight,
  Save,
  KeyRound,
  Trash2,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Navbar } from "./shared";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  state: string;
  bio: string;
  imagePath: string | null;
  createdAt: string;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  doNotDisturbStart: string | null;
  doNotDisturbEnd: string | null;
  profileVisibility: "public" | "private" | "hidden";
  showContactInfo: boolean;
}

// ─── Toggle Component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#172263]" : "bg-zinc-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Password Strength ───────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score - 1] : "bg-zinc-200"} transition-colors`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 2 ? "text-red-500" : score <= 3 ? "text-yellow-600" : "text-green-600"}`}>
        {labels[score - 1] || "Very Weak"}
      </p>
      <ul className="space-y-0.5">
        {["At least 8 characters", "Uppercase letter", "Lowercase letter", "Number", "Special character"].map((req, i) => (
          <li key={i} className={`flex items-center gap-1.5 text-xs ${checks[i] ? "text-green-600" : "text-zinc-400"}`}>
            {checks[i] ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {req}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────
function InputField({
  label, value, onChange, type = "text", disabled = false, hint, icon,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; disabled?: boolean; hint?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#57585A] mb-1.5">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] transition-colors ${
            icon ? "pl-9" : ""
          } ${disabled ? "bg-[#F8FAFC] text-zinc-400 cursor-not-allowed" : "bg-white focus:outline-none focus:ring-2 focus:ring-[#172263]/20 focus:border-[#172263]"}`}
        />
      </div>
      {hint && <p className="text-xs text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Main Settings Component ─────────────────────────────────────────────────
export function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("account");
  const [mobileOpen, setMobileOpen] = useState<string | null>("account");

  // Form states
  const [accountForm, setAccountForm] = useState({ name: "", phone: "", whatsappNumber: "", state: "", bio: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [notifForm, setNotifForm] = useState({ email: true, sms: true, dndStart: "", dndEnd: "", dndEnabled: false });
  const [privacyForm, setPrivacyForm] = useState({ visibility: "public" as "public" | "private" | "hidden", showContact: true });
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const token = localStorage.getItem("tractorsewa_token");

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data: UserSettings = await res.json();
          setSettings(data);
          setAccountForm({ name: data.name || "", phone: data.phone || "", whatsappNumber: data.whatsappNumber || "", state: data.state || "", bio: data.bio || "" });
          setNotifForm({
            email: data.notificationsEmail,
            sms: data.notificationsSms,
            dndStart: data.doNotDisturbStart || "",
            dndEnd: data.doNotDisturbEnd || "",
            dndEnabled: !!(data.doNotDisturbStart || data.doNotDisturbEnd),
          });
          setPrivacyForm({ visibility: data.profileVisibility || "public", showContact: data.showContactInfo });
        }
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const saveAccount = async () => {
    setSaving("account");
    try {
      const res = await fetch("/api/settings/account", {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      });
      const data = await res.json();
      if (res.ok) toast.success("Account updated successfully!");
      else toast.error(data.error || "Failed to update account");
    } catch { toast.error("Network error"); }
    finally { setSaving(null); }
  };

  const savePassword = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error("New passwords do not match"); return; }
    if (passwordForm.newPass.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSaving("password");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Password changed successfully!"); setPasswordForm({ current: "", newPass: "", confirm: "" }); }
      else toast.error(data.error || "Failed to change password");
    } catch { toast.error("Network error"); }
    finally { setSaving(null); }
  };

  const saveNotifications = async () => {
    setSaving("notifications");
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationsEmail: notifForm.email, notificationsSms: notifForm.sms,
          doNotDisturbStart: notifForm.dndEnabled ? notifForm.dndStart || null : null,
          doNotDisturbEnd: notifForm.dndEnabled ? notifForm.dndEnd || null : null,
        }),
      });
      const data = await res.json();
      if (res.ok) toast.success("Notification preferences saved!");
      else toast.error(data.error || "Failed to save");
    } catch { toast.error("Network error"); }
    finally { setSaving(null); }
  };

  const savePrivacy = async () => {
    setSaving("privacy");
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ profileVisibility: privacyForm.visibility, showContactInfo: privacyForm.showContact }),
      });
      const data = await res.json();
      if (res.ok) toast.success("Privacy settings saved!");
      else toast.error(data.error || "Failed to save");
    } catch { toast.error("Network error"); }
    finally { setSaving(null); }
  };

  const deleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") { toast.error('Type "DELETE" to confirm'); return; }
    setSaving("delete");
    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account deleted. Goodbye!");
        localStorage.clear();
        setTimeout(() => navigate("/"), 1500);
      } else toast.error(data.error || "Failed to delete account");
    } catch { toast.error("Network error"); }
    finally { setSaving(null); setShowDeleteModal(false); }
  };

  const navItems = [
    { id: "account", label: "Account", icon: <User size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "privacy", label: "Privacy", icon: <Eye size={16} /> },
    { id: "verification", label: "Verification", icon: <ShieldCheck size={16} /> },
    { id: "support", label: "Support & Help", icon: <HelpCircle size={16} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar variant="auth" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#172263] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Section renderers ──────────────────────────────────────────────────────
  const renderAccount = () => (
    <div className="space-y-6">
      <SectionCard title="Basic Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Full Name" value={accountForm.name} onChange={v => setAccountForm(f => ({ ...f, name: v }))} icon={<User size={14} />} hint="Shown on your public profile" />
          <InputField label="Email Address" value={settings?.email || ""} type="email" disabled hint="Email cannot be changed" icon={<Mail size={14} />} />
          <InputField label="Phone Number" value={accountForm.phone} onChange={v => setAccountForm(f => ({ ...f, phone: v }))} type="tel" icon={<Phone size={14} />} hint="Shown to potential clients" />
          <InputField label="WhatsApp Number" value={accountForm.whatsappNumber} onChange={v => setAccountForm(f => ({ ...f, whatsappNumber: v }))} type="tel" icon={<MessageCircle size={14} />} hint="For easier communication" />
          <div className="sm:col-span-2">
            <InputField label="State / Region" value={accountForm.state} onChange={v => setAccountForm(f => ({ ...f, state: v }))} icon={<MapPin size={14} />} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#57585A] mb-1.5">Bio / Description</label>
            <textarea
              value={accountForm.bio}
              onChange={e => setAccountForm(f => ({ ...f, bio: e.target.value }))}
              maxLength={500}
              rows={3}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] resize-none focus:outline-none focus:ring-2 focus:ring-[#172263]/20 focus:border-[#172263]"
              placeholder="Tell others about yourself..."
            />
            <p className="text-xs text-zinc-400 mt-1">{accountForm.bio.length}/500 characters</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Info size={12} />
            Account created: {settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
          </div>
          <button onClick={saveAccount} disabled={saving === "account"} className="flex items-center gap-2 bg-[#172263] hover:bg-[#11194A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <Save size={14} /> {saving === "account" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Security & Password">
        <div className="space-y-4">
          <InputField label="Current Password" value={passwordForm.current} onChange={v => setPasswordForm(f => ({ ...f, current: v }))} type="password" icon={<KeyRound size={14} />} />
          <div>
            <InputField label="New Password" value={passwordForm.newPass} onChange={v => setPasswordForm(f => ({ ...f, newPass: v }))} type="password" icon={<KeyRound size={14} />} />
            <PasswordStrength password={passwordForm.newPass} />
          </div>
          <InputField label="Confirm New Password" value={passwordForm.confirm} onChange={v => setPasswordForm(f => ({ ...f, confirm: v }))} type="password" icon={<KeyRound size={14} />} />
          {passwordForm.confirm && passwordForm.newPass !== passwordForm.confirm && (
            <p className="text-xs text-red-500 flex items-center gap-1"><XCircle size={11} /> Passwords do not match</p>
          )}
          <div className="pt-2">
            <button onClick={savePassword} disabled={saving === "password"} className="flex items-center gap-2 bg-[#172263] hover:bg-[#11194A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              <KeyRound size={14} /> {saving === "password" ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone">
        <div className="flex items-start justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div>
            <h4 className="text-sm font-bold text-red-700">Delete Account</h4>
            <p className="text-xs text-red-600 mt-0.5">Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </SectionCard>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <SectionCard title="Notification Channels">
        <div className="space-y-5">
          {[
            { label: "Email Notifications", desc: "Receive alerts and updates via email", key: "email" as const },
            { label: "SMS Notifications", desc: "Receive text messages for important alerts", key: "sms" as const },
          ].map(({ label, desc, key }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
              <Toggle checked={notifForm[key]} onChange={v => setNotifForm(f => ({ ...f, [key]: v }))} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Do Not Disturb">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Enable Do Not Disturb</p>
              <p className="text-xs text-zinc-500 mt-0.5">Mute all notifications during selected hours</p>
            </div>
            <Toggle checked={notifForm.dndEnabled} onChange={v => setNotifForm(f => ({ ...f, dndEnabled: v }))} />
          </div>
          {notifForm.dndEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#57585A] mb-1.5">From</label>
                <input type="time" value={notifForm.dndStart} onChange={e => setNotifForm(f => ({ ...f, dndStart: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#172263]/20 focus:border-[#172263]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#57585A] mb-1.5">To</label>
                <input type="time" value={notifForm.dndEnd} onChange={e => setNotifForm(f => ({ ...f, dndEnd: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#172263]/20 focus:border-[#172263]" />
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end">
          <button onClick={saveNotifications} disabled={saving === "notifications"} className="flex items-center gap-2 bg-[#172263] hover:bg-[#11194A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <Save size={14} /> {saving === "notifications" ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </SectionCard>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <SectionCard title="Profile Visibility">
        <div className="space-y-3">
          {([
            { value: "public", label: "Public Profile", desc: "Visible to all users and appears in search results" },
            { value: "private", label: "Private Profile", desc: "Only visible to users you've connected with" },
            { value: "hidden", label: "Hidden Profile", desc: "Not visible in search results or directory" },
          ] as { value: "public" | "private" | "hidden"; label: string; desc: string }[]).map(opt => (
            <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${privacyForm.visibility === opt.value ? "border-[#172263] bg-[#172263]/5" : "border-[#E2E8F0] hover:border-zinc-300"}`}>
              <input type="radio" name="visibility" value={opt.value} checked={privacyForm.visibility === opt.value}
                onChange={() => setPrivacyForm(f => ({ ...f, visibility: opt.value }))} className="mt-0.5 accent-[#172263]" />
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">{opt.label}</p>
                <p className="text-xs text-zinc-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Contact Information">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Show contact details</p>
              <p className="text-xs text-zinc-500">Allow other users to see your phone number and WhatsApp</p>
            </div>
            <Toggle checked={privacyForm.showContact} onChange={v => setPrivacyForm(f => ({ ...f, showContact: v }))} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end">
          <button onClick={savePrivacy} disabled={saving === "privacy"} className="flex items-center gap-2 bg-[#172263] hover:bg-[#11194A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <Save size={14} /> {saving === "privacy" ? "Saving..." : "Save Privacy Settings"}
          </button>
        </div>
      </SectionCard>
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-6">
      <SectionCard title="Verification Status">
        <div className="space-y-4">
          {[
            { label: "Email Address", value: settings?.email, verified: true, hint: "Your email is verified on registration" },
            { label: "Phone Number", value: settings?.phone ? `+91-${settings.phone}` : "Not provided", verified: false, hint: "Phone verification coming soon" },
            { label: "Identity Verification", value: "Government ID", verified: false, hint: "Upload Aadhaar or PAN to get verified" },
          ].map(item => (
            <div key={item.label} className={`flex items-center justify-between p-4 rounded-xl border ${item.verified ? "border-green-200 bg-green-50" : "border-[#E2E8F0] bg-[#F8FAFC]"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.verified ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-400"}`}>
                  {item.verified ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.value}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.verified ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {item.verified ? "Verified ✓" : "Not Verified"}
                </span>
                {!item.verified && <p className="text-[10px] text-zinc-400 mt-1">{item.hint}</p>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-6">
      <SectionCard title="Quick Links">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "View Profile", desc: "Go to your public profile", link: "/profile", icon: <User size={16} className="text-[#172263]" /> },
            { label: "My Harvesters", desc: "Manage your listings", link: "/harvesters?tab=mine", icon: <ChevronRight size={16} className="text-[#E82326]" /> },
            { label: "Send Feedback", desc: "Report issues or suggest features", link: "/enquiry", icon: <MessageCircle size={16} className="text-green-600" /> },
            { label: "Go to Dashboard", desc: "Return to your dashboard", link: "/dashboard", icon: <ChevronRight size={16} className="text-[#172263]" /> },
          ].map(item => (
            <Link key={item.label} to={item.link} className="flex items-center gap-3 p-3.5 bg-[#F8FAFC] hover:bg-[#EAEFF8] border border-[#E2E8F0] hover:border-[#172263]/30 rounded-xl transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#172263] transition-colors">{item.label}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Legal & Policies">
        <div className="space-y-3">
          {[
            { label: "Terms of Service", desc: "Read our terms and conditions" },
            { label: "Privacy Policy", desc: "How we handle your data" },
            { label: "Community Guidelines", desc: "Platform rules and best practices" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FAFC] cursor-pointer transition-colors group">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#172263] transition-colors">{item.label}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
              <ChevronRight size={14} className="text-zinc-300 group-hover:text-[#172263] transition-colors" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const sectionContent: Record<string, React.ReactNode> = {
    account: renderAccount(),
    notifications: renderNotifications(),
    privacy: renderPrivacy(),
    verification: renderVerification(),
    support: renderSupport(),
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1A1A1A]">
      <Navbar variant="auth" />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[#57585A] text-sm hover:text-[#172263] transition-colors group">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          <span className="text-zinc-300">|</span>
          <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif" }}>Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-sm sticky top-24">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider px-3 mb-2">Settings Menu</p>
              <nav className="space-y-1">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeSection === item.id ? "bg-[#172263] text-white shadow-sm" : "text-[#57585A] hover:bg-[#F8FAFC] hover:text-[#172263]"
                    }`}>
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Profile preview in sidebar */}
              {settings && (
                <div className="mt-4 pt-4 border-t border-zinc-100 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center overflow-hidden shrink-0">
                      {settings.imagePath ? (
                        <img src={settings.imagePath} alt={settings.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">{settings.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1A1A] truncate">{settings.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{settings.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Mobile Accordion Navigation ── */}
          <div className="lg:hidden col-span-1 space-y-3">
            {navItems.map(item => (
              <div key={item.id} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setMobileOpen(mobileOpen === item.id ? null : item.id)}
                  className={`w-full flex items-center justify-between px-5 py-4 font-semibold text-sm transition-colors ${
                    mobileOpen === item.id ? "bg-[#172263] text-white" : "text-[#1A1A1A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">{item.icon}{item.label}</div>
                  {mobileOpen === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {mobileOpen === item.id && <div className="p-4">{sectionContent[item.id]}</div>}
              </div>
            ))}
          </div>

          {/* ── Desktop Main Content ── */}
          <main className="hidden lg:block lg:col-span-10">
            {sectionContent[activeSection]}
          </main>
        </div>
      </div>

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E2E8F0] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif" }}>Delete Account?</h3>
                <p className="text-xs text-zinc-400">This action is irreversible</p>
              </div>
            </div>
            <p className="text-sm text-[#57585A] mb-5">All your data — harvesters, operator profiles, messages, and requests — will be permanently deleted.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#57585A] mb-1.5">Enter your password</label>
                <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#57585A] mb-1.5">Type <strong className="text-red-600">DELETE</strong> to confirm</label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteConfirmText(""); }}
                className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#57585A] hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteAccount} disabled={saving === "delete" || deleteConfirmText !== "DELETE" || !deletePassword}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Trash2 size={14} /> {saving === "delete" ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

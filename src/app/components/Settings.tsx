import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User,
  Bell,
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
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tractor,
  UserCheck,
  ShieldCheck,
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
}

function formatTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const str = String(value).trim();
  return /^\d{2}:\d{2}/.test(str) ? str.slice(0, 5) : "";
}

function buildNotificationForm(data: Pick<UserSettings, "notificationsEmail" | "notificationsSms" | "doNotDisturbStart" | "doNotDisturbEnd">) {
  const dndStart = formatTimeInput(data.doNotDisturbStart);
  const dndEnd = formatTimeInput(data.doNotDisturbEnd);
  return {
    email: Boolean(data.notificationsEmail),
    sms: Boolean(data.notificationsSms),
    dndStart,
    dndEnd,
    dndEnabled: Boolean(dndStart || dndEnd),
  };
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
  const { t } = useTranslation("pages");
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"];
  const labels = [
    t("settings.account.passwordStrength.veryWeak", { defaultValue: "Very Weak" }),
    t("settings.account.passwordStrength.weak", { defaultValue: "Weak" }),
    t("settings.account.passwordStrength.fair", { defaultValue: "Fair" }),
    t("settings.account.passwordStrength.good", { defaultValue: "Good" }),
    t("settings.account.passwordStrength.strong", { defaultValue: "Strong" }),
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score - 1] : "bg-zinc-200"} transition-colors`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 2 ? "text-red-500" : score <= 3 ? "text-yellow-600" : "text-green-600"}`}>
        {labels[score - 1] || t("settings.account.passwordStrength.veryWeak", { defaultValue: "Very Weak" })}
      </p>
      <ul className="space-y-0.5">
        {[
          t("settings.account.passwordStrength.reqLength", { defaultValue: "At least 8 characters" }),
          t("settings.account.passwordStrength.reqUpper", { defaultValue: "Uppercase letter" }),
          t("settings.account.passwordStrength.reqLower", { defaultValue: "Lowercase letter" }),
          t("settings.account.passwordStrength.reqNumber", { defaultValue: "Number" }),
          t("settings.account.passwordStrength.reqSpecial", { defaultValue: "Special character" }),
        ].map((req, i) => (
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
  const { t, i18n } = useTranslation("pages");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [operatorProfile, setOperatorProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeSection, setActiveSection] = useState(() => {
    if (tabParam === "support") return "support";
    if (tabParam === "verification") return "verification";
    return "account";
  });
  const [mobileOpen, setMobileOpen] = useState<string | null>(() => {
    if (tabParam === "support") return "support";
    if (tabParam === "verification") return "verification";
    return "account";
  });

  // Form states
  const [accountForm, setAccountForm] = useState({ name: "", phone: "", whatsappNumber: "", state: "", bio: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Enquiry form state
  const [enquiryForm, setEnquiryForm] = useState({ name: "", phone: "", location: "", requirement: "Provide Feedback", message: "" });
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  const token = localStorage.getItem("tractorsewa_token");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["account", "verification", "support"].includes(tab)) {
      setActiveSection(tab);
      setMobileOpen(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) {
          toast.error(t("settings.toasts.sessionExpired", { defaultValue: "Session expired. Please log in again." }));
          navigate("/login");
          return;
        }
        if (res.ok) {
          const data: UserSettings = await res.json();
          setSettings(data);
          setAccountForm({ name: data.name || "", phone: data.phone || "", whatsappNumber: data.whatsappNumber || "", state: data.state || "", bio: data.bio || "" });

          // Fetch operator profile if it exists
          const opRes = await fetch(`/api/operators?userId=${data.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (opRes.ok) {
            const opData = await opRes.json();
            if (opData.length > 0) {
              setOperatorProfile(opData[0]);
            }
          }
        }
      } catch {
        toast.error(t("settings.toasts.networkError", { defaultValue: "Network error" }));
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [navigate, t, token]);

  const saveAccount = async () => {
    setSaving("account");
    try {
      const res = await fetch("/api/settings/account", {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      });
      const data = await res.json();
      if (res.ok) toast.success(t("settings.toasts.accountSaved", { defaultValue: "Account updated successfully!" }));
      else toast.error(data.error || t("settings.toasts.accountFailed", { defaultValue: "Failed to update account" }));
    } catch { toast.error(t("settings.toasts.networkError", { defaultValue: "Network error" })); }
    finally { setSaving(null); }
  };

  const savePassword = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error(t("settings.toasts.passwordMismatch", { defaultValue: "New passwords do not match" })); return; }
    if (passwordForm.newPass.length < 8) { toast.error(t("settings.toasts.passwordLength", { defaultValue: "Password must be at least 8 characters" })); return; }
    setSaving("password");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(t("settings.toasts.passwordSaved", { defaultValue: "Password changed successfully!" })); setPasswordForm({ current: "", newPass: "", confirm: "" }); }
      else toast.error(data.error || t("settings.toasts.passwordFailed", { defaultValue: "Failed to change password" }));
    } catch { toast.error(t("settings.toasts.networkError", { defaultValue: "Network error" })); }
    finally { setSaving(null); }
  };

  const deleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") { toast.error(t("settings.toasts.deleteConfirm", { defaultValue: 'Type "DELETE" to confirm' })); return; }
    setSaving("delete");
    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("settings.toasts.deletedSuccess", { defaultValue: "Account deleted. Goodbye!" }));
        localStorage.clear();
        setTimeout(() => navigate("/"), 1500);
      } else toast.error(data.error || t("settings.toasts.deletedFailed", { defaultValue: "Failed to delete account" }));
    } catch { toast.error(t("settings.toasts.networkError", { defaultValue: "Network error" })); }
    finally { setSaving(null); setShowDeleteModal(false); }
  };

  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = enquiryForm.phone.replace(/\D/g, "");
    let finalPhone = cleanedPhone;
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith("91")) {
      finalPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      finalPhone = cleanedPhone.substring(1);
    }

    if (!/^\d{10}$/.test(finalPhone)) {
      toast.error(t("enquiry.errorPhone", { defaultValue: "Please enter a valid 10-digit mobile number" }));
      return;
    }

    setSubmittingEnquiry(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: enquiryForm.name,
          phone: finalPhone,
          location: enquiryForm.location,
          requirement: enquiryForm.requirement,
          message: enquiryForm.message,
        }),
      });

      if (res.ok) {
        toast.success(t("enquiry.successToast", { defaultValue: "Enquiry submitted successfully! We will contact you soon." }));
        setEnquiryForm({ name: "", phone: "", location: "", requirement: "Provide Feedback", message: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || t("enquiry.errorToast", { defaultValue: "Failed to submit enquiry" }));
      }
    } catch {
      toast.error(t("enquiry.errorGeneric", { defaultValue: "Error submitting enquiry" }));
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const navItems = [
    { id: "account", label: t("settings.menu.account", { defaultValue: "Account" }), icon: <User size={16} /> },
    { id: "verification", label: t("settings.menu.verification", { defaultValue: "Verification" }), icon: <ShieldCheck size={16} /> },
    { id: "support", label: t("settings.menu.support", { defaultValue: "Support & Help" }), icon: <HelpCircle size={16} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar variant="auth" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#172263] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">{t("settings.loading", { defaultValue: "Loading your settings..." })}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Section renderers ──────────────────────────────────────────────────────
  const renderAccount = () => (
    <div className="space-y-6">
      <SectionCard title={t("settings.account.basicInfo", { defaultValue: "Basic Information" })}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label={t("settings.account.fullName", { defaultValue: "Full Name" })} value={accountForm.name} onChange={v => setAccountForm(f => ({ ...f, name: v }))} icon={<User size={14} />} hint={t("settings.account.fullNameHint", { defaultValue: "Shown on your public profile" })} />
          <InputField label={t("settings.account.emailAddress", { defaultValue: "Email Address" })} value={settings?.email || ""} type="email" disabled hint={t("settings.account.emailHint", { defaultValue: "Email cannot be changed" })} icon={<Mail size={14} />} />
          <InputField label={t("settings.account.phoneNumber", { defaultValue: "Phone Number" })} value={accountForm.phone} onChange={v => setAccountForm(f => ({ ...f, phone: v }))} type="tel" icon={<Phone size={14} />} hint={t("settings.account.phoneHint", { defaultValue: "Shown to potential clients" })} />
          <InputField label={t("settings.account.whatsappNumber", { defaultValue: "WhatsApp Number" })} value={accountForm.whatsappNumber} onChange={v => setAccountForm(f => ({ ...f, whatsappNumber: v }))} type="tel" icon={<MessageCircle size={14} />} hint={t("settings.account.whatsappHint", { defaultValue: "For easier communication" })} />
          <div className="sm:col-span-2">
            <InputField label={t("settings.account.stateRegion", { defaultValue: "State / Region" })} value={accountForm.state} onChange={v => setAccountForm(f => ({ ...f, state: v }))} icon={<MapPin size={14} />} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#57585A] mb-1.5">{t("settings.account.bio", { defaultValue: "Bio / Description" })}</label>
            <textarea
              value={accountForm.bio}
              onChange={e => setAccountForm(f => ({ ...f, bio: e.target.value }))}
              maxLength={500}
              rows={3}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] resize-none focus:outline-none focus:ring-2 focus:ring-[#172263]/20 focus:border-[#172263]"
              placeholder={t("settings.account.bioPlaceholder", { defaultValue: "Tell others about yourself..." })}
            />
            <p className="text-xs text-zinc-400 mt-1">{t("settings.account.charactersCount", { count: accountForm.bio.length, defaultValue: `${accountForm.bio.length}/500 characters` })}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Info size={12} />
            {t("settings.account.createdDate", {
              date: settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString(i18n.language === "hi" ? "hi-IN" : i18n.language === "mr" ? "mr-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—",
              defaultValue: `Account created: ${settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}`
            })}
          </div>
          <button onClick={saveAccount} disabled={saving === "account"} className="flex items-center gap-2 bg-[#172263] hover:bg-[#11194A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <Save size={14} /> {saving === "account" ? t("settings.saving", { defaultValue: "Saving..." }) : t("settings.saveChanges", { defaultValue: "Save Changes" })}
          </button>
        </div>
      </SectionCard>

      <SectionCard title={t("settings.account.securityPassword", { defaultValue: "Security & Password" })}>
        <div className="space-y-4">
          <InputField label={t("settings.account.currentPassword", { defaultValue: "Current Password" })} value={passwordForm.current} onChange={v => setPasswordForm(f => ({ ...f, current: v }))} type="password" icon={<KeyRound size={14} />} />
          <div>
            <InputField label={t("settings.account.newPassword", { defaultValue: "New Password" })} value={passwordForm.newPass} onChange={v => setPasswordForm(f => ({ ...f, newPass: v }))} type="password" icon={<KeyRound size={14} />} />
            <PasswordStrength password={passwordForm.newPass} />
          </div>
          <InputField label={t("settings.account.confirmPassword", { defaultValue: "Confirm New Password" })} value={passwordForm.confirm} onChange={v => setPasswordForm(f => ({ ...f, confirm: v }))} type="password" icon={<KeyRound size={14} />} />
          {passwordForm.confirm && passwordForm.newPass !== passwordForm.confirm && (
            <p className="text-xs text-red-500 flex items-center gap-1"><XCircle size={11} /> {t("settings.account.passwordMismatch", { defaultValue: "Passwords do not match" })}</p>
          )}
          <div className="pt-2">
            <button onClick={savePassword} disabled={saving === "password"} className="flex items-center gap-2 bg-[#172263] hover:bg-[#11194A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              <KeyRound size={14} /> {saving === "password" ? t("settings.updating", { defaultValue: "Updating..." }) : t("settings.account.updatePassword", { defaultValue: "Update Password" })}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("settings.account.dangerZone", { defaultValue: "Danger Zone" })}>
        <div className="flex items-start justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div>
            <h4 className="text-sm font-bold text-red-700">{t("settings.account.deleteAccount", { defaultValue: "Delete Account" })}</h4>
            <p className="text-xs text-red-600 mt-0.5">{t("settings.account.deleteDesc", { defaultValue: "Permanently delete your account and all associated data. This action cannot be undone." })}</p>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
            <Trash2 size={13} /> {t("settings.delete", { defaultValue: "Delete" })}
          </button>
        </div>
      </SectionCard>
    </div>
  );



  const renderVerification = () => {
    let identityValue = t("settings.verification.identityValue", { defaultValue: "Government ID" });
    let identityVerified = false;
    let identityHint = t("settings.verification.identityHint", { defaultValue: "Upload Aadhaar or PAN to get verified" });
    let identityStatusText = t("settings.verification.notVerified", { defaultValue: "Not Verified" });

    if (operatorProfile) {
      if (operatorProfile.verification_status === "Approved") {
        identityValue = "Verified Operator (Driving License)";
        identityVerified = true;
        identityStatusText = "Verified ✓";
        identityHint = `Identity verified successfully ${
          operatorProfile.consent_timestamp
            ? "on " + new Date(operatorProfile.consent_timestamp).toLocaleDateString()
            : ""
        }`;
      } else if (operatorProfile.verification_status === "Pending") {
        identityValue = "Pending Review (Driving License)";
        identityVerified = false;
        identityStatusText = "Pending Approval";
        identityHint = `Documents submitted ${
          operatorProfile.consent_timestamp
            ? "on " + new Date(operatorProfile.consent_timestamp).toLocaleDateString()
            : ""
        } are pending administrator review.`;
      } else if (operatorProfile.verification_status === "Rejected") {
        identityValue = "Rejected (Driving License)";
        identityVerified = false;
        identityStatusText = "Rejected ✗";
        identityHint = `Rejection Feedback: ${
          operatorProfile.verification_feedback || "Documents rejected by admin."
        }. Please re-submit under Register Operator.`;
      } else {
        identityValue = "Government ID";
        identityVerified = false;
        identityStatusText = "Not Verified";
        identityHint = "Please start verification by registering as an operator.";
      }
    } else {
      identityValue = "Government ID";
      identityVerified = false;
      identityStatusText = "Not Verified";
      identityHint = "Verification is required for operator profiles. Register as an operator to start verification.";
    }

    return (
      <div className="space-y-6">
        <SectionCard title={t("settings.verification.statusTitle", { defaultValue: "Verification Status" })}>
          <div className="space-y-4">
            {[
              {
                label: t("settings.verification.emailLabel", { defaultValue: "Email Address" }),
                value: settings?.email,
                verified: true,
                statusText: t("settings.verification.verified", { defaultValue: "Verified ✓" }),
                hint: t("settings.verification.emailHint", { defaultValue: "Your email is verified on registration" }),
              },
              {
                label: t("settings.verification.phoneLabel", { defaultValue: "Phone Number" }),
                value: settings?.phone ? `+91-${settings.phone}` : t("settings.verification.phoneFallback", { defaultValue: "Not provided" }),
                verified: false,
                statusText: t("settings.verification.notVerified", { defaultValue: "Not Verified" }),
                hint: t("settings.verification.phoneHint", { defaultValue: "Phone verification coming soon" }),
              },
              {
                label: t("settings.verification.identityLabel", { defaultValue: "Identity Verification" }),
                value: identityValue,
                verified: identityVerified,
                statusText: identityStatusText,
                hint: identityHint,
              },
            ].map(item => (
              <div
                key={item.label}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  item.verified
                    ? "border-green-200 bg-green-50"
                    : item.statusText === "Pending Approval"
                    ? "border-amber-200 bg-amber-50"
                    : item.statusText.startsWith("Rejected")
                    ? "border-rose-200 bg-rose-50"
                    : "border-[#E2E8F0] bg-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.verified
                        ? "bg-green-100 text-green-600"
                        : item.statusText === "Pending Approval"
                        ? "bg-amber-100 text-amber-600"
                        : item.statusText.startsWith("Rejected")
                        ? "bg-rose-100 text-rose-600"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {item.verified ? (
                      <CheckCircle2 size={16} />
                    ) : item.statusText === "Pending Approval" ? (
                      <Clock size={16} className="animate-pulse" />
                    ) : (
                      <XCircle size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      item.verified
                        ? "bg-green-100 text-green-700"
                        : item.statusText === "Pending Approval"
                        ? "bg-amber-100 text-amber-700"
                        : item.statusText.startsWith("Rejected")
                        ? "bg-rose-100 text-rose-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {item.statusText}
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-1">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderSupport = () => (
    <div className="space-y-6">
      {/* Help Resources */}
      <SectionCard title={t("settings.support.helpResources", { defaultValue: "Help Resources" })}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: t("settings.support.viewProfile", { defaultValue: "View Profile" }), desc: t("settings.support.viewProfileDesc", { defaultValue: "Go to your public profile" }), link: "/profile", icon: <User size={16} className="text-[#172263]" /> },
            { label: t("settings.support.myHarvesters", { defaultValue: "My Harvesters" }), desc: t("settings.support.myHarvestersDesc", { defaultValue: "Manage your listings" }), link: "/profile?tab=listings", icon: <Tractor size={16} className="text-[#E82326]" /> },
            { label: t("settings.support.myOperators", { defaultValue: "My Operators" }), desc: t("settings.support.myOperatorsDesc", { defaultValue: "Manage your operator profile" }), link: "/profile?tab=operator", icon: <UserCheck size={16} className="text-[#172263]" /> },
            { label: t("settings.support.sendFeedback", { defaultValue: "Send Feedback" }), desc: t("settings.support.sendFeedbackDesc", { defaultValue: "Report issues or suggest features" }), link: "/enquiry?from=settings", icon: <MessageCircle size={16} className="text-green-600" /> },
            { label: t("settings.support.goToDashboard", { defaultValue: "Go to Dashboard" }), desc: t("settings.support.goToDashboardDesc", { defaultValue: "Return to your dashboard" }), link: "/dashboard", icon: <ChevronRight size={16} className="text-[#172263]" /> },
          ].map(item => (
            <Link key={item.label} to={item.link} className="flex items-center gap-3 p-3.5 bg-[#F8FAFC] hover:bg-[#EAEFF8] border border-[#E2E8F0] hover:border-[#172263]/30 rounded-xl transition-all cursor-pointer group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#172263] transition-colors">{item.label}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      {/* Enquiry Form */}
      <SectionCard title={t("settings.support.submitEnquiry", { defaultValue: "Submit an Enquiry" })}>
        <p className="text-sm text-zinc-500 mb-4">{t("settings.support.enquiryDesc", { defaultValue: "Have questions or need assistance? Fill out the form below and we'll get back to you." })}</p>
        <form onSubmit={submitEnquiry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#57585A] block mb-1.5">{t("enquiry.fullName", { defaultValue: "Full Name *" })}</label>
              <input
                value={enquiryForm.name}
                onChange={(e) => setEnquiryForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                placeholder={t("enquiry.placeholderName", { defaultValue: "Enter your name" })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#57585A] block mb-1.5">{t("enquiry.phone", { defaultValue: "Phone Number *" })}</label>
              <input
                value={enquiryForm.phone}
                onChange={(e) => setEnquiryForm(f => ({ ...f, phone: e.target.value }))}
                required
                type="tel"
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                placeholder={t("enquiry.placeholderPhone", { defaultValue: "Enter your phone number" })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#57585A] block mb-1.5">{t("enquiry.location", { defaultValue: "Location *" })}</label>
              <input
                value={enquiryForm.location}
                onChange={(e) => setEnquiryForm(f => ({ ...f, location: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                placeholder={t("enquiry.placeholderLocation", { defaultValue: "Enter your city/district" })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#57585A] block mb-1.5">{t("enquiry.category", { defaultValue: "Inquiry Category *" })}</label>
              <select
                value={enquiryForm.requirement}
                onChange={(e) => setEnquiryForm(f => ({ ...f, requirement: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
              >
                <option value="Share Experience">{t("enquiry.options.experience", { defaultValue: "Share Experience" })}</option>
                <option value="Provide Feedback">{t("enquiry.options.feedback", { defaultValue: "Provide Feedback" })}</option>
                <option value="Submit a Complaint">{t("enquiry.options.complaint", { defaultValue: "Submit a Complaint" })}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#57585A] block mb-1.5">{t("enquiry.message", { defaultValue: "Message / Description *" })}</label>
            <textarea
              value={enquiryForm.message}
              onChange={(e) => setEnquiryForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none"
              placeholder={t("enquiry.placeholderMessage", { defaultValue: "Please describe your experience, feedback, or complaint in detail..." })}
            />
          </div>
          <button
            type="submit"
            disabled={submittingEnquiry}
            className="w-full py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            {submittingEnquiry ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t("enquiry.submit", { defaultValue: "Submit Enquiry" })
            )}
          </button>
        </form>
      </SectionCard>

      {/* Legal & Policies */}
      <SectionCard title={t("settings.support.legalPolicies", { defaultValue: "Legal & Policies" })}>
        <div className="space-y-3">
          {[
            { label: t("settings.support.terms", { defaultValue: "Terms of Service" }), desc: t("settings.support.termsDesc", { defaultValue: "Read our terms and conditions" }) },
            { label: t("settings.support.privacy", { defaultValue: "Privacy Policy" }), desc: t("settings.support.privacyDesc", { defaultValue: "How we handle your data" }) },
            { label: t("settings.support.community", { defaultValue: "Community Guidelines" }), desc: t("settings.support.communityDesc", { defaultValue: "Platform rules and best practices" }) },
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
            {t("settings.backToDashboard", { defaultValue: "Back to Dashboard" })}
          </Link>
          <span className="text-zinc-300">|</span>
          <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif" }}>{t("settings.title", { defaultValue: "Settings" })}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-sm sticky top-24">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider px-3 mb-2">{t("settings.settingsMenu", { defaultValue: "Settings Menu" })}</p>
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
                <h3 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif" }}>{t("settings.account.deleteModal.title", { defaultValue: "Delete Account?" })}</h3>
                <p className="text-xs text-zinc-400">{t("settings.account.deleteModal.sub", { defaultValue: "This action is irreversible" })}</p>
              </div>
            </div>
            <p className="text-sm text-[#57585A] mb-5">{t("settings.account.deleteModal.desc", { defaultValue: "All your data — harvesters, operator profiles, messages, and requests — will be permanently deleted." })}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#57585A] mb-1.5">{t("settings.account.deleteModal.passwordLabel", { defaultValue: "Enter your password" })}</label>
                <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                  placeholder={t("settings.account.deleteModal.passwordPlaceholder", { defaultValue: "Your current password" })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#57585A] mb-1.5">
                  {t("settings.account.deleteModal.confirmLabel", { defaultValue: "Type DELETE to confirm" })}
                </label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={t("settings.account.deleteModal.confirmPlaceholder", { defaultValue: "DELETE" })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteConfirmText(""); }}
                className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#57585A] hover:bg-zinc-50 transition-colors">
                {t("settings.cancel", { defaultValue: "Cancel" })}
              </button>
              <button onClick={deleteAccount} disabled={saving === "delete" || deleteConfirmText !== "DELETE" || !deletePassword}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <Trash2 size={14} /> {saving === "delete" ? t("settings.deleting", { defaultValue: "Deleting..." }) : t("settings.account.deleteModal.deleteButton", { defaultValue: "Delete Forever" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

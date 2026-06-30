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
      const token = localStorage.getItem("tractorsewa_token");
      let finalImagePath = imagePath;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImagePath = uploadData.url;
        } else {
          toast.error(t("editProfile.errorUploadImage", { defaultValue: "Failed to upload profile image" }));
        }
      }
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

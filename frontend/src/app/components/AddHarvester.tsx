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
import { CameraCaptureDialog } from "./CameraCaptureDialog";

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

  // Specifications
  const [serialNo, setSerialNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [mfgMonthYear, setMfgMonthYear] = useState("");
  const [engineNo, setEngineNo] = useState("");
  const [enginePower, setEnginePower] = useState("");
  const [engineMake, setEngineMake] = useState("");
  const [engineModel, setEngineModel] = useState("");
  const [serviceHotlineNo, setServiceHotlineNo] = useState("");

  // Photos capture up to 5
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);

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

    // First 5 fields validation (Model, Serial No, Chassis No, Month/Year of MFG, Engine No)
    if (!finalModel.trim()) {
      toast.error("Harvester model is required");
      return;
    }
    if (!serialNo.trim()) {
      toast.error("Serial Number is required");
      return;
    }
    if (!chassisNo.trim()) {
      toast.error("Chassis Number is required");
      return;
    }
    if (!mfgMonthYear.trim()) {
      toast.error("Month/Year of Manufacturing is required");
      return;
    }
    if (!engineNo.trim()) {
      toast.error("Engine Number is required");
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
    
    if (photos.length === 0) {
      toast.error("Please capture at least one harvester photo");
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
      const token = localStorage.getItem("tractorsewa_token");
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrls.push(uploadData.url);
        } else {
          throw new Error("Failed to upload photo: " + file.name);
        }
      }

      const imagePath = JSON.stringify(uploadedUrls);
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
          imagePath,
          serialNo,
          chassisNo,
          mfgMonthYear,
          engineNo,
          enginePower,
          engineMake,
          engineModel,
          serviceHotlineNo
        })
      });

      if (res.ok) {
        toast.success(t("addHarvester.toastSuccess", { defaultValue: "Harvester listed successfully!" }));
        navigate("/harvesters");
      } else {
        const err = await res.json();
        toast.error(err.error || t("addHarvester.toastFailed", { defaultValue: "Failed to list harvester" }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || t("addHarvester.toastError", { defaultValue: "Error listing harvester" }));
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
          
          {/* Photo Capture up to 5 photos */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#57585A] block mb-1">Harvester Photos (Take up to 5 photos) *</label>
            
            {photoPreviews.length === 0 ? (
              // Centered Empty State Take Photo Trigger
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-[#172263] rounded-2xl max-w-sm mx-auto text-center gap-4 transition-all hover:bg-blue-50/20">
                <div className="p-4 bg-blue-50 rounded-full text-[#172263]">
                  <Camera size={36} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] font-sora">No Photos Taken Yet</h4>
                  <p className="text-xs text-[#57585A] mt-1 px-4">Take the first photo of the harvester to begin listing.</p>
                </div>
                <div className="flex flex-col gap-2 w-full px-4">
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    className="w-full py-2.5 bg-[#172263] hover:bg-[#11194A] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Camera size={16} /> Take Harvester Photo
                  </button>
                  <label className="cursor-pointer w-full py-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-500 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotos(prev => [...prev, file]);
                          setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
                        }
                        e.target.value = "";
                      }}
                    />
                    <span>Use Device Camera</span>
                  </label>
                </div>
              </div>
            ) : (
              // Standard Grid Layout
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {photoPreviews.map((url, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotos(prev => prev.filter((_, i) => i !== idx));
                        setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-90 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-semibold">
                      {idx === 1 ? "Chassis No. Photo" : `Harvester Photo ${idx === 0 ? 1 : idx}`}
                    </span>
                  </div>
                ))}

                {photoPreviews.length < 5 && (
                  <div className="flex flex-col gap-2 aspect-[4/3]">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="flex-1 border-2 border-dashed border-[#172263] rounded-xl bg-blue-50/50 hover:bg-blue-100/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-[#172263]"
                    >
                      <Camera size={24} className="text-[#172263]" />
                      <span className="text-[11px] font-bold">
                        {photoPreviews.length === 1 ? "Take Chassis No. Photo" : "Take Harvester Photo"}
                      </span>
                    </button>
                    
                    <label className="cursor-pointer border border-[#E2E8F0] hover:bg-slate-50 transition-colors rounded-xl py-1 text-center text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1 shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPhotos(prev => [...prev, file]);
                            setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
                          }
                          e.target.value = "";
                        }}
                      />
                      <span>Use Device Cam</span>
                    </label>
                  </div>
                )}
              </div>
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
              <label className="text-sm text-[#57585A] block mb-1.5">Harvester Model *</label>
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
              <label className="text-sm text-[#57585A] block mb-1.5">Custom Model Name *</label>
              <input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder={t("addHarvester.customModelPlaceholder", { defaultValue: "Enter harvester model name (e.g. S660)" })}
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
              />
            </div>
          )}

          {/* Machine Plate Specifications Form Section */}
          <div className="border-t border-[#E2E8F0] pt-5 space-y-4">
            <h3 className="text-base font-bold text-[#1A1A1A] font-sora">Machine Plate Specifications</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Serial Number *</label>
                <input
                  type="text"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  placeholder="Enter Serial Number"
                  required
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Chassis Number *</label>
                <input
                  type="text"
                  value={chassisNo}
                  onChange={(e) => setChassisNo(e.target.value)}
                  placeholder="Enter Chassis Number"
                  required
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Month / Year of Mfg *</label>
                <input
                  type="text"
                  value={mfgMonthYear}
                  onChange={(e) => setMfgMonthYear(e.target.value)}
                  placeholder="e.g. 05 / 2024"
                  required
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Engine Number *</label>
                <input
                  type="text"
                  value={engineNo}
                  onChange={(e) => setEngineNo(e.target.value)}
                  placeholder="Enter Engine Number"
                  required
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Engine Power</label>
                <input
                  type="text"
                  value={enginePower}
                  onChange={(e) => setEnginePower(e.target.value)}
                  placeholder="e.g. 73.5kw / 2600 / min"
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Engine Make</label>
                <input
                  type="text"
                  value={engineMake}
                  onChange={(e) => setEngineMake(e.target.value)}
                  placeholder="e.g. ZHEJIANG XINCHAI CO. LTD."
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Engine Model</label>
                <input
                  type="text"
                  value={engineModel}
                  onChange={(e) => setEngineModel(e.target.value)}
                  placeholder="e.g. 4D35ZT"
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#57585A] block mb-1">Service Hotline Number</label>
                <input
                  type="text"
                  value={serviceHotlineNo}
                  onChange={(e) => setServiceHotlineNo(e.target.value)}
                  placeholder="e.g. 9209392096"
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                />
              </div>
            </div>
          </div>

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

      <CameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        title={photoPreviews.length === 1 ? "Upload Chassis No. Photo" : "Take Harvester Photo"}
        onCapture={(file) => {
          setPhotos(prev => [...prev, file]);
          setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
        }}
      />
    </div>
  );
}

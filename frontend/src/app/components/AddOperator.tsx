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

  // ID Verification states
  const [operatorProfile, setOperatorProfile] = useState<any>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyingSuccess, setVerifyingSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Verification stepper states
  const [verificationStep, setVerificationStep] = useState(1);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [licenseFrontFile, setLicenseFrontFile] = useState<File | null>(null);
  const [licenseFrontPreview, setLicenseFrontPreview] = useState("");
  const [licenseBackFile, setLicenseBackFile] = useState<File | null>(null);
  const [licenseBackPreview, setLicenseBackPreview] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const defaultState = localStorage.getItem("tractorsewa_default_state");
    const defaultDistrict = localStorage.getItem("tractorsewa_default_district");
    if (defaultState) setState(defaultState);
    if (defaultDistrict) setLocation(defaultDistrict);
  }, []);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          const opRes = await fetch(`/api/operators?userId=${meData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (opRes.ok) {
            const opData = await opRes.json();
            if (opData.length > 0) {
              const op = opData[0];
              setOperatorProfile(op);
              
              if (op.verification_status === 'Approved') {
                if (op.experience > 0) {
                  // Profile details completed, send to profile settings
                  navigate('/profile');
                } else {
                  // Approved but skeleton details, prefill states
                  setName(op.name || "");
                  setExperience(op.experience ? String(op.experience) : "");
                  setLocation(op.location || "");
                  setState(op.state || "Maharashtra");
                  setAvailability(op.availability || "Available");
                  setDescription(op.description || "");
                  setPhone(op.phone || "");
                  setWhatsapp(op.whatsapp || "");
                }
              } else if (op.verification_status === 'Pending') {
                // Stay on pending screen
              } else if (op.verification_status === 'Rejected') {
                setShowPopup(true);
              } else if (!op.selfie_image_path) {
                setShowPopup(true);
              }
            } else {
              setShowPopup(true);
            }
          }
        }
      } catch (err) {
        console.error("Error checking operator profile:", err);
      } finally {
        setIsCheckingProfile(false);
      }
    };
    checkVerification();
  }, [navigate]);

  // Webcam Capture Handlers
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setWebcamStream(stream);
    } catch (err) {
      console.error("Failed to access webcam:", err);
      toast.error("Could not access webcam. Please check your camera permissions.");
    }
  };

  useEffect(() => {
    if (webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  };

  const captureSelfie = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedSelfie(dataUrl);
        stopWebcam();
      }
    }
  };

  const handleVerificationSubmit = async () => {
    if (!capturedSelfie) {
      toast.error("Please capture your live selfie.");
      return;
    }
    if (!licenseFrontFile || !licenseBackFile) {
      toast.error("Please upload both driving license front and back sides.");
      return;
    }
    if (!consentChecked) {
      toast.error("Please check the consent box to proceed.");
      return;
    }

    setIsSubmittingVerification(true);
    try {
      const dataURLtoBlob = (dataurl: string) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      const formData = new FormData();
      const selfieBlob = dataURLtoBlob(capturedSelfie);
      formData.append('selfie', selfieBlob, 'selfie.png');
      formData.append('licenseFront', licenseFrontFile);
      formData.append('licenseBack', licenseBackFile);
      formData.append('consent', 'true');

      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch('/api/operators/verify-id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        toast.success("Verification details submitted successfully!");
        setVerifyingSuccess(true);
        // Refresh operator profile status
        const opRes = await fetch(`/api/operators?userId=me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (opRes.ok) {
          const opData = await opRes.json();
          if (opData.length > 0) setOperatorProfile(opData[0]);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit verification.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting verification.");
    } finally {
      setIsSubmittingVerification(false);
    }
  };

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
      const token = localStorage.getItem("tractorsewa_token");
      let imagePath = null;
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
          imagePath = uploadData.url;
        }
      }
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

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <Navbar variant="auth" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
          <Loader2 size={40} className="animate-spin text-[#172263] mx-auto" />
          <p className="text-[#57585A] font-semibold text-sm">Checking operator profile verification status...</p>
        </div>
      </div>
    );
  }

  if (operatorProfile?.verification_status === 'Pending') {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <Navbar variant="auth" />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center space-y-6 bg-white border border-zinc-200 shadow-sm rounded-3xl mt-12">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-100">
            <Clock size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-[#1A1A1A] font-sora">ID Verification Pending</h3>
            <p className="text-sm text-zinc-550 leading-relaxed font-sora">
              Your identity verification documents are currently being reviewed by our administrators.
              Once your account is verified, you will be able to complete your skills and availability details.
            </p>
          </div>
          {operatorProfile.verification_feedback && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-left text-xs text-zinc-650 leading-relaxed font-sora">
              <strong className="block text-zinc-800 mb-1">Previous Rejection Reason:</strong>
              {operatorProfile.verification_feedback}
            </div>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-[#172263] hover:bg-opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm font-sora"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (verifyingSuccess) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <Navbar variant="auth" />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center space-y-6 bg-white border border-zinc-200 shadow-sm rounded-3xl mt-12">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 animate-bounce">
            <ShieldCheck size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-[#1A1A1A] font-sora">Verification Submitted</h3>
            <p className="text-sm text-zinc-550 leading-relaxed font-sora">
              Your documents have been submitted securely and cryptographically signed.
              The administrator will verify your profile shortly. You will be notified of the decision.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-[#172263] hover:bg-opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm font-sora"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showPopup && !verifying) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <Navbar variant="auth" />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center space-y-6 bg-white border border-zinc-200 shadow-sm rounded-3xl mt-12">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 border border-blue-100">
            <UserCheck size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-[#1A1A1A] font-sora">Identity Verification Required</h3>
            <p className="text-sm text-zinc-550 leading-relaxed font-sora">
              To build a trusted community, all tractor operators must verify their driving license and submit a live selfie. 
              This is a quick, one-time manual verification process.
            </p>
          </div>
          {operatorProfile?.verification_status === 'Rejected' && operatorProfile?.verification_feedback && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-left text-xs text-rose-700 leading-relaxed font-sora">
              <strong className="block text-rose-800 mb-1">Rejection Feedback:</strong>
              {operatorProfile.verification_feedback}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition font-sora"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setVerifying(true);
                startWebcam();
              }}
              className="flex-1 py-3 bg-[#172263] hover:bg-opacity-90 text-white rounded-xl text-xs font-bold transition shadow-sm font-sora"
            >
              Verify Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verifying) {
    const vSteps = [
      "Live Selfie",
      "Driving License Files",
      "Consent & Submit"
    ];
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <Navbar variant="auth" />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
          <button 
            onClick={() => { stopWebcam(); setVerifying(false); navigate('/dashboard'); }}
            className="inline-flex items-center gap-2 text-[#57585A] text-sm mb-6 hover:text-[#172263] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <PageHeader 
            title="Operator Identity Verification" 
            subtitle="Please complete these 3 simple steps to verify your operator profile." 
          />

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {vSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${verificationStep > i + 1 ? "bg-green-600 text-white" : verificationStep === i + 1 ? "bg-[#172263] text-white" : "bg-[#E2E8F0] text-[#57585A]"}`}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  {verificationStep > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${verificationStep === i + 1 ? "text-[#172263]" : "text-[#57585A]"}`}>{s}</span>
                {i < vSteps.length - 1 && <div className={`flex-1 h-0.5 ${verificationStep > i + 1 ? "bg-green-400" : "bg-[#E2E8F0]"}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
            {/* Step 1: Live Selfie Capture */}
            {verificationStep === 1 && (
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#1A1A1A] font-sora">Step 1: Capture Live Selfie</h4>
                  <p className="text-xs text-[#57585A] leading-relaxed max-w-sm mx-auto">
                    Please face the camera and ensure your face is fully visible and well-lit. We use a live capture to prevent fake profile photos.
                  </p>
                </div>

                <div className="aspect-video max-w-sm mx-auto w-full bg-slate-100 rounded-2xl overflow-hidden border border-zinc-200 relative flex items-center justify-center">
                  {capturedSelfie ? (
                    <img src={capturedSelfie} alt="Selfie preview" className="w-full h-full object-cover" />
                  ) : webcamStream ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-400 italic text-xs">
                      <Camera size={40} className="text-zinc-300" />
                      Camera stream not started
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-3">
                  {!capturedSelfie ? (
                    <>
                      {!webcamStream && (
                        <button
                          onClick={startWebcam}
                          className="px-6 py-2.5 bg-[#172263] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-opacity-90"
                        >
                          Start Camera
                        </button>
                      )}
                      {webcamStream && (
                        <button
                          onClick={captureSelfie}
                          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm"
                        >
                          Capture Selfie
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setCapturedSelfie(null);
                        startWebcam();
                      }}
                      className="px-6 py-2.5 bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl hover:bg-zinc-300"
                    >
                      Retake Photo
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-150 flex justify-end">
                  <button
                    onClick={() => { stopWebcam(); setVerificationStep(2); }}
                    disabled={!capturedSelfie}
                    className="px-6 py-2.5 bg-[#172263] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 text-white text-xs font-bold rounded-xl shadow-sm font-sora"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Driving License Front & Back */}
            {verificationStep === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h4 className="text-lg font-bold text-[#1A1A1A] font-sora">Step 2: Upload Driving License</h4>
                  <p className="text-xs text-[#57585A] leading-relaxed max-w-sm mx-auto">
                    Please upload clear photos of your Driving License from both sides for admin manual review.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Front Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-600">License FRONT Side</label>
                    <div 
                      onClick={() => document.getElementById('license-front-input')?.click()}
                      className="border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50 hover:bg-zinc-100 cursor-pointer h-36 flex flex-col items-center justify-center relative overflow-hidden transition"
                    >
                      <input 
                        type="file" 
                        id="license-front-input" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLicenseFrontFile(file);
                            setLicenseFrontPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {licenseFrontPreview ? (
                        <img src={licenseFrontPreview} alt="License Front" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Upload size={24} className="text-zinc-400 mx-auto mb-1" />
                          <span className="text-[10px] text-zinc-500 font-semibold block">Click to upload Front</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-zinc-600">License BACK Side</label>
                    <div 
                      onClick={() => document.getElementById('license-back-input')?.click()}
                      className="border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50 hover:bg-zinc-100 cursor-pointer h-36 flex flex-col items-center justify-center relative overflow-hidden transition"
                    >
                      <input 
                        type="file" 
                        id="license-back-input" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLicenseBackFile(file);
                            setLicenseBackPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {licenseBackPreview ? (
                        <img src={licenseBackPreview} alt="License Back" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Upload size={24} className="text-zinc-400 mx-auto mb-1" />
                          <span className="text-[10px] text-zinc-500 font-semibold block">Click to upload Back</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-150 flex justify-between">
                  <button
                    onClick={() => { setVerificationStep(1); startWebcam(); }}
                    className="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setVerificationStep(3)}
                    disabled={!licenseFrontFile || !licenseBackFile}
                    className="px-6 py-2.5 bg-[#172263] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Consent & Submit */}
            {verificationStep === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h4 className="text-lg font-bold text-[#1A1A1A] font-sora">Step 3: Legal Consent & Submit</h4>
                  <p className="text-xs text-[#57585A] leading-relaxed max-w-sm mx-auto">
                    Please read and accept our verification policy terms to complete your submission.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                  <p className="text-xs leading-relaxed text-zinc-600 font-medium">
                    I hereby explicitly consent to Tractor Seva collecting and processing my live selfie and driving license images solely for the purpose of verifying my profile. I understand this data will be stored securely and reviewed manually by the system administrator.
                  </p>
                  <div className="flex items-start gap-2.5 pt-2 border-t border-blue-100">
                    <input 
                      type="checkbox" 
                      id="consent-checkbox" 
                      checked={consentChecked} 
                      onChange={(e) => setConsentChecked(e.target.checked)} 
                      className="mt-0.5 rounded text-[#172263] focus:ring-[#172263]"
                    />
                    <label htmlFor="consent-checkbox" className="text-[11px] text-zinc-700 font-bold leading-tight cursor-pointer">
                      I agree and give my cryptographic legal consent for ID verification.
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-150 flex justify-between">
                  <button
                    onClick={() => setVerificationStep(2)}
                    className="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerificationSubmit}
                    disabled={isSubmittingVerification || !consentChecked}
                    className="px-6 py-2.5 bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    {isSubmittingVerification && <Loader2 size={12} className="animate-spin" />}
                    Submit Verification
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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

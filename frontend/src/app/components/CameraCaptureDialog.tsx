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

// ===========================
// CAMERA CAPTURE DIALOG
// ===========================
export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
  title?: string;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    async function initCamera() {
      try {
        setError(null);
        // Request permissions first to ensure devices are enumerated
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        initialStream.getTracks().forEach(t => t.stop());

        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);

        // Prefer back camera (environment) if available
        let defaultDevice = videoDevices.find(d => 
          d.label.toLowerCase().includes("back") || 
          d.label.toLowerCase().includes("environment") || 
          d.label.toLowerCase().includes("rear")
        );
        if (!defaultDevice && videoDevices.length > 0) {
          defaultDevice = videoDevices[0];
        }

        const deviceIdToUse = defaultDevice ? defaultDevice.deviceId : undefined;
        if (defaultDevice) {
          setActiveDeviceId(defaultDevice.deviceId);
        }
        await startStream(deviceIdToUse);
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please make sure permissions are granted.");
      }
    }

    initCamera();
    return () => stopCamera();
  }, [open]);

  const startStream = async (deviceId?: string) => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Failed to start camera stream:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr: any) {
        setError("Camera stream failed. " + fallbackErr.message);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    setActiveDeviceId(nextDevice.deviceId);
    await startStream(nextDevice.deviceId);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `harvester_photo_${Date.now()}.jpg`, { type: "image/jpeg" });
          onCapture(file);
          onOpenChange(false);
        }
      }, "image/jpeg", 0.9);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(false); }}>
      <DialogContent className="max-w-lg bg-[#ffffff] border-[#E2E8F0] p-6 rounded-2xl flex flex-col items-center">
        <DialogHeader className="w-full">
          <div className="flex justify-between items-center w-full">
            <DialogTitle className="text-lg font-bold font-sora text-[#1A1A1A]">{title || "Take Harvester Photo"}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="w-full bg-[#1A1A1A] rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center relative mt-4">
          {error ? (
            <p className="text-red-400 text-sm p-4 text-center">{error}</p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex gap-4 mt-6 w-full justify-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold"
          >
            Cancel
          </button>
          
          {devices.length > 1 && (
            <button
              type="button"
              onClick={switchCamera}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <RotateCw size={16} /> Switch Camera
            </button>
          )}

          {!error && (
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-2.5 bg-[#172263] text-white hover:bg-[#11194A] rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <Camera size={16} /> Capture
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

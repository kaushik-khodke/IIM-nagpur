import { useState, useEffect, useRef, Fragment, useMemo, FormEvent } from "react";
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
  useIsMobile,
  BottomSheet,
} from "./shared";
import { toast } from "sonner";
import districtsData from "./districts.json";
import { detectUserLocation, matchLocationWithDistricts } from "./locationHelper";
import { ImageCropperDialog } from "./ImageCropperDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown } from "./pagesShared";

// REQUESTS
// ===========================
export function Requests() {
  const { t } = useTranslation(["pages", "static"]);
  const [requests, setRequests] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [reqType, setReqType] = useState<"operator" | "harvester">("harvester");
  const [activeReqTab, setActiveReqTab] = useState<"pending" | "history">("pending");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [newReq, setNewReq] = useState({ location: "", state: "", machineType: "", duration: "", startDate: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        if (token) {
          const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Load default location or trigger detection prompt
  useEffect(() => {
    const defaultState = localStorage.getItem("tractorsewa_default_state");
    const defaultDistrict = localStorage.getItem("tractorsewa_default_district");
    const dismissed = localStorage.getItem("tractorsewa_location_dismissed");

    if (defaultState && defaultDistrict) {
      setSelectedState(defaultState);
      setSelectedDistrict(defaultDistrict);
    } else if (dismissed !== "true") {
      const toastId = toast(t("requests.locationPrompt", { defaultValue: "📍 Optimize search results by auto-detecting your location." }), {
        action: {
          label: t("requests.detect", { defaultValue: "Detect" }),
          onClick: async () => {
            const loadingToastId = toast.loading(t("requests.detectingLocation", { defaultValue: "Detecting location..." }));
            const detected = await detectUserLocation();
            toast.dismiss(loadingToastId);
            if (detected) {
              const matched = matchLocationWithDistricts(detected.state, detected.district);
              if (matched) {
                localStorage.setItem("tractorsewa_default_state", matched.state);
                localStorage.setItem("tractorsewa_default_district", matched.district);
                setSelectedState(matched.state);
                setSelectedDistrict(matched.district);
                toast.success(t("requests.locationSet", { defaultValue: "Location set to {{district}}, {{state}}!", district: matched.district, state: matched.state }));
              } else {
                toast.error(t("requests.locationMatchError", { defaultValue: "Could not match your location with Indian states/districts." }));
              }
            } else {
              toast.error(t("requests.locationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
            }
          }
        },
        cancel: {
          label: t("requests.dismiss", { defaultValue: "Dismiss" }),
          onClick: () => {
            localStorage.setItem("tractorsewa_location_dismissed", "true");
          }
        },
        duration: 10000,
      });
      return () => { toast.dismiss(toastId); };
    }
  }, [t]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/requests?location=${encodeURIComponent(selectedDistrict)}&state=${encodeURIComponent(selectedState)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedState, selectedDistrict]);

  // Handle auto-detect for Dialog
  const handleDialogDetectLocation = async () => {
    const loadingToastId = toast.loading(t("requests.dialogDetectingLocation", { defaultValue: "Detecting location..." }));
    const detected = await detectUserLocation();
    toast.dismiss(loadingToastId);
    if (detected) {
      const matched = matchLocationWithDistricts(detected.state, detected.district);
      if (matched) {
        setNewReq(prev => ({
          ...prev,
          state: matched.state,
          location: matched.district
        }));
        toast.success(t("requests.dialogLocationSet", { defaultValue: "Location set to {{district}}, {{state}}", district: matched.district, state: matched.state }));
      } else {
        toast.error(t("requests.dialogLocationMatchError", { defaultValue: "Could not match location with Indian states/districts." }));
      }
    } else {
      toast.error(t("requests.dialogLocationDetectError", { defaultValue: "Could not detect location. Please select manually." }));
    }
  };

  const postReq = async () => {
    if (!newReq.location || !newReq.state || !newReq.machineType || !newReq.startDate) {
      toast.error(t("requests.toastFillRequired", { defaultValue: "Please fill out all required fields" }));
      return;
    }
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "harvester",
          ...newReq
        })
      });

      if (res.ok) {
        setShowDialog(false);
        setNewReq({ location: "", state: "", machineType: "", duration: "", startDate: "", description: "" });
        toast.success(t("requests.toastPostSuccess", { defaultValue: "Requirement posted successfully!" }));
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || t("requests.toastPostFailed", { defaultValue: "Failed to post requirement" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("requests.toastPostError", { defaultValue: "Error posting requirement" }));
    }
  };

  const deleteReq = async (id: number) => {
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setConfirmDelete(null);
        toast.success(t("requests.toastDeleteSuccess", { defaultValue: "Requirement deleted." }));
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || t("requests.toastDeleteFailed", { defaultValue: "Failed to delete" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("requests.toastDeleteError", { defaultValue: "Error deleting requirement" }));
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "Pending" || r.status === "Open");
  const historyRequests = requests.filter((r) => r.status === "Accepted" || r.status === "Rejected");
  const filtered = activeReqTab === "pending" ? pendingRequests : historyRequests;

  const isMobile = useIsMobile();
  if (isMobile) {
    const districts = newReq.state
      ? districtsData.states.find((s: any) => s.state === newReq.state)?.districts || []
      : [];

    function handleDelete(arg0: number): void {
      throw new Error("Function not implemented.");
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
      throw new Error("Function not implemented.");
    }

    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 text-left font-sans relative">
        <Navbar variant="auth" />

        <div className="px-4 pt-4">
          {/* Top segment control */}
          <div className="flex bg-white border border-slate-200/60 p-1 rounded-2xl mb-4 shadow-xs">
            <button
              onClick={() => setActiveReqTab("pending")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeReqTab === "pending" ? "bg-[#172263] text-white shadow-xs" : "text-[#57585A]"
              }`}
            >
              Active Requests ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveReqTab("history")}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeReqTab === "history" ? "bg-[#172263] text-white shadow-xs" : "text-[#57585A]"
              }`}
            >
              History ({historyRequests.length})
            </button>
          </div>

          {/* Listings view */}
          {loading ? (
            <div className="space-y-4 mt-2">
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={activeReqTab === "pending" ? "No Active Requirements" : "No Past History"}
              description="Post a request when you need agricultural machinery or skilled operators."
              actionLabel="Post Requirement"
              onAction={() => setShowDialog(true)}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => (
                <div
                  key={req.id}
                  onClick={() => navigator(`/requests/${req.id}`)}
                  className="bg-white border border-slate-200/60 rounded-3xl p-4 shadow-xs hover:border-[#172263]/30 active:scale-[0.99] transition-all flex flex-col gap-2 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      req.type.toLowerCase().includes('harvester') ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {req.type.toLowerCase().includes('harvester') ? 'Machinery' : 'Operator'}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      req.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                      req.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-800 font-sora line-clamp-1">
                    {req.machineType || "General Assistance Required"}
                  </h4>
                  <p className="text-xs text-[#57585A] line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1.5 text-[10px] text-zinc-400 font-semibold">
                    <span className="flex items-center gap-0.5"><MapPin size={11} className="text-rose-500" /> {req.location}, {req.state}</span>
                    <span>Date: {new Date(req.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {currentUser && currentUser.name === req.userName && (
                    <div className="flex gap-2 justify-end border-t border-slate-50 pt-2 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(req.id);
                        }}
                        className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky floating action button */}
        <button
          onClick={() => setShowDialog(true)}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 bg-[#172263] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={24} className="stroke-[2.5px]" />
        </button>

        {/* Delete Confirmation Sheet */}
        <BottomSheet
          isOpen={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
          title="Delete Post"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#57585A]">Are you sure you want to delete this listing requirement? This action is irreversible.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-[#57585A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete!)}
                className="py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </BottomSheet>

        {/* New Request Bottom Sheet Form */}
        <BottomSheet
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          title="Post Requirement"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
              setShowDialog(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">Requirement Type</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReqType("harvester")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    reqType === "harvester" ? "bg-[#172263] text-white" : "text-[#57585A]"
                  }`}
                >
                  Machinery
                </button>
                <button
                  type="button"
                  onClick={() => setReqType("operator")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    reqType === "operator" ? "bg-[#172263] text-white" : "text-[#57585A]"
                  }`}
                >
                  Operator
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">Machine / Category</label>
              <input
                type="text"
                required
                value={newReq.machineType}
                onChange={(e) => setNewReq({ ...newReq, machineType: e.target.value })}
                placeholder="e.g. Combine Harvester, Tractor Operator"
                className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">State</label>
                <select
                  value={newReq.state}
                  required
                  onChange={(e) => setNewReq({ ...newReq, state: e.target.value, location: "" })}
                  className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] font-semibold"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">District</label>
                <select
                  value={newReq.location}
                  required
                  disabled={!newReq.state}
                  onChange={(e) => setNewReq({ ...newReq, location: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] font-semibold disabled:opacity-50"
                >
                  <option value="">Select District</option>
                  {districts.map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">Duration</label>
                <input
                  type="text"
                  required
                  value={newReq.duration}
                  onChange={(e) => setNewReq({ ...newReq, duration: e.target.value })}
                  placeholder="e.g. 5 days, 2 weeks"
                  className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  value={newReq.startDate}
                  onChange={(e) => setNewReq({ ...newReq, startDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#57585A] block mb-1.5">Job Description</label>
              <textarea
                value={newReq.description}
                onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                placeholder="Details about fields, crop, machinery required etc."
                rows={3}
                className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#172263] font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#172263] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer mt-2"
            >
              Post Request
            </button>
          </form>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="w-full mx-auto px-4 sm:px-6 py-8">
        <PageHeader
          title={t("requests.title", { defaultValue: "My Crop Requirements" })}
          action={
            <button
              onClick={() => {
                const defaultState = localStorage.getItem("tractorsewa_default_state") || "";
                const defaultDistrict = localStorage.getItem("tractorsewa_default_district") || "";
                setNewReq({
                  location: defaultDistrict,
                  state: defaultState,
                  machineType: "",
                  duration: "",
                  startDate: "",
                  description: ""
                });
                setShowDialog(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors"
            >
              <Plus size={16} /> {t("requests.postRequirement", { defaultValue: "Post Requirement" })}
            </button>
          }
        />

        {/* Tabs and filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveReqTab("pending")}
              className={`px-5 py-2.5 rounded-xl text-sm border-2 transition-all ${
                activeReqTab === "pending"
                  ? "border-[#172263] bg-blue-50 text-[#172263] font-semibold"
                  : "border-[#E2E8F0] text-[#57585A] hover:border-blue-200"
              }`}
            >
              {t("requests.pendingTab", { defaultValue: "Pending Requests" })} ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveReqTab("history")}
              className={`px-5 py-2.5 rounded-xl text-sm border-2 transition-all ${
                activeReqTab === "history"
                  ? "border-[#172263] bg-blue-50 text-[#172263] font-semibold"
                  : "border-[#E2E8F0] text-[#57585A] hover:border-blue-200"
              }`}
            >
              {t("requests.historyTab", { defaultValue: "Request History" })} ({historyRequests.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-white w-40"
            >
              <option value="">{t("requests.allStates", { defaultValue: "All States" })}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-white w-40 disabled:opacity-50"
            >
              <option value="">{t("requests.allDistricts", { defaultValue: "All Districts" })}</option>
              {selectedState &&
                districtsData.states
                  .find((s) => s.state === selectedState)
                  ?.districts.map((d) => (
                    <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                  ))}
            </select>
            {(selectedState || selectedDistrict) && (
              <button
                onClick={() => {
                  setSelectedState("");
                  setSelectedDistrict("");
                }}
                className="text-[#172263] text-xs px-2 hover:underline"
              >
                {t("requests.clearLocation", { defaultValue: "Clear Location" })}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                activeReqTab === "pending"
                  ? t("requests.emptyTitlePending", { defaultValue: "No pending requests" })
                  : t("requests.emptyTitleHistory", { defaultValue: "No request history" })
              }
              description={
                activeReqTab === "pending"
                  ? t("requests.emptyDescriptionPending", { defaultValue: "Post a harvester requirement to get started." })
                  : t("requests.emptyDescriptionHistory", { defaultValue: "Your accepted and rejected requests will appear here." })
              }
            />
          ) : (
            filtered.map((req) => {
              const isOwner = currentUser && req.userId === currentUser.id;
              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border border-[#E2E8F0] p-5 flex gap-4 items-start shadow-[0_2px_16px_rgba(232,114,12,0.06)] border-l-4 ${
                    req.status === "Accepted"
                      ? "border-l-emerald-500"
                      : req.status === "Rejected"
                      ? "border-l-rose-500"
                      : "border-l-amber-500"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 capitalize">
                        {req.type === "harvester" ? t("requests.harvesterType", { defaultValue: "Harvester" }) : req.type}
                      </span>
                      {req.status === "Accepted" && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1 shadow-sm">
                          <CheckCircle2 size={12} /> {t("requests.status.accepted", { defaultValue: "Accepted" })}
                        </span>
                      )}
                      {req.status === "Rejected" && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1 shadow-sm">
                          <XCircle size={12} /> {t("requests.status.rejected", { defaultValue: "Rejected" })}
                        </span>
                      )}
                      {(req.status === "Pending" || req.status === "Open") && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex items-center gap-1 animate-pulse shadow-sm">
                          <Clock size={12} /> {t("requests.status.pending", { defaultValue: "Pending" })}
                        </span>
                      )}
                      {isOwner && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold shadow-sm">
                          {t("requests.myRequirement", { defaultValue: "My Requirement" })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[#57585A]">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {req.location}{req.state ? `, ${req.state}` : ""}
                      </span>
                      <span>{t("machineTypes." + req.machineType, { ns: "static", defaultValue: req.machineType })}</span>
                      <span>{t("requests.durationDays", { defaultValue: "{{count}} days", count: req.duration })}</span>
                      <span>{new Date(req.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/requests/${req.id}`} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                      {t("requests.viewBtn", { defaultValue: "View" })}
                    </Link>
                    {isOwner && (
                      <button onClick={() => setConfirmDelete(req.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Post Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-lg border border-[#E2E8F0] max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-[#1A1A1A]" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>{t("requests.postTitleHarvester", { defaultValue: "Post Harvester Requirement" })}</h3>
              <button
                type="button"
                onClick={handleDialogDetectLocation}
                className="text-xs px-3 py-1.5 bg-blue-50 border border-blue-200 text-[#172263] rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <MapPin size={12} /> {t("requests.autoDetect", { defaultValue: "Auto-detect Location" })}
              </button>
            </div>
            
            <div className="space-y-3">
              {/* State Dropdown */}
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.stateLabel", { defaultValue: "State *" })}</label>
                <select
                  value={newReq.state}
                  onChange={(e) => setNewReq(prev => ({ ...prev, state: e.target.value, location: "" }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-[#ffffff]"
                >
                  <option value="">{t("requests.selectState", { defaultValue: "Select State" })}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{t("states." + s, { ns: "static", defaultValue: s })}</option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.districtLabel", { defaultValue: "District / Location *" })}</label>
                <select
                  value={newReq.location}
                  onChange={(e) => setNewReq(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!newReq.state}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-[#ffffff] disabled:opacity-50"
                >
                  <option value="">{t("requests.selectDistrict", { defaultValue: "Select District" })}</option>
                  {newReq.state &&
                    districtsData.states
                      .find((s) => s.state === newReq.state)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>{t("districts." + d, { ns: "static", defaultValue: d })}</option>
                      ))}
                </select>
              </div>

              {/* Other inputs */}
              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.machineTypeLabel", { defaultValue: "Machine Type *" })}</label>
                <select
                  value={newReq.machineType}
                  onChange={(e) => setNewReq(prev => ({ ...prev, machineType: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263] bg-[#ffffff]"
                >
                  <option value="">{t("requests.selectMachineType", { defaultValue: "Select Machine Type" })}</option>
                  {MACHINE_TYPES.map((tVal) => (
                    <option key={tVal} value={tVal}>{t("machineTypes." + tVal, { ns: "static", defaultValue: tVal })}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#57585A] block mb-1">{t("requests.durationLabel", { defaultValue: "Duration (days)" })}</label>
                  <input
                    type="number"
                    placeholder={t("requests.durationPlaceholder", { defaultValue: "Duration" })}
                    value={newReq.duration}
                    onChange={(e) => setNewReq(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#57585A] block mb-1">{t("requests.startDateLabel", { defaultValue: "Start Date *" })}</label>
                  <input
                    type="date"
                    value={newReq.startDate}
                    onChange={(e) => setNewReq(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#57585A] block mb-1">{t("requests.descriptionLabel", { defaultValue: "Description" })}</label>
                <textarea
                  rows={2}
                  placeholder={t("requests.descriptionPlaceholder", { defaultValue: "Describe your requirement in detail..." })}
                  value={newReq.description}
                  onChange={(e) => setNewReq((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDialog(false)} className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[#57585A] text-sm hover:bg-gray-50">{t("requests.cancelBtn", { defaultValue: "Cancel" })}</button>
              <button onClick={postReq} className="flex-1 py-2.5 bg-[#172263] text-white rounded-xl text-sm hover:bg-[#11194A] transition-colors" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("requests.postBtn", { defaultValue: "Post Requirement →" })}</button>
            </div>
          </motion.div>
        </div>
      )}


      {/* Confirm Delete */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E2E8F0]">
            <h3 className="text-lg text-[#1A1A1A] mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{t("requests.deleteTitle", { defaultValue: "Delete Requirement?" })}</h3>
            <p className="text-[#57585A] text-sm mb-4">{t("requests.deleteDesc", { defaultValue: "This action cannot be undone." })}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm">{t("requests.cancelBtn", { defaultValue: "Cancel" })}</button>
              <button onClick={() => deleteReq(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors">{t("requests.deleteBtn", { defaultValue: "Delete" })}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


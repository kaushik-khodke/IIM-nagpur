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
  Globe,
} from "lucide-react";

import enPages from "../../i18n/locales/en/pages.json";
import hiPages from "../../i18n/locales/hi/pages.json";
import mrPages from "../../i18n/locales/mr/pages.json";
import enStatic from "../../i18n/locales/en/static.json";
import hiStatic from "../../i18n/locales/hi/static.json";
import mrStatic from "../../i18n/locales/mr/static.json";
import enCommon from "../../i18n/locales/en/common.json";
import hiCommon from "../../i18n/locales/hi/common.json";
import mrCommon from "../../i18n/locales/mr/common.json";

const defaultTranslations: Record<string, Record<string, any>> = {
  en: { pages: enPages, static: enStatic, common: enCommon },
  hi: { pages: hiPages, static: hiStatic, common: hiCommon },
  mr: { pages: mrPages, static: mrStatic, common: mrCommon },
};

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], propName));
      } else {
        result[propName] = String(obj[key]);
      }
    }
  }
  return result;
}

function setNestedKey(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}
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

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown, getStatusBadge, getUserVerificationStatusBadge } from "./pagesShared";

// ===========================
// ADMIN CONTROL PORTAL
// ===========================
export function AdminPortal() {
  const { t } = useTranslation(["pages", "static"]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalOperators: 0, totalHarvesters: 0, totalRequests: 0, blockedUsers: 0, loginHistory: [], performers: [] });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [performerFilter, setPerformerFilter] = useState("highest_machine");
  const [adminRequestsTab, setAdminRequestsTab] = useState<"pending" | "processed">("pending");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Users listing states
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Moderator listings
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [adminBlogs, setAdminBlogs] = useState<any[]>([]);
  const [adminOperators, setAdminOperators] = useState<any[]>([]);
  const [adminFaqs, setAdminFaqs] = useState<any[]>([]);
  const [answeringFaqId, setAnsweringFaqId] = useState<string | null>(null);
  const [faqAnswerText, setFaqAnswerText] = useState("");

  // Site Content Editor state
  const [selectedContentLang, setSelectedContentLang] = useState("en");
  const [selectedContentNs, setSelectedContentNs] = useState("pages");
  const [contentSearchTerm, setContentSearchTerm] = useState("");
  const [editingOverrides, setEditingOverrides] = useState<Record<string, string>>({});
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});
  const [contentPage, setContentPage] = useState(1);

  // Dynamic Languages lists
  const [activeLanguages, setActiveLanguages] = useState<any[]>([
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी" },
    { code: "mr", label: "मराठी" }
  ]);
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [selectedAddLang, setSelectedAddLang] = useState("");
  const [addingLanguage, setAddingLanguage] = useState(false);

  // Detailed Listing Viewer States
  const [selectedListingDetail, setSelectedListingDetail] = useState<any | null>(null);
  const [selectedListingType, setSelectedListingType] = useState<'harvester' | 'operator' | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [operatorVerificationDetails, setOperatorVerificationDetails] = useState<any | null>(null);
  const [loadingVerificationDetails, setLoadingVerificationDetails] = useState(false);

  // Verification states
  const [harvesterStatusFilter, setHarvesterStatusFilter] = useState<"All" | "Approved" | "Pending" | "Rejected">("Pending");
  const [operatorStatusFilter, setOperatorStatusFilter] = useState<"All" | "Approved" | "Pending" | "Rejected">("Pending");
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("Pending");
  const [verificationSearchTerm, setVerificationSearchTerm] = useState("");
  const [adminFeedback, setAdminFeedback] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Advanced Filter/Sort states
  // Users directory filters states
  const [userLocationFilter, setUserLocationFilter] = useState("");
  const [userSortFilter, setUserSortFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");

  // Harvesters Tab filters states
  const [harvesterCompanyFilter, setHarvesterCompanyFilter] = useState("");
  const [harvesterModelFilter, setHarvesterModelFilter] = useState("");
  const [harvesterOwnerFilter, setHarvesterOwnerFilter] = useState("");
  const [harvesterStateFilter, setHarvesterStateFilter] = useState("");
  const [harvesterSortFilter, setHarvesterSortFilter] = useState("");
  const [harvesterGroupByOwner, setHarvesterGroupByOwner] = useState(false);

  // Operators Tab filters states
  const [operatorStateFilter, setOperatorStateFilter] = useState("");
  const [operatorAvailabilityFilter, setOperatorAvailabilityFilter] = useState("");
  const [operatorSortFilter, setOperatorSortFilter] = useState("");

  // Requests Tab filters states
  const [requestStateFilter, setRequestStateFilter] = useState("");
  const [requestSortFilter, setRequestSortFilter] = useState("");

  // Enquiries Tab filters states
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState("");
  const [enquirySortFilter, setEnquirySortFilter] = useState("");

  // Blogs Tab filters states
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("");
  const [blogSortFilter, setBlogSortFilter] = useState("");

  // FAQs Tab filters states
  const [faqStatusFilter, setFaqStatusFilter] = useState("");
  const [faqSortFilter, setFaqSortFilter] = useState("");

  // Blog Comments Moderation States
  const [activeBlogForComments, setActiveBlogForComments] = useState<any | null>(null);
  const [selectedBlogComments, setSelectedBlogComments] = useState<any[]>([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Blog Article Preview States
  const [activeBlogPreview, setActiveBlogPreview] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Selected Chart Point State
  const [selectedChartPoint, setSelectedChartPoint] = useState<any | null>(null);

  // Admin blogs editing states
  const [categories, setCategories] = useState<string[]>(["Harvesting Tips", "Machine Maintenance", "Success Stories", "Agri News", "Weather & Season"]);
  const [customCategory, setCustomCategory] = useState("");
  const [aiCustomCategory, setAiCustomCategory] = useState("");
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogCategory, setBlogCategory] = useState("Machine Maintenance");
  const [blogShortDesc, setBlogShortDesc] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogDate, setBlogDate] = useState("");
  const [blogImageUrl, setBlogImageUrl] = useState("");
  const [blogImageFile, setBlogImageFile] = useState<File | null>(null);
  const [blogImagePreview, setBlogImagePreview] = useState("");
  const [savingBlog, setSavingBlog] = useState(false);
  const [adminBlogsSearch, setAdminBlogsSearch] = useState("");
  const [adminEnquiryBg, setAdminEnquiryBg] = useState('/enquiry_background/background.png');
  
  // AI blog generator states
  const [showAiBlogForm, setShowAiBlogForm] = useState(false);
  const [aiPromptTitle, setAiPromptTitle] = useState("");
  const [aiPromptKeywords, setAiPromptKeywords] = useState("");
  const [aiPromptCategory, setAiPromptCategory] = useState("Machine Maintenance");
  const [generatingBlog, setGeneratingBlog] = useState(false);

  // Confirmation modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'block' | 'unblock' | 'wipe' | 'deleteHarv' | 'deleteReq' | 'deleteBlog' | 'deleteOp'>('block');
  const [confirmTargetId, setConfirmTargetId] = useState("");
  const [confirmTargetName, setConfirmTargetName] = useState("");

  const token = localStorage.getItem("tractorsewa_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403 || res.status === 404) {
            localStorage.removeItem("tractorsewa_token");
            navigate("/login");
          } else {
            navigate("/dashboard");
          }
          return;
        }
        const data = await res.json();
        if (data.role !== "admin") {
          toast.error("Unauthorized access. Admin privileges required.");
          navigate("/dashboard");
          return;
        }
        setCurrentUser(data);
        refreshAllData();
      } catch (err) {
        console.error(err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [token]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/blogs/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchAdminOverrides = async () => {
    setLoadingOverrides(true);
    try {
      const res = await fetch("/api/translation-overrides", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const overridesMap: Record<string, string> = {};
        data.forEach((item: any) => {
          const uniqueKey = `${item.lang}.${item.namespace}.${item.key_path}`;
          overridesMap[uniqueKey] = item.value;
        });
        setEditingOverrides(overridesMap);
      }
    } catch (err) {
      console.error("Error fetching overrides:", err);
      toast.error("Failed to load translation overrides.");
    } finally {
      setLoadingOverrides(false);
    }
  };

  const handleSaveOverride = async (keyPath: string, value: string) => {
    try {
      const res = await fetch("/api/admin/translation-overrides", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          lang: selectedContentLang,
          namespace: selectedContentNs,
          key_path: keyPath,
          value: value
        })
      });
      if (res.ok) {
        toast.success("Translation updated successfully!");
        
        const uniqueKey = `${selectedContentLang}.${selectedContentNs}.${keyPath}`;
        setEditingOverrides(prev => ({ ...prev, [uniqueKey]: value }));
        
        // Update active i18next instance immediately
        const i18n = (await import("../../i18n/config")).default;
        const currentBundle = i18n.getResourceBundle(selectedContentLang, selectedContentNs) || {};
        const updatedBundle = { ...currentBundle };
        setNestedKey(updatedBundle, keyPath, value);
        i18n.addResourceBundle(selectedContentLang, selectedContentNs, updatedBundle, true, true);
        i18n.changeLanguage(i18n.language);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save translation override.");
      }
    } catch (err) {
      console.error("Error saving override:", err);
      toast.error("Failed to save translation override.");
    }
  };

  const handleRevertOverride = async (keyPath: string) => {
    try {
      const res = await fetch(`/api/admin/translation-overrides?lang=${selectedContentLang}&namespace=${selectedContentNs}&key_path=${keyPath}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Translation reverted to default.");
        
        const uniqueKey = `${selectedContentLang}.${selectedContentNs}.${keyPath}`;
        setEditingOverrides(prev => {
          const next = { ...prev };
          delete next[uniqueKey];
          return next;
        });

        // Clear local pending edits for this key
        setPendingEdits(prev => {
          const next = { ...prev };
          delete next[keyPath];
          return next;
        });

        // Restore default value in active i18next instance
        const i18n = (await import("../../i18n/config")).default;
        const defaultBundle = defaultTranslations[selectedContentLang][selectedContentNs] || {};
        
        const parts = keyPath.split('.');
        let defaultValue = defaultBundle;
        for (const part of parts) {
          if (defaultValue && part in defaultValue) {
            defaultValue = defaultValue[part];
          } else {
            defaultValue = undefined;
            break;
          }
        }

        const currentBundle = i18n.getResourceBundle(selectedContentLang, selectedContentNs) || {};
        const updatedBundle = { ...currentBundle };
        if (defaultValue !== undefined) {
          setNestedKey(updatedBundle, keyPath, defaultValue);
        }
        i18n.addResourceBundle(selectedContentLang, selectedContentNs, updatedBundle, true, true);
        i18n.changeLanguage(i18n.language);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to revert translation.");
      }
    } catch (err) {
      console.error("Error reverting override:", err);
      toast.error("Failed to revert translation.");
    }
  };

  const fetchLanguagesList = async () => {
    try {
      const res = await fetch("/api/languages");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setActiveLanguages(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailableLanguages = async () => {
    try {
      const res = await fetch("/api/admin/languages/available", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableLanguages(data);
        if (data.length > 0) {
          setSelectedAddLang(data[0].code);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLanguage = async () => {
    if (!selectedAddLang) return;
    setAddingLanguage(true);
    const addToast = toast.loading(`Auto-translating website text... Please wait.`);
    try {
      const res = await fetch("/api/admin/languages/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ lang: selectedAddLang })
      });
      if (res.ok) {
        toast.success("Language added and auto-translated successfully!", { id: addToast });
        await fetchLanguagesList();
        await fetchAvailableLanguages();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add language.", { id: addToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding language.", { id: addToast });
    } finally {
      setAddingLanguage(false);
    }
  };

  useEffect(() => {
    if (activeTab === "edit-content") {
      fetchAdminOverrides();
      fetchLanguagesList();
      fetchAvailableLanguages();
    }
  }, [activeTab]);

  useEffect(() => {
    setContentPage(1);
    setPendingEdits({});
  }, [selectedContentLang, selectedContentNs]);

  const handleCategoryChange = async (value: string, type: 'standard' | 'ai') => {
    if (value === "Add New Category...") {
      const newCat = window.prompt("Enter new category name:");
      if (newCat && newCat.trim() !== "") {
        const cleanName = newCat.trim();
        try {
          const res = await fetch("/api/admin/blogs/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: cleanName })
          });
          if (res.ok) {
            toast.success(`Category "${cleanName}" added successfully.`);
            await fetchCategories();
            if (type === 'standard') {
              setBlogCategory(cleanName);
            } else {
              setAiPromptCategory(cleanName);
            }
          } else {
            const err = await res.json();
            toast.error(err.error || "Failed to add category.");
            if (type === 'standard') {
              setBlogCategory(categories[0] || "Machine Maintenance");
            } else {
              setAiPromptCategory(categories[0] || "Machine Maintenance");
            }
          }
        } catch (err) {
          console.error(err);
          toast.error("Error adding category.");
          if (type === 'standard') {
            setBlogCategory(categories[0] || "Machine Maintenance");
          } else {
            setAiPromptCategory(categories[0] || "Machine Maintenance");
          }
        }
      } else {
        if (type === 'standard') {
          setBlogCategory(categories[0] || "Machine Maintenance");
        } else {
          setAiPromptCategory(categories[0] || "Machine Maintenance");
        }
      }
    } else {
      if (type === 'standard') {
        setBlogCategory(value);
        if (value !== "Other") {
          setCustomCategory("");
        }
      } else {
        setAiPromptCategory(value);
        if (value !== "Other") {
          setAiCustomCategory("");
        }
      }
    }
  };

  const fetchSettings = () => {
    fetch('/api/site-settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.enquiry_background) {
          setAdminEnquiryBg(data.enquiry_background);
        }
      })
      .catch(() => {});
  };

  const refreshAllData = () => {
    fetchCategories();
    fetchStats();
    fetchAllUsers();
    fetchHarvesters();
    fetchRequests();
    fetchEnquiries();
    fetchAdminBlogs();
    fetchAdminOperators();
    fetchAdminFaqs();
    fetchSettings();
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHarvesters = async () => {
    try {
      const res = await fetch("/api/harvesters", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHarvesters(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEnquiries = async () => {
    try {
      const res = await fetch("/api/admin/enquiries", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      if (res.ok) {
        const data = await res.json();
        setAdminBlogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminOperators = async () => {
    try {
      const res = await fetch("/api/operators", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminOperators(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminFaqs = async () => {
    try {
      const res = await fetch("/api/admin/faqs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminFaqs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Request status updated to ${newStatus} successfully.`);
        fetchRequests();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update request status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating request status.");
    }
  };

  const handleAnswerFaqSubmit = async (faqId: string) => {
    if (!faqAnswerText.trim()) {
      toast.error("Please enter an answer.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/faqs/${faqId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ answer: faqAnswerText.trim(), status: 'Answered' })
      });

      if (res.ok) {
        toast.success("Question answered successfully!");
        setAnsweringFaqId(null);
        setFaqAnswerText("");
        fetchAdminFaqs();
      } else {
        toast.error("Failed to submit answer.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error answering question.");
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    try {
      const res = await fetch(`/api/admin/faqs/${faqId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("FAQ deleted successfully.");
        fetchAdminFaqs();
      } else {
        toast.error("Failed to delete FAQ.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting FAQ.");
    }
  };

  const openListingDetail = async (type: 'harvester' | 'operator', listing: any) => {
    setSelectedListingType(type);
    setSelectedListingDetail(listing);
    setAdminFeedback(listing.verification_feedback || "");
    setShowDetailModal(true);

    if (type === 'operator') {
      setLoadingVerificationDetails(true);
      setOperatorVerificationDetails(null);
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/admin/operators/${listing.id}/verification-details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOperatorVerificationDetails(data);
        }
      } catch (err) {
        console.error("Error fetching operator verification details:", err);
      } finally {
        setLoadingVerificationDetails(false);
      }
    }
  };

  const handleVerifyListing = async (status: 'Approved' | 'Rejected') => {
    if (!selectedListingDetail || !selectedListingType) return;
    
    setSubmittingVerification(true);
    try {
      const res = await fetch(`/api/admin/listings/${selectedListingType}/${selectedListingDetail.id}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          feedback: adminFeedback.trim() || null
        })
      });

      if (res.ok) {
        toast.success(`Listing successfully ${status.toLowerCase()}!`);
        setShowDetailModal(false);
        refreshAllData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update verification status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating verification status.");
    } finally {
      setSubmittingVerification(false);
    }
  };

  const openBlogComments = async (blog: any) => {
    setActiveBlogForComments(blog);
    setShowCommentsModal(true);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/blogs/${blog.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBlogComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.failedLoadComments", { defaultValue: "Failed to load comments." }));
    } finally {
      setLoadingComments(false);
    }
  };

  const deleteBlogComment = async (commentId: number) => {
    try {
      const res = await fetch(`/api/admin/blogs/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(t("admin.commentDeleted", { defaultValue: "Comment deleted successfully." }));
        setSelectedBlogComments(prev => prev.filter(c => c.id !== commentId));
        fetchAdminBlogs();
      } else {
        toast.error(t("admin.failedDeleteComment", { defaultValue: "Failed to delete comment" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.errorDeleteComment", { defaultValue: "Error deleting comment" }));
    }
  };

  const openBlogPreview = (blog: any) => {
    setActiveBlogPreview(blog);
    setShowPreviewModal(true);
  };

  const startEditBlog = (blog: any) => {
    setEditingBlog(blog);
    setBlogTitle(blog.title || "");
    const isStandardCat = categories.includes(blog.category);
    if (isStandardCat) {
      setBlogCategory(blog.category || "Machine Maintenance");
      setCustomCategory("");
    } else {
      setBlogCategory("Other");
      setCustomCategory(blog.category || "");
    }
    setBlogShortDesc(blog.short_description || "");
    setBlogContent(blog.content || "");
    setBlogDate(blog.date || "");
    setBlogImageUrl(blog.image_url || "");
    setBlogImageFile(null);
    setBlogImagePreview(blog.image_url || "");
    setShowBlogForm(true);
  };

  const startCreateBlog = () => {
    setEditingBlog(null);
    setBlogTitle("");
    setBlogCategory(categories[0] || "Machine Maintenance");
    setCustomCategory("");
    setBlogShortDesc("");
    setBlogContent("");
    setBlogDate("");
    setBlogImageUrl("");
    setBlogImageFile(null);
    setBlogImagePreview("");
    setShowBlogForm(true);
  };

  const startAiGenerateBlog = () => {
    setAiPromptTitle("");
    setAiPromptKeywords("");
    setAiPromptCategory(categories[0] || "Machine Maintenance");
    setAiCustomCategory("");
    setShowAiBlogForm(true);
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptTitle.trim()) {
      toast.error("Please enter a title or topic.");
      return;
    }

    const categoryToSend = aiPromptCategory === "Other" ? aiCustomCategory.trim() : aiPromptCategory.trim();
    if (!categoryToSend) {
      toast.error("Please specify a category.");
      return;
    }

    setGeneratingBlog(true);
    try {
      const res = await fetch("/api/admin/blogs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: aiPromptTitle.trim(),
          keywords: aiPromptKeywords.trim(),
          category: categoryToSend
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Prefill the standard blog form with the AI generated content
        setEditingBlog(null);
        setBlogTitle(data.title || aiPromptTitle.trim());
        
        const returnedCategory = data.category || categoryToSend;
        const isStandardCat = categories.includes(returnedCategory);
        if (isStandardCat) {
          setBlogCategory(returnedCategory);
          setCustomCategory("");
        } else {
          setBlogCategory("Other");
          setCustomCategory(returnedCategory);
        }

        setBlogShortDesc(data.short_description || "");
        setBlogContent(data.content || "");
        setBlogDate("");
        setBlogImageUrl(data.image_url || "");
        setBlogImageFile(null);
        setBlogImagePreview(data.image_url || "");
        
        // Switch modals
        setShowAiBlogForm(false);
        setShowBlogForm(true);
        toast.success("Blog content generated successfully! Please review and save.");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate blog content.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to generator service.");
    } finally {
      setGeneratingBlog(false);
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryToSend = blogCategory === "Other" ? customCategory.trim() : blogCategory.trim();

    if (!blogTitle.trim() || !categoryToSend || !blogShortDesc.trim() || !blogContent.trim()) {
      toast.error(t("admin.fillRequiredFields", { defaultValue: "Please fill in all required fields." }));
      return;
    }

    setSavingBlog(true);
    try {
      let uploadedUrl = blogImageUrl;
      if (blogImageFile) {
        const token = localStorage.getItem("tractorsewa_token");
        const formData = new FormData();
        formData.append("image", blogImageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.url;
        } else {
          let errorMsg = "Failed to upload blog image.";
          try {
            const errData = await uploadRes.json();
            if (errData && errData.error) {
              errorMsg = errData.error;
            }
          } catch (_) {}
          toast.error(errorMsg);
          setSavingBlog(false);
          return;
        }
      }

      const blogData = {
        title: blogTitle.trim(),
        category: categoryToSend,
        short_description: blogShortDesc.trim(),
        content: blogContent.trim(),
        date: blogDate.trim() || undefined,
        image_url: uploadedUrl
      };

      const url = editingBlog ? `/api/admin/blogs/${editingBlog.id}` : "/api/admin/blogs";
      const method = editingBlog ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(blogData)
      });

      if (res.ok) {
        toast.success(editingBlog ? t("admin.blogUpdated", { defaultValue: "Blog updated successfully!" }) : t("admin.blogCreated", { defaultValue: "Blog created successfully!" }));
        setShowBlogForm(false);
        setEditingBlog(null);
        setBlogTitle("");
        setBlogCategory(categories[0] || "Machine Maintenance");
        setCustomCategory("");
        setBlogShortDesc("");
        setBlogContent("");
        setBlogDate("");
        setBlogImageUrl("");
        setBlogImageFile(null);
        setBlogImagePreview("");
        refreshAllData();
      } else {
        const err = await res.json();
        toast.error(err.error || t("admin.failedSaveBlog", { defaultValue: "Failed to save blog post" }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.errorSaveBlog", { defaultValue: "Error saving blog post" }));
    } finally {
      setSavingBlog(false);
    }
  };

  const executeAction = async () => {
    setConfirmOpen(false);
    if (!confirmTargetId) return;

    try {
      if (confirmType === 'block') {
        const res = await fetch(`/api/admin/users/${confirmTargetId}/block`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ block: true })
        });
        if (res.ok) {
          toast.success(t("admin.userBlocked", { defaultValue: "User blocked successfully!" }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedBlock", { defaultValue: "Failed to block user" }));
        }
      } else if (confirmType === 'unblock') {
        const res = await fetch(`/api/admin/users/${confirmTargetId}/block`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ block: false })
        });
        if (res.ok) {
          toast.success(t("admin.userUnblocked", { defaultValue: "User unblocked successfully!" }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedUnblock", { defaultValue: "Failed to unblock user" }));
        }
      } else if (confirmType === 'wipe') {
        const res = await fetch(`/api/admin/users/${confirmTargetId}/data`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.userWiped", { defaultValue: "Cleared entire user posts/data and blocked user successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedWipe", { defaultValue: "Failed to wipe user data" }));
        }
      } else if (confirmType === 'deleteHarv') {
        const res = await fetch(`/api/admin/harvesters/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.harvesterDeleted", { defaultValue: "Harvester listing deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteHarvester", { defaultValue: "Failed to delete machine listing" }));
        }
      } else if (confirmType === 'deleteReq') {
        const res = await fetch(`/api/admin/requests/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.requestDeleted", { defaultValue: "Crop requirement deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteRequest", { defaultValue: "Failed to delete crop request" }));
        }
      } else if (confirmType === 'deleteBlog') {
        const res = await fetch(`/api/admin/blogs/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.blogDeleted", { defaultValue: "Blog post deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteBlog", { defaultValue: "Failed to delete blog post" }));
        }
      } else if (confirmType === 'deleteOp') {
        const res = await fetch(`/api/admin/operators/${confirmTargetId}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success(t("admin.operatorDeleted", { defaultValue: "Operator listing deleted successfully." }));
          refreshAllData();
        } else {
          toast.error(t("admin.failedDeleteOperator", { defaultValue: "Failed to delete operator profile" }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t("admin.errorGenericOperation", { defaultValue: "Error executing administrative operation" }));
    }
  };

  const openConfirmModal = (type: 'block' | 'unblock' | 'wipe' | 'deleteHarv' | 'deleteReq' | 'deleteBlog' | 'deleteOp', id: string, name: string) => {
    setConfirmType(type);
    setConfirmTargetId(id);
    setConfirmTargetName(name);
    setConfirmOpen(true);
  };

  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    // Search term filter
    if (userSearchTerm.trim()) {
      const term = userSearchTerm.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phone && u.phone.includes(term))
      );
    }

    // Location (State) filter
    if (userLocationFilter) {
      result = result.filter(u => u.state === userLocationFilter);
    }

    // Status filter
    if (userStatusFilter === "active") {
      result = result.filter(u => !u.is_blocked);
    } else if (userStatusFilter === "blocked") {
      result = result.filter(u => u.is_blocked);
    }

    // Role filter
    if (userRoleFilter === "operator") {
      result = result.filter(u => u.isOperator > 0);
    } else if (userRoleFilter === "non_operator") {
      result = result.filter(u => u.isOperator === 0);
    }

    // Sorting
    if (userSortFilter === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (userSortFilter === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (userSortFilter === "date_newest") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (userSortFilter === "date_oldest") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (userSortFilter === "highest_posts") {
      result.sort((a, b) => {
        const postsA = (a.harvesterCount || 0) + (a.requestCount || 0);
        const postsB = (b.harvesterCount || 0) + (b.requestCount || 0);
        return postsB - postsA;
      });
    }

    return result;
  }, [allUsers, userSearchTerm, userLocationFilter, userSortFilter, userStatusFilter, userRoleFilter]);

  const filteredHarv = useMemo(() => {
    let result = [...harvesters];

    // Status filter (from existing tabs)
    if (harvesterStatusFilter !== "All") {
      result = result.filter(h => {
        if (harvesterStatusFilter === "Pending") return !h.verification_status || h.verification_status === "Pending";
        return h.verification_status === harvesterStatusFilter;
      });
    }

    // Company filter
    if (harvesterCompanyFilter) {
      result = result.filter(h => h.company === harvesterCompanyFilter);
    }

    // Model filter
    if (harvesterModelFilter) {
      result = result.filter(h => h.model === harvesterModelFilter);
    }

    // Owner filter
    if (harvesterOwnerFilter) {
      result = result.filter(h => h.ownerName === harvesterOwnerFilter);
    }

    // State filter
    if (harvesterStateFilter) {
      result = result.filter(h => h.state === harvesterStateFilter);
    }

    // Sorting
    if (harvesterSortFilter === "name_asc") {
      result.sort((a, b) => a.machineName.localeCompare(b.machineName));
    } else if (harvesterSortFilter === "name_desc") {
      result.sort((a, b) => b.machineName.localeCompare(a.machineName));
    } else if (harvesterSortFilter === "date_newest") {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (harvesterSortFilter === "date_oldest") {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (harvesterSortFilter === "year_newest") {
      result.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (harvesterSortFilter === "year_oldest") {
      result.sort((a, b) => (a.year || 0) - (b.year || 0));
    }

    return result;
  }, [harvesters, harvesterStatusFilter, harvesterCompanyFilter, harvesterModelFilter, harvesterOwnerFilter, harvesterStateFilter, harvesterSortFilter]);

  const groupedHarvesters = useMemo(() => {
    if (!harvesterGroupByOwner) return null;
    const groups: { [key: string]: any[] } = {};
    filteredHarv.forEach(h => {
      const owner = h.ownerName || "Unknown Owner";
      if (!groups[owner]) groups[owner] = [];
      groups[owner].push(h);
    });
    return groups;
  }, [filteredHarv, harvesterGroupByOwner]);

  const filteredOps = useMemo(() => {
    // Only show completed operator profiles (those that are real listings)
    let result = adminOperators.filter(op => op.is_profile_completed === 1);

    // Status filter (from existing tabs)
    if (operatorStatusFilter !== "All") {
      result = result.filter(op => {
        if (operatorStatusFilter === "Pending") return !op.verification_status || op.verification_status === "Pending";
        return op.verification_status === operatorStatusFilter;
      });
    }

    // State filter
    if (operatorStateFilter) {
      result = result.filter(op => op.state === operatorStateFilter);
    }

    // Availability filter
    if (operatorAvailabilityFilter) {
      result = result.filter(op => op.availability === operatorAvailabilityFilter);
    }

    // Sorting
    if (operatorSortFilter === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (operatorSortFilter === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (operatorSortFilter === "rating_desc") {
      result.sort((a, b) => parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0));
    } else if (operatorSortFilter === "rating_asc") {
      result.sort((a, b) => parseFloat(a.avgRating || 0) - parseFloat(b.avgRating || 0));
    } else if (operatorSortFilter === "date_newest") {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (operatorSortFilter === "date_oldest") {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (operatorSortFilter === "exp_desc") {
      result.sort((a, b) => b.experience - a.experience);
    } else if (operatorSortFilter === "exp_asc") {
      result.sort((a, b) => a.experience - b.experience);
    }

    return result;
  }, [adminOperators, operatorStatusFilter, operatorStateFilter, operatorAvailabilityFilter, operatorSortFilter]);

  const filteredVerifications = useMemo(() => {
    // Only show operators who have uploaded verification files
    let result = adminOperators.filter(op => op.selfie_image_path);

    if (verificationStatusFilter !== "All") {
      result = result.filter(op => {
        if (verificationStatusFilter === "Pending") return !op.verification_status || op.verification_status === "Pending";
        return op.verification_status === verificationStatusFilter;
      });
    }

    if (verificationSearchTerm) {
      const term = verificationSearchTerm.toLowerCase();
      result = result.filter(op => op.name.toLowerCase().includes(term) || op.email?.toLowerCase().includes(term));
    }

    return result;
  }, [adminOperators, verificationStatusFilter, verificationSearchTerm]);

  const filteredReqs = useMemo(() => {
    let result = [...requests];

    // Filter by state
    if (requestStateFilter) {
      result = result.filter(r => r.state === requestStateFilter);
    }

    // Sort by Date, Type, Location
    if (requestSortFilter === "date_newest") {
      result.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
    } else if (requestSortFilter === "date_oldest") {
      result.sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime());
    } else if (requestSortFilter === "type_asc") {
      result.sort((a, b) => a.type.localeCompare(b.type));
    } else if (requestSortFilter === "location_asc") {
      result.sort((a, b) => a.location.localeCompare(b.location));
    }

    return result;
  }, [requests, requestStateFilter, requestSortFilter]);

  const filteredEnqs = useMemo(() => {
    let result = [...enquiries];

    // Filter by Status
    if (enquiryStatusFilter) {
      result = result.filter(e => e.status === enquiryStatusFilter);
    }

    // Sort by Date, Name
    if (enquirySortFilter === "date_newest") {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (enquirySortFilter === "date_oldest") {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (enquirySortFilter === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [enquiries, enquiryStatusFilter, enquirySortFilter]);

  const filteredBlogs = useMemo(() => {
    let result = [...adminBlogs];

    // Filter by Category
    if (blogCategoryFilter) {
      result = result.filter(b => b.category === blogCategoryFilter);
    }

    // Sort by Date, Title
    if (blogSortFilter === "title_asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (blogSortFilter === "title_desc") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (blogSortFilter === "date_newest") {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (blogSortFilter === "date_oldest") {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    }

    return result;
  }, [adminBlogs, blogCategoryFilter, blogSortFilter]);

  const filteredFaqs = useMemo(() => {
    let result = [...adminFaqs];

    // Filter by answered status
    if (faqStatusFilter === "answered") {
      result = result.filter(f => f.answer && f.answer.trim());
    } else if (faqStatusFilter === "unanswered") {
      result = result.filter(f => !f.answer || !f.answer.trim());
    }

    // Sort by Question text
    if (faqSortFilter === "question_asc") {
      result.sort((a, b) => a.question.localeCompare(b.question));
    } else if (faqSortFilter === "question_desc") {
      result.sort((a, b) => b.question.localeCompare(a.question));
    }

    return result;
  }, [adminFaqs, faqStatusFilter, faqSortFilter]);

  const pendingEnquiriesCount = enquiries.filter((enq: any) => enq.status === 'Active' || enq.status === 'Pending' || !enq.status).length;
  const pendingVerificationsCount = adminOperators.filter((op: any) => op.selfie_image_path && (!op.verification_status || op.verification_status === "Pending")).length;
  const pendingOperatorsCount = adminOperators.filter((op: any) => op.is_profile_completed === 1 && (!op.verification_status || op.verification_status === "Pending")).length;
  const pendingHarvestersCount = harvesters.filter((h: any) => !h.verification_status || h.verification_status === "Pending").length;
  const pendingFaqsCount = adminFaqs.filter((faq: any) => !faq.answer).length;
  const totalAdminNotificationsCount = pendingVerificationsCount + pendingOperatorsCount + pendingHarvestersCount + pendingFaqsCount + pendingEnquiriesCount;

  // Performers sorting
  const sortedPerformers = [...(stats.performers || [])].sort((a: any, b: any) => {
    if (performerFilter === "highest_machine") {
      return b.harvesterCount - a.harvesterCount;
    } else if (performerFilter === "rating") {
      return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
    } else if (performerFilter === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (performerFilter === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  // Calculate login logs SVG coordinates
  const maxLogins = Math.max(...(stats.loginHistory || []).map((h: any) => h.count), 1);
  const chartWidth = 550;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 30;
  
  const points = (stats.loginHistory || []).map((h: any, idx: number) => {
    const x = paddingLeft + (idx * (chartWidth - paddingLeft - paddingRight)) / 6;
    const y = chartHeight - paddingBottom - (h.count / maxLogins) * (chartHeight - paddingTop - paddingBottom);
    return { x, y, displayDate: h.displayDate, count: h.count };
  });
  
  const linePath = points.length > 0 
    ? "M " + points.map((p: { x: any; y: any; }) => `${p.x} ${p.y}`).join(" L ")
    : "";
    
  const areaPath = points.length > 0
    ? linePath + ` L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : "";

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-screen w-full bg-white font-sans overflow-hidden">
      <div className="w-full h-full flex flex-col md:flex-row">
        <div className={`bg-[#f5eee5] border-r border-[#e8dfd2] flex flex-col justify-between shrink-0 transition-all duration-300 h-full ${isSidebarOpen ? 'w-full md:w-[280px] p-5 lg:p-6' : 'w-0 md:w-[88px] p-4 md:py-6 md:px-4'}`}>
          <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden">
            {/* Logo */}
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between gap-3' : 'justify-center'} w-full shrink-0`}>
              {isSidebarOpen && (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-2 bg-[#172263] rounded-xl text-white flex items-center justify-center shrink-0">
                    <Tractor size={24} />
                  </div>
                  <span className="text-lg lg:text-xl font-black text-[#172263] tracking-tight font-sora whitespace-nowrap">Tractor Seva</span>
                </div>
              )}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 lg:p-2 text-[#172263] hover:bg-[#e8dfd2] rounded-xl transition flex items-center justify-center shrink-0"
                title={t("admin.toggleSidebar", { defaultValue: "Toggle Sidebar" })}
              >
                <Menu size={22} />
              </button>
            </div>
            
            {/* Profile info */}
            <div className="flex flex-col items-center text-center py-4 border-b border-[#e8dfd2]/60 shrink-0">
              <div className={`${isSidebarOpen ? 'w-20 h-20' : 'w-12 h-12'} rounded-full p-0.5 shadow-md mb-3 transition-all duration-300 shrink-0`}>
                <Avatar className="w-full h-full rounded-full border-2 border-transparent bg-gradient-to-br from-[#172263] to-[#D97706] bg-clip-border">
                  {currentUser?.image_path ? <AvatarImage src={currentUser.image_path} alt={currentUser.name} /> : null}
                  <AvatarFallback className="bg-[#f5eee5] text-[#172263] font-bold h-full w-full flex items-center justify-center">
                    <span className={`${isSidebarOpen ? 'text-xl' : 'text-sm'} transition-all`}>{currentUser?.name?.charAt(0) || 'A'}</span>
                  </AvatarFallback>
                </Avatar>
              </div>
              {isSidebarOpen && (
                <div className="transition-all animate-in fade-in duration-300">
                  <h4 className="text-[#1A1A1A] font-bold text-base font-sora whitespace-nowrap">{currentUser?.name || "Om"}</h4>
                  <span className="text-xs text-[#57585A] font-semibold uppercase tracking-wider mt-0.5 whitespace-nowrap">{t("admin.role", { defaultValue: "Admin" })}</span>
                </div>
              )}
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {[
                { id: "dashboard", label: t("admin.nav.dashboard", { defaultValue: "Dashboard" }), icon: <LayoutGrid size={18} /> },
                { id: "directory", label: t("admin.nav.directory", { defaultValue: "User Directory" }), icon: <User size={18} /> },
                { id: "harvesters", label: t("admin.nav.machines", { defaultValue: "Machines" }), icon: <Tractor size={18} /> },
                { id: "operators", label: t("admin.nav.operators", { defaultValue: "Operators" }), icon: <UserCheck size={18} /> },
                { id: "verifications", label: "ID Verifications", icon: <ShieldCheck size={18} /> },
                { id: "requests", label: t("admin.nav.requests", { defaultValue: "Requests" }), icon: <FileText size={18} /> },
                { id: "enquiries", label: t("admin.nav.enquiries", { defaultValue: "Enquiries" }), icon: <MessageSquare size={18} /> },
                { id: "blogs", label: t("admin.nav.blogs", { defaultValue: "Blogs Management" }), icon: <BookOpen size={18} /> },
                { id: "faqs", label: "FAQ Management", icon: <HelpCircle size={18} /> },
                { id: "backgrounds", label: "Background Settings", icon: <Image size={18} /> },
                { id: "edit-content", label: t("admin.nav.editContent", { defaultValue: "Edit Site Content" }), icon: <Globe size={18} /> }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={!isSidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0 relative'} py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === item.id 
                      ? "bg-[#172263] text-white shadow-sm" 
                      : "text-[#57585A] hover:bg-[#e8dfd2]/40 hover:text-[#172263]"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  {item.id === "dashboard" && isSidebarOpen && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  )}
                  {item.id === "dashboard" && !isSidebarOpen && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Logout */}
          <button 
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch (err) {
                console.error("Logout error:", err);
              }
              localStorage.removeItem("tractorsewa_token");
              localStorage.removeItem("tractorsewa_user_role");
              localStorage.removeItem("tractorsewa_preview_mode");
              navigate("/login");
            }}
            title={!isSidebarOpen ? t("shared.logout", { ns: "pages", defaultValue: "Log Out" }) : undefined}
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition mt-4`}
          >
            <span className="shrink-0"><LogOut size={18} /></span>
            {isSidebarOpen && <span className="whitespace-nowrap">{t("shared.logout", { ns: "pages", defaultValue: "Log Out" })}</span>}
          </button>
        </div>
        
        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto">
          
          {/* ================================== */}
          {/* TAB: DASHBOARD (MAIN OVERVIEW)     */}
          {/* ================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#1A1A1A] font-sora">{t("admin.nav.dashboard", { defaultValue: "Dashboard" })}</h1>
                  <p className="text-[#57585A] text-sm mt-1">{t("admin.analyticsHighlight", { defaultValue: "Platform analytics and administrative directory highlights." })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                      className="p-2.5 text-[#57585A] hover:text-[#172263] hover:bg-zinc-100 rounded-full transition relative cursor-pointer"
                      title="Notifications"
                    >
                      <Bell size={20} />
                      {totalAdminNotificationsCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                          {totalAdminNotificationsCount}
                        </span>
                      )}
                    </button>
                    {showNotifDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setShowNotifDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A] font-sora">Admin Alerts</span>
                            <span className="bg-[#172263] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {totalAdminNotificationsCount} Actions
                            </span>
                          </div>
                          <div className="space-y-1">
                            {/* ID Verifications */}
                            <button
                              onClick={() => {
                                setActiveTab("verifications");
                                setShowNotifDropdown(false);
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition flex justify-between items-center group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#172263]">ID Verifications</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Pending operator ID audits</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pendingVerificationsCount > 0 ? 'bg-red-50 text-red-600 font-black animate-pulse' : 'bg-zinc-100 text-zinc-400'}`}>
                                {pendingVerificationsCount}
                              </span>
                            </button>

                            {/* Operator Listings */}
                            <button
                              onClick={() => {
                                setActiveTab("operators");
                                setShowNotifDropdown(false);
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition flex justify-between items-center group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#172263]">Operator Profiles</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Pending listing approvals</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pendingOperatorsCount > 0 ? 'bg-amber-50 text-amber-600 font-black' : 'bg-zinc-100 text-zinc-400'}`}>
                                {pendingOperatorsCount}
                              </span>
                            </button>

                            {/* Harvester Listings */}
                            <button
                              onClick={() => {
                                setActiveTab("harvesters");
                                setShowNotifDropdown(false);
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition flex justify-between items-center group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#172263]">Machine Listings</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Pending machine approvals</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pendingHarvestersCount > 0 ? 'bg-[#172263]/10 text-[#172263] font-black' : 'bg-zinc-100 text-zinc-400'}`}>
                                {pendingHarvestersCount}
                              </span>
                            </button>

                            {/* FAQ Moderation */}
                            <button
                              onClick={() => {
                                setActiveTab("faqs");
                                setShowNotifDropdown(false);
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition flex justify-between items-center group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#172263]">FAQs Pending Answer</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Unanswered questions</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pendingFaqsCount > 0 ? 'bg-purple-50 text-purple-600 font-black' : 'bg-zinc-100 text-zinc-400'}`}>
                                {pendingFaqsCount}
                              </span>
                            </button>

                            {/* Enquiries */}
                            <button
                              onClick={() => {
                                setActiveTab("enquiries");
                                setShowNotifDropdown(false);
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition flex justify-between items-center group cursor-pointer"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#172263]">User Enquiries</p>
                                <p className="text-[10px] text-zinc-500 font-medium">Active user enquiries</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pendingEnquiriesCount > 0 ? 'bg-emerald-50 text-emerald-600 font-black' : 'bg-zinc-100 text-zinc-400'}`}>
                                {pendingEnquiriesCount}
                              </span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Metrics & Doughnut Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left stats: 3 quick metric cards */}
                <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Users", value: stats.totalUsers, desc: "Registered accounts", color: "text-[#172263]" },
                    { label: "Total Posts", value: stats.totalHarvesters + stats.totalOperators + stats.totalRequests, desc: "System wide entries", color: "text-[#D97706]" },
                    { label: "Active Enquiries", value: pendingEnquiriesCount, desc: "Pending resolution", color: "text-green-600" }
                  ].map((m, idx) => (
                    <div key={idx} className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                      <span className="text-[#57585A] text-xs font-bold uppercase tracking-wider">{m.label}</span>
                      <span className={`text-4xl font-extrabold my-3 font-sora ${m.color}`}>{m.value}</span>
                      <span className="text-[11px] text-[#57585A] font-medium">{m.desc}</span>
                    </div>
                  ))}
                </div>
                
                {/* Right doughnut: Platform Distribution */}
                <div className="bg-[#fcfbf9] border border-[#e8dfd2] rounded-3xl p-6 relative flex items-center justify-between shadow-sm overflow-hidden">
                  <div className="space-y-4 z-10">
                    <h4 className="text-sm font-extrabold text-[#1A1A1A] font-sora">Database Overview</h4>
                    <div className="space-y-1.5 text-xs text-[#57585A] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#172263]" />
                        Harvesters: {stats.totalHarvesters}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                        Operators: {stats.totalOperators}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                        Requests: {stats.totalRequests}
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab("harvesters")}
                      className="px-4 py-2 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl shadow-sm transition"
                    >
                      View Listings
                    </button>
                  </div>
                  
                  {/* Concentric Circular Doughnut Graph */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="64" cy="64" r="48" 
                        stroke="#E2E8F0" strokeWidth="6" fill="none"
                      />
                      <circle 
                        cx="64" cy="64" r="48" 
                        stroke="#172263" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 48}`}
                        strokeDashoffset={`${2 * Math.PI * 48 * (1 - (stats.totalHarvesters / Math.max(stats.totalHarvesters + stats.totalOperators + stats.totalRequests, 1)))}`}
                        strokeLinecap="round"
                      />
                      
                      <circle 
                        cx="64" cy="64" r="38" 
                        stroke="#E2E8F0" strokeWidth="6" fill="none"
                      />
                      <circle 
                        cx="64" cy="64" r="38" 
                        stroke="#D97706" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 38}`}
                        strokeDashoffset={`${2 * Math.PI * 38 * (1 - (stats.totalOperators / Math.max(stats.totalHarvesters + stats.totalOperators + stats.totalRequests, 1)))}`}
                        strokeLinecap="round"
                      />
                      
                      <circle 
                        cx="64" cy="64" r="28" 
                        stroke="#E2E8F0" strokeWidth="6" fill="none"
                      />
                      <circle 
                        cx="64" cy="64" r="28" 
                        stroke="#64748B" strokeWidth="6" fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - (stats.totalRequests / Math.max(stats.totalHarvesters + stats.totalOperators + stats.totalRequests, 1)))}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-black text-[#57585A]">TOTAL</span>
                      <span className="text-base font-black text-[#1A1A1A] font-sora">
                        {stats.totalHarvesters + stats.totalOperators + stats.totalRequests}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Daily Logins Activity & Performers Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: SVG Daily Logins Curved Line Chart */}
                <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[#1A1A1A] font-bold text-lg font-sora">Activity</h3>
                      <span className="text-xs text-[#57585A]">Daily active users logging in</span>
                    </div>
                    <div className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] font-bold bg-[#fcfbf9]">
                      Last 7 Days
                    </div>
                  </div>

                  {selectedChartPoint ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-[#172263] text-xs font-bold rounded-2xl flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📊</span>
                        <span>
                          Active Users on <strong>{selectedChartPoint.displayDate}</strong>: <strong>{selectedChartPoint.count} users</strong>
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedChartPoint(null)} 
                        className="text-[#172263]/60 hover:text-[#172263] text-[10px] uppercase font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#57585A]/70 font-semibold italic">
                      💡 Click on any point/dot in the graph to view detailed active user metrics.
                    </div>
                  )}
                  
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[550px] h-[200px] relative">
                      <svg className="w-full h-full" viewBox="0 0 550 180">
                        <defs>
                          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D97706" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                          <line 
                            key={i} 
                            x1="40" y1={20 + r * 140} x2="520" y2={20 + r * 140} 
                            stroke="#F1F5F9" strokeWidth="1" 
                            strokeDasharray="4"
                          />
                        ))}
                        
                        {/* Area Fill Under Path */}
                        {areaPath && (
                          <path d={areaPath} fill="url(#chart-grad)" />
                        )}
                        
                        {/* Line Path */}
                        {linePath && (
                          <path 
                            d={linePath} 
                            fill="none" 
                            stroke="#D97706" 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                        
                        {/* Points & Labels */}
                        {points.map((p, idx) => (
                          <g 
                            key={idx} 
                            className="group cursor-pointer"
                            onClick={() => {
                              setSelectedChartPoint(p);
                              toast(`Active Users: ${p.count} on ${p.displayDate}`, { icon: "📊" });
                            }}
                          >
                            <circle 
                              cx={p.x} cy={p.y} r="5" 
                              fill={selectedChartPoint?.displayDate === p.displayDate ? "#172263" : "#ffffff"} 
                              stroke="#D97706" 
                              strokeWidth="3.5"
                            />
                            <circle 
                              cx={p.x} cy={p.y} r="9" 
                              fill="#D97706" 
                              fillOpacity="0.15"
                              className={`group-hover:opacity-100 transition-opacity ${selectedChartPoint?.displayDate === p.displayDate ? "opacity-100" : "opacity-0"}`}
                            />
                            <rect 
                              x={p.x - 24} y={p.y - 30} width="48" height="20" rx="6" 
                              fill="#172263" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            />
                            <text 
                              x={p.x} y={p.y - 17} 
                              fill="#ffffff" 
                              fontSize="10" 
                              fontWeight="bold"
                              textAnchor="middle" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-sora"
                            >
                              {p.count}
                            </text>
                            
                            <text 
                              x={p.x} y="172" 
                              fill="#57585A" 
                              fontSize="10" 
                              fontWeight="bold"
                              textAnchor="middle"
                              className="font-sans"
                            >
                              {p.displayDate}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Right side: Top Performers Widget */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#1A1A1A] font-bold text-lg font-sora">Top Performers</h3>
                      <select
                        value={performerFilter}
                        onChange={(e) => setPerformerFilter(e.target.value)}
                        className="px-2.5 py-1 border border-[#E2E8F0] rounded-xl text-xs text-[#57585A] font-bold bg-[#fcfbf9] focus:outline-none"
                      >
                        <option value="highest_machine">Highest Machines</option>
                        <option value="rating">Best Rating</option>
                        <option value="newest">Newest Accounts</option>
                        <option value="oldest">Oldest Accounts</option>
                      </select>
                    </div>
                    
                    <div className="space-y-4">
                      {sortedPerformers.slice(0, 3).map((perf: any) => (
                        <div key={perf.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#172263] to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                              {perf.imagePath ? (
                                <img src={perf.imagePath} alt={perf.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{perf.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-[#1A1A1A] font-sora line-clamp-1">{perf.name}</h4>
                              <span className="text-[10px] text-[#57585A] font-medium line-clamp-1">@{perf.email.split('@')[0]}</span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            {performerFilter === "highest_machine" && (
                              <span className="text-xs font-black text-[#172263] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                {perf.harvesterCount} Machine{perf.harvesterCount === 1 ? '' : 's'}
                              </span>
                            )}
                            {performerFilter === "rating" && (
                              <span className="text-xs font-black text-[#D97706] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5 justify-end">
                                ★ {perf.avgRating}
                              </span>
                            )}
                            {performerFilter === "newest" && (
                              <span className="text-[10px] font-bold text-[#57585A]">
                                Joined {new Date(perf.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              </span>
                            )}
                            {performerFilter === "oldest" && (
                              <span className="text-[10px] font-bold text-[#57585A]">
                                Joined {new Date(perf.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {sortedPerformers.length === 0 && (
                        <p className="text-xs text-[#57585A] text-center italic py-8">No user records available.</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setActiveTab("directory")}
                    className="w-full text-center text-xs font-extrabold text-[#172263] hover:text-[#11194A] mt-4 pt-4 border-t border-slate-100 transition"
                  >
                    View More &gt;
                  </button>
                </div>
                
              </div>
              
              {/* Operational Insights (Highlights) Cards */}
              <div className="bg-[#f2f8f6] border border-emerald-100 rounded-3xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-[#172263] font-bold text-lg font-sora">Operational Highlights</h3>
                  <p className="text-emerald-700 text-xs mt-0.5">Summary of platform engagement metrics across core categories.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Harvesters listed</span>
                      <h4 className="text-[#172263] font-extrabold text-2xl font-sora mt-1">+{stats.totalHarvesters}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Active on directory
                    </span>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Operators listed</span>
                      <h4 className="text-[#D97706] font-extrabold text-2xl font-sora mt-1">+{stats.totalOperators}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Verified profiles
                    </span>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Crop requirements</span>
                      <h4 className="text-green-600 font-extrabold text-2xl font-sora mt-1">+{stats.totalRequests}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Farmer listings live
                    </span>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200/50 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total enquiries</span>
                      <h4 className="text-indigo-600 font-extrabold text-2xl font-sora mt-1">+{enquiries.length}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                      Pending moderation
                    </span>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* ================================== */}
          {/* TAB: REGISTERED USERS DIRECTORY    */}
          {/* ================================== */}
          {activeTab === "directory" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Registered Users Account Directory</h3>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-3 text-[#57585A]" size={16} />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#172263]"
                      />
                    </div>
                  </div>
                  
                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    {/* Location Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Location</span>
                      <select
                        value={userLocationFilter}
                        onChange={(e) => setUserLocationFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All States (Select All)</option>
                        {Array.from(new Set(allUsers.map(u => u.state).filter(Boolean))).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Status</span>
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Statuses (Select All)</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>

                    {/* Role Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Role</span>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Roles (Select All)</option>
                        <option value="operator">Operator Profile Exist</option>
                        <option value="non_operator">General User Only</option>
                      </select>
                    </div>

                    {/* Sorting */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Sort By</span>
                      <select
                        value={userSortFilter}
                        onChange={(e) => setUserSortFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">Default Sort (Off)</option>
                        <option value="name_asc">Alphabetical: A-Z</option>
                        <option value="name_desc">Alphabetical: Z-A</option>
                        <option value="date_newest">Date Joined: Newest</option>
                        <option value="date_oldest">Date Joined: Oldest</option>
                        <option value="highest_posts">Highest Posts Count</option>
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(userLocationFilter || userStatusFilter || userRoleFilter || userSortFilter) && (
                      <button
                        onClick={() => {
                          setUserLocationFilter("");
                          setUserStatusFilter("");
                          setUserRoleFilter("");
                          setUserSortFilter("");
                        }}
                        className="mt-4 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Phone</th>
                        <th className="px-6 py-3.5">State</th>
                        <th className="px-6 py-3.5">Listings Count</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">{user.name}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">{user.phone || "-"}</td>
                            <td className="px-6 py-4">{user.state || "-"}</td>
                            <td className="px-6 py-4">
                              <span className="text-[#57585A]">
                                Harvesters: {user.harvesterCount} | Requests: {user.requestCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {user.is_blocked ? (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-600">
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 border border-green-200 text-green-600">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  openConfirmModal(
                                    user.is_blocked ? "unblock" : "block",
                                    user.id,
                                    user.name
                                  )
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${user.is_blocked
                                    ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                    : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                  }`}
                              >
                                {user.is_blocked ? "Unblock" : "Block"}
                              </button>
                              <button
                                onClick={() => openConfirmModal("wipe", user.id, user.name)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                              >
                                Wipe Data
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-[#57585A]/70">
                            No users matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* ================================== */}
          {/* TAB: MACHINES MODERATION           */}
          {/* ================================== */}
          {activeTab === "harvesters" && (() => {
            return (
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Machine Listings Moderation</h3>
                    
                    <div className="flex flex-wrap gap-1 p-1 bg-gray-50 border border-zinc-200 rounded-xl">
                      {(["All", "Pending", "Approved", "Rejected"] as const).map((status) => {
                        const count = status === "All" 
                          ? harvesters.length 
                          : harvesters.filter(h => status === "Pending" ? (!h.verification_status || h.verification_status === "Pending") : h.verification_status === status).length;
                        return (
                          <button
                            key={status}
                            onClick={() => setHarvesterStatusFilter(status)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              harvesterStatusFilter === status
                                ? "bg-[#172263] text-white shadow-sm"
                                : "text-[#57585A] hover:bg-zinc-100"
                            }`}
                          >
                            {status} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    {/* Company Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Company</span>
                      <select
                        value={harvesterCompanyFilter}
                        onChange={(e) => setHarvesterCompanyFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Companies (Select All)</option>
                        {Array.from(new Set(harvesters.map(h => h.company).filter(Boolean))).map(company => (
                          <option key={company} value={company}>{company}</option>
                        ))}
                      </select>
                    </div>

                    {/* Model Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Model</span>
                      <select
                        value={harvesterModelFilter}
                        onChange={(e) => setHarvesterModelFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Models (Select All)</option>
                        {Array.from(new Set(harvesters.map(h => h.model).filter(Boolean))).map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>

                    {/* Owner Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Owner</span>
                      <select
                        value={harvesterOwnerFilter}
                        onChange={(e) => setHarvesterOwnerFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Owners (Select All)</option>
                        {Array.from(new Set(harvesters.map(h => h.ownerName).filter(Boolean))).map(owner => (
                          <option key={owner} value={owner}>{owner}</option>
                        ))}
                      </select>
                    </div>

                    {/* State Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">State</span>
                      <select
                        value={harvesterStateFilter}
                        onChange={(e) => setHarvesterStateFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All States (Select All)</option>
                        {Array.from(new Set(harvesters.map(h => h.state).filter(Boolean))).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Sort By</span>
                      <select
                        value={harvesterSortFilter}
                        onChange={(e) => setHarvesterSortFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">Default Sort (Off)</option>
                        <option value="name_asc">Machine Name: A-Z</option>
                        <option value="name_desc">Machine Name: Z-A</option>
                        <option value="date_newest">Date Listed: Newest</option>
                        <option value="date_oldest">Date Listed: Oldest</option>
                        <option value="year_newest">Mfg Year: Newest</option>
                        <option value="year_oldest">Mfg Year: Oldest</option>
                      </select>
                    </div>

                    {/* Group By Owner Toggle */}
                    <div className="flex items-center gap-1.5 mt-5">
                      <input
                        type="checkbox"
                        id="groupByOwnerCheck"
                        checked={harvesterGroupByOwner}
                        onChange={(e) => setHarvesterGroupByOwner(e.target.checked)}
                        className="w-4 h-4 text-[#172263] border-zinc-300 rounded focus:ring-[#172263]"
                      />
                      <label htmlFor="groupByOwnerCheck" className="font-bold text-[#172263] cursor-pointer">
                        Group by Owner
                      </label>
                    </div>

                    {/* Reset Button */}
                    {(harvesterCompanyFilter || harvesterModelFilter || harvesterOwnerFilter || harvesterStateFilter || harvesterSortFilter || harvesterGroupByOwner) && (
                      <button
                        onClick={() => {
                          setHarvesterCompanyFilter("");
                          setHarvesterModelFilter("");
                          setHarvesterOwnerFilter("");
                          setHarvesterStateFilter("");
                          setHarvesterSortFilter("");
                          setHarvesterGroupByOwner(false);
                        }}
                        className="mt-4 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Machine Details</th>
                        <th className="px-6 py-3.5">Manufacturer</th>
                        <th className="px-6 py-3.5">Model</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5">Listed Owner</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {harvesterGroupByOwner ? (
                        groupedHarvesters && Object.keys(groupedHarvesters).length > 0 ? (
                          Object.keys(groupedHarvesters).map((ownerName) => (
                            <Fragment key={ownerName}>
                              <tr className="bg-slate-50/80 font-bold border-y border-[#E2E8F0] text-[#172263] select-none">
                                <td colSpan={7} className="px-6 py-2.5 text-xs uppercase tracking-wider font-sora">
                                  👤 Listed by: <strong className="text-zinc-800">{ownerName}</strong> ({groupedHarvesters[ownerName].length} listings)
                                </td>
                              </tr>
                              {groupedHarvesters[ownerName].map((h) => (
                                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora pl-10">{h.machineName}</td>
                                  <td className="px-6 py-4">{h.company}</td>
                                  <td className="px-6 py-4">{h.model}</td>
                                  <td className="px-6 py-4">{h.location}, {h.state}</td>
                                  <td className="px-6 py-4">{h.ownerName}</td>
                                  <td className="px-6 py-4 text-center">
                                    {getStatusBadge(h.verification_status)}
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => openListingDetail("harvester", h)}
                                      className="px-3 py-1.5 bg-[#f5eee5] text-[#172263] border border-[#e8dfd2] rounded-xl text-xs font-bold hover:bg-[#e8dfd2] transition cursor-pointer"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => openConfirmModal("deleteHarv", h.id, h.machineName)}
                                      className="px-3 py-1.5 bg-red-55 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                                    >
                                      Remove Listing
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-[#57585A]/70">
                              No listings in this category.
                            </td>
                          </tr>
                        )
                      ) : (
                        filteredHarv.length > 0 ? (
                          filteredHarv.map((h) => (
                            <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">{h.machineName}</td>
                              <td className="px-6 py-4">{h.company}</td>
                              <td className="px-6 py-4">{h.model}</td>
                              <td className="px-6 py-4">{h.location}, {h.state}</td>
                              <td className="px-6 py-4">{h.ownerName}</td>
                              <td className="px-6 py-4 text-center">
                                {getStatusBadge(h.verification_status)}
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button
                                  onClick={() => openListingDetail("harvester", h)}
                                  className="px-3 py-1.5 bg-[#f5eee5] text-[#172263] border border-[#e8dfd2] rounded-xl text-xs font-bold hover:bg-[#e8dfd2] transition cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => openConfirmModal("deleteHarv", h.id, h.machineName)}
                                  className="px-3 py-1.5 bg-red-55 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                                >
                                  Remove Listing
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-[#57585A]/70">
                              No listings in this category.
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ================================== */}
          {/* TAB: OPERATORS MODERATION          */}
          {/* ================================== */}
          {activeTab === "operators" && (() => {
            return (
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Operator Listings Moderation</h3>
                    
                    <div className="flex flex-wrap gap-1 p-1 bg-gray-50 border border-zinc-200 rounded-xl">
                      {(["All", "Pending", "Approved", "Rejected"] as const).map((status) => {
                        const completedOps = adminOperators.filter(op => op.is_profile_completed === 1);
                        const count = status === "All" 
                          ? completedOps.length 
                          : completedOps.filter(op => status === "Pending" ? (!op.verification_status || op.verification_status === "Pending") : op.verification_status === status).length;
                        return (
                          <button
                            key={status}
                            onClick={() => setOperatorStatusFilter(status)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              operatorStatusFilter === status
                                ? "bg-[#172263] text-white shadow-sm"
                                : "text-[#57585A] hover:bg-zinc-100"
                            }`}
                          >
                            {status} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    {/* Location Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Location</span>
                      <select
                        value={operatorStateFilter}
                        onChange={(e) => setOperatorStateFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All States (Select All)</option>
                        {Array.from(new Set(adminOperators.map(op => op.state).filter(Boolean))).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Availability Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Availability</span>
                      <select
                        value={operatorAvailabilityFilter}
                        onChange={(e) => setOperatorAvailabilityFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Availabilities (Select All)</option>
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                      </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Sort By</span>
                      <select
                        value={operatorSortFilter}
                        onChange={(e) => setOperatorSortFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">Default Sort (Off)</option>
                        <option value="name_asc">Name: A-Z</option>
                        <option value="name_desc">Name: Z-A</option>
                        <option value="rating_desc">Rating: Highest</option>
                        <option value="rating_asc">Rating: Lowest</option>
                        <option value="date_newest">Date Listed: Newest</option>
                        <option value="date_oldest">Date Listed: Oldest</option>
                        <option value="exp_desc">Experience: Highest</option>
                        <option value="exp_asc">Experience: Lowest</option>
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(operatorStateFilter || operatorAvailabilityFilter || operatorSortFilter) && (
                      <button
                        onClick={() => {
                          setOperatorStateFilter("");
                          setOperatorAvailabilityFilter("");
                          setOperatorSortFilter("");
                        }}
                        className="mt-4 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Operator</th>
                        <th className="px-6 py-3.5">Experience</th>
                        <th className="px-6 py-3.5">Availability</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {filteredOps.length > 0 ? (
                        filteredOps.map((op) => (
                          <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora flex items-center gap-3">
                              <img
                                src={op.image_path || "/avatar-placeholder.png"}
                                alt={op.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80";
                                }}
                              />
                              {op.name}
                            </td>
                            <td className="px-6 py-4">{op.experience} Years</td>
                            <td className="px-6 py-4">
                              <AvailabilityBadge status={op.availability} />
                            </td>
                            <td className="px-6 py-4">{op.location}, {op.state}</td>
                            <td className="px-6 py-4 text-center">
                              {getStatusBadge(op.verification_status)}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => openListingDetail("operator", op)}
                                className="px-3 py-1.5 bg-[#f5eee5] text-[#172263] border border-[#e8dfd2] rounded-xl text-xs font-bold hover:bg-[#e8dfd2] transition cursor-pointer"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => openConfirmModal("deleteOp", op.id, op.name)}
                                className="px-3 py-1.5 bg-red-55 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                              >
                                Remove Listing
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#57585A]/70">
                            No operator listings in this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ================================== */}
          {/* TAB: IDENTITY VERIFICATION REQUESTS*/}
          {/* ================================== */}
          {activeTab === "verifications" && (() => {
            return (
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Operator Identity Verification Requests</h3>
                    
                    <div className="flex flex-wrap gap-1 p-1 bg-gray-50 border border-zinc-200 rounded-xl">
                      {(["All", "Pending", "Approved", "Rejected"] as const).map((status) => {
                        const count = status === "All" 
                          ? adminOperators.filter(op => op.selfie_image_path).length 
                          : adminOperators.filter(op => op.selfie_image_path && (status === "Pending" ? (!op.verification_status || op.verification_status === "Pending") : op.verification_status === status)).length;
                        return (
                          <button
                            key={status}
                            onClick={() => setVerificationStatusFilter(status)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              verificationStatusFilter === status
                                ? "bg-[#172263] text-white shadow-sm"
                                : "text-[#57585A] hover:bg-zinc-100"
                            }`}
                          >
                            {status} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <div className="flex flex-col gap-1 w-full sm:w-64">
                      <span className="font-semibold text-zinc-500">Search Operators</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                          <Search size={14} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search name or email..."
                          value={verificationSearchTerm}
                          onChange={(e) => setVerificationSearchTerm(e.target.value)}
                          className="bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-2 w-full focus:outline-none focus:border-[#172263]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5 text-center">Selfie Capture</th>
                        <th className="px-6 py-3.5 text-center">Consent Signature</th>
                        <th className="px-6 py-3.5 text-center">Verification Status</th>
                        <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {filteredVerifications.length > 0 ? (
                        filteredVerifications.map((op) => (
                          <tr key={op.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-[#1A1A1A] font-sora">{op.name}</p>
                                <p className="text-xs text-zinc-400 font-medium">{op.email || "No email"}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">{op.location}, {op.state}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-150">
                                <Camera size={12} /> Captured
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {op.consent_signature ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-150" title={op.consent_signature}>
                                  ✓ Signed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-150">
                                  ✗ Missing
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {getUserVerificationStatusBadge(op.verification_status)}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => openListingDetail("operator", op)}
                                className="px-4 py-2 bg-[#172263] text-white rounded-xl text-xs font-bold hover:bg-[#11194a] shadow-sm transition cursor-pointer"
                              >
                                Review ID & Verify
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#57585A]/70">
                            No verification requests found in this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ================================== */}
          {/* TAB: REQUESTS MODERATION           */}
          {/* ================================== */}
          {activeTab === "requests" && (
            <div className="space-y-6">
              {/* Request Sub-Tabs Switcher */}
              <div className="flex gap-2 p-1 bg-gray-50 border border-[#E2E8F0] rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setAdminRequestsTab("pending")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    adminRequestsTab === "pending"
                      ? "bg-white text-[#172263] shadow-sm"
                      : "text-[#57585A] hover:bg-white/50"
                  }`}
                >
                  Pending Action ({requests.filter(r => r.status === "Pending" || r.status === "Open").length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminRequestsTab("processed")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    adminRequestsTab === "processed"
                      ? "bg-white text-[#172263] shadow-sm"
                      : "text-[#57585A] hover:bg-white/50"
                  }`}
                >
                  Processed History ({requests.filter(r => r.status === "Accepted" || r.status === "Rejected").length})
                </button>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">
                      {adminRequestsTab === "pending" ? "Pending Crop Requirements" : "Processed Crop Requirements"}
                    </h3>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    {/* State Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">State</span>
                      <select
                        value={requestStateFilter}
                        onChange={(e) => setRequestStateFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All States (Select All)</option>
                        {Array.from(new Set(requests.map(r => r.state).filter(Boolean))).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Sort By</span>
                      <select
                        value={requestSortFilter}
                        onChange={(e) => setRequestSortFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">Default Sort (Off)</option>
                        <option value="date_newest">Job Start: Newest First</option>
                        <option value="date_oldest">Job Start: Oldest First</option>
                        <option value="type_asc">Type: A-Z</option>
                        <option value="location_asc">Location Name: A-Z</option>
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(requestStateFilter || requestSortFilter) && (
                      <button
                        onClick={() => {
                          setRequestStateFilter("");
                          setRequestSortFilter("");
                        }}
                        className="mt-4 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Crop Type</th>
                        <th className="px-6 py-3.5">Listing Category</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5">Duration</th>
                        <th className="px-6 py-3.5">Date Added</th>
                        <th className="px-6 py-3.5">Requester</th>
                        {adminRequestsTab === "processed" && <th className="px-6 py-3.5">Status</th>}
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {(adminRequestsTab === "pending"
                        ? filteredReqs.filter(r => r.status === "Pending" || r.status === "Open")
                        : filteredReqs.filter(r => r.status === "Accepted" || r.status === "Rejected")
                      ).length > 0 ? (
                        (adminRequestsTab === "pending"
                          ? filteredReqs.filter(r => r.status === "Pending" || r.status === "Open")
                          : filteredReqs.filter(r => r.status === "Accepted" || r.status === "Rejected")
                        ).map((r) => (
                          <Fragment key={r.id}>
                            <tr
                              onClick={() => setExpandedRequestId(expandedRequestId === r.id ? null : r.id)}
                              className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">
                                <div className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                                  <ChevronDown size={14} className={`shrink-0 transition-transform ${expandedRequestId === r.id ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
                                  <span>{r.machineType}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 capitalize">{r.type}</td>
                              <td className="px-6 py-4">{r.location}, {r.state}</td>
                              <td className="px-6 py-4">{r.duration || "Not specified"} days</td>
                              <td className="px-6 py-4">
                                {r.startDate ? new Date(r.startDate).toLocaleDateString() : "-"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-700">{r.requesterName}</span>
                                  <span className="text-xs text-slate-500">{r.requesterPhone || "No phone"}</span>
                                </div>
                              </td>
                              {adminRequestsTab === "processed" && (
                                <td className="px-6 py-4">
                                  {r.status === "Accepted" ? (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold inline-flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Accepted
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold inline-flex items-center gap-1">
                                      <XCircle size={12} /> Rejected
                                    </span>
                                  )}
                                </td>
                              )}
                              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end items-center gap-2">
                                  {adminRequestsTab === "pending" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateRequestStatus(r.id, "Accepted")}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateRequestStatus(r.id, "Rejected")}
                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRequestStatus(r.id, "Pending")}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#57585A] border border-[#E2E8F0] rounded-xl text-xs font-bold transition"
                                    >
                                      Reset to Pending
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openConfirmModal("deleteReq", r.id, `${r.machineType} requirement`)}
                                    className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50 transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedRequestId === r.id && (
                              <tr className="bg-slate-50/30">
                                <td colSpan={adminRequestsTab === "processed" ? 8 : 7} className="px-6 py-4">
                                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4 text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Requester Information</span>
                                        <div className="flex items-center gap-3">
                                          {r.requesterProfilePic ? (
                                            <img src={r.requesterProfilePic} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="" />
                                          ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#172263] font-bold border border-slate-200 text-lg">
                                              {r.requesterName ? r.requesterName.charAt(0).toUpperCase() : "U"}
                                            </div>
                                          )}
                                          <div>
                                            <div className="text-sm font-bold text-slate-800">{r.requesterName}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                              <Phone size={12} className="text-slate-400" /> {r.requesterPhone || "No phone listed"}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Requirement Schedule</span>
                                        <div className="space-y-1.5 text-sm text-slate-700">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400 font-medium">Start Date:</span>
                                            <span className="font-semibold text-slate-800">{r.startDate ? new Date(r.startDate).toLocaleDateString() : "Immediate"}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400 font-medium">Duration:</span>
                                            <span className="font-semibold text-slate-800">{r.duration ? `${r.duration} Days` : "Not specified"}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Detailed Description</span>
                                      <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50/60 p-4 rounded-xl border border-slate-100 font-medium leading-relaxed">
                                        {r.description || "No description provided by the user."}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={adminRequestsTab === "processed" ? 8 : 7} className="px-6 py-12 text-center text-[#57585A]/70">
                            {adminRequestsTab === "pending" ? "No pending crop requirements in the database." : "No processed crop requirements in the database."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* TAB: ENQUIRIES                     */}
          {/* ================================== */}
          {activeTab === "enquiries" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">General Enquiries</h3>
                  </div>

                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    {/* Status Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Status</span>
                      <select
                        value={enquiryStatusFilter}
                        onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Statuses (Select All)</option>
                        <option value="Active">Active</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Over">Over</option>
                      </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Sort By</span>
                      <select
                        value={enquirySortFilter}
                        onChange={(e) => setEnquirySortFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">Default Sort (Off)</option>
                        <option value="date_newest">Date Submitted: Newest</option>
                        <option value="date_oldest">Date Submitted: Oldest</option>
                        <option value="name_asc">Name: A-Z</option>
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(enquiryStatusFilter || enquirySortFilter) && (
                      <button
                        onClick={() => {
                          setEnquiryStatusFilter("");
                          setEnquirySortFilter("");
                        }}
                        className="mt-4 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Phone</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Message / Details</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white">
                      {filteredEnqs.length > 0 ? (
                        filteredEnqs.map((enq) => (
                          <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora">{enq.name}</td>
                            <td className="px-6 py-4">{enq.phone}</td>
                            <td className="px-6 py-4">{enq.location}</td>
                            <td className="px-6 py-4">{enq.requirement}</td>
                            <td className="px-6 py-4 max-w-[250px] truncate" title={enq.message}>{enq.message || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                enq.status === 'Fulfilled' 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                  : enq.status === 'Over'
                                    ? "bg-rose-50 border-rose-200 text-rose-600"
                                    : "bg-blue-50 border-blue-200 text-blue-600"
                                }`}>
                                {enq.status || "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              {(enq.status === 'Fulfilled' || enq.status === 'Over') ? (
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/admin/enquiries/${enq.id}/status`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                      },
                                      body: JSON.stringify({ status: 'Active' })
                                    });
                                    if (res.ok) {
                                      refreshAllData();
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                >
                                  Reopen (Active)
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={async () => {
                                      const res = await fetch(`/api/admin/enquiries/${enq.id}/status`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ status: 'Fulfilled' })
                                      });
                                      if (res.ok) {
                                        refreshAllData();
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-[#E6F4EA] text-[#137333] border-[#CEEAD6] hover:bg-[#D2EBD4]"
                                  >
                                    Mark Fulfilled
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const res = await fetch(`/api/admin/enquiries/${enq.id}/status`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ status: 'Over' })
                                      });
                                      if (res.ok) {
                                        refreshAllData();
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF] hover:bg-[#F9C3BE]"
                                  >
                                    Mark Over
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-[#57585A]/70">
                            No enquiries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* TAB: BLOGS                        */}
          {/* ================================== */}
          {activeTab === "blogs" && (
            <div className="space-y-6">
              
              {/* Cumulative Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Blogs", value: adminBlogs.length, desc: "Published posts", color: "text-[#172263]" },
                  { label: "Total Views", value: adminBlogs.reduce((sum, b) => sum + (b.views || 0), 0), desc: "Cumulative reader views", color: "text-blue-600" },
                  { label: "Total Likes", value: adminBlogs.reduce((sum, b) => sum + (b.likes_count || 0), 0), desc: "Cumulative likes", color: "text-rose-600" },
                  { label: "Total Comments", value: adminBlogs.reduce((sum, b) => sum + (b.comments_count || 0), 0), desc: "User feedback count", color: "text-[#D97706]" }
                ].map((card, idx) => (
                  <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                    <span className="text-[#57585A] text-xs font-bold uppercase tracking-wider">{card.label}</span>
                    <span className={`text-3xl font-extrabold my-2 font-sora ${card.color}`}>{card.value}</span>
                    <span className="text-[10px] text-[#57585A] font-medium">{card.desc}</span>
                  </div>
                ))}
              </div>

              {showBlogForm ? (
                /* Inline Add/Edit Blog Form */
                <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                    <h3 className="text-xl font-bold text-[#1A1A1A] font-sora">
                      {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                    </h3>
                    <button 
                      onClick={() => setShowBlogForm(false)}
                      className="px-4 py-2 border border-[#E2E8F0] hover:bg-zinc-50 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleBlogSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Blog Title *</label>
                        <input
                          type="text"
                          required
                          value={blogTitle}
                          onChange={(e) => setBlogTitle(e.target.value)}
                          placeholder="e.g. 5 Tips to Maintain Your Combine Harvester Before Rabi Season"
                          className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Category *</label>
                        <select
                          value={blogCategory}
                          onChange={(e) => handleCategoryChange(e.target.value, 'standard')}
                          className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="Other">Other (One-time...)</option>
                          <option value="Add New Category...">Add New Category...</option>
                        </select>
                        {blogCategory === "Other" && (
                          <div className="mt-2.5">
                            <input
                              type="text"
                              required
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              placeholder="Type custom one-time category..."
                              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Publication Date (Optional)</label>
                        <input
                          type="text"
                          value={blogDate}
                          onChange={(e) => setBlogDate(e.target.value)}
                          placeholder="e.g. Jun 16, 2026 (defaults to current date)"
                          className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Blog Cover Image</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBlogImageFile(file);
                                setBlogImagePreview(URL.createObjectURL(file));
                                setBlogImageUrl(""); // Clear URL input when uploading a file
                              }
                            }}
                            className="hidden"
                            id="blog-image-picker"
                          />
                          <label
                            htmlFor="blog-image-picker"
                            className="px-4 py-2.5 border border-[#E2E8F0] hover:bg-zinc-50 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-2 justify-center shrink-0"
                          >
                            <Camera size={14} /> Upload File
                          </label>
                          
                          <span className="text-xs text-gray-400 font-bold text-center self-center shrink-0">OR</span>
                          
                          <input
                            type="text"
                            value={blogImageUrl}
                            onChange={(e) => {
                              setBlogImageUrl(e.target.value);
                              setBlogImagePreview(e.target.value);
                              setBlogImageFile(null); // Clear file when entering a URL
                            }}
                            placeholder="Enter image web URL (or AI pre-filled link)..."
                            className="flex-1 min-w-0 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263]"
                          />

                          {blogImagePreview && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#E2E8F0] shrink-0 self-center">
                              <img src={blogImagePreview} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setBlogImageFile(null);
                                  setBlogImagePreview("");
                                  setBlogImageUrl("");
                                }}
                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Short Description *</label>
                      <textarea
                        required
                        rows={2}
                        value={blogShortDesc}
                        onChange={(e) => setBlogShortDesc(e.target.value)}
                        placeholder="Provide a brief summary card overview..."
                        className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-[#57585A] block mb-1.5 font-bold">Full Article Content *</label>
                      <textarea
                        required
                        rows={8}
                        value={blogContent}
                        onChange={(e) => setBlogContent(e.target.value)}
                        placeholder="Write the full body content here..."
                        className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingBlog}
                      className="w-full py-3.5 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition disabled:opacity-60 flex items-center justify-center gap-2 font-bold font-sora cursor-pointer"
                    >
                      {savingBlog ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Save Blog Post"
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Blogs Listing Table & Directory */
                <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Blogs Directory</h3>
                        <p className="text-xs text-[#57585A] mt-0.5">Manage and track views analytics for all articles.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
                          <input
                            type="text"
                            value={adminBlogsSearch}
                            onChange={(e) => setAdminBlogsSearch(e.target.value)}
                            placeholder="Search articles..."
                            className="pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263]"
                          />
                        </div>
                        <button
                          onClick={startAiGenerateBlog}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles size={14} /> Generate with AI
                        </button>
                        <button
                          onClick={startCreateBlog}
                          className="px-4 py-2 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={14} /> Add Blog Post
                        </button>
                      </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                      {/* Category Filter */}
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-zinc-500">Category</span>
                        <select
                          value={blogCategoryFilter}
                          onChange={(e) => setBlogCategoryFilter(e.target.value)}
                          className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                        >
                          <option value="">All Categories (Select All)</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Filter */}
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-zinc-500">Sort By</span>
                        <select
                          value={blogSortFilter}
                          onChange={(e) => setBlogSortFilter(e.target.value)}
                          className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                        >
                          <option value="">Default Sort (Off)</option>
                          <option value="title_asc">Title: A-Z</option>
                          <option value="title_desc">Title: Z-A</option>
                          <option value="date_newest">Date Published: Newest</option>
                          <option value="date_oldest">Date Published: Oldest</option>
                        </select>
                      </div>

                      {/* Reset Button */}
                      {(blogCategoryFilter || blogSortFilter) && (
                        <button
                          onClick={() => {
                            setBlogCategoryFilter("");
                            setBlogSortFilter("");
                          }}
                          className="mt-4 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[#57585A]">
                      <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                        <tr>
                          <th className="px-6 py-3.5 w-16">Cover</th>
                          <th className="px-6 py-3.5">Title</th>
                          <th className="px-6 py-3.5">Category</th>
                          <th className="px-6 py-3.5">Published Date</th>
                          <th className="px-6 py-3.5 text-center">Views</th>
                          <th className="px-6 py-3.5 text-center">Likes</th>
                          <th className="px-6 py-3.5 text-center">Comments</th>
                          <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]/50 bg-white font-medium">
                        {filteredBlogs.filter(b => b.title?.toLowerCase().includes(adminBlogsSearch.toLowerCase()) || b.category?.toLowerCase().includes(adminBlogsSearch.toLowerCase())).length > 0 ? (
                          filteredBlogs
                            .filter(b => b.title?.toLowerCase().includes(adminBlogsSearch.toLowerCase()) || b.category?.toLowerCase().includes(adminBlogsSearch.toLowerCase()))
                            .map((blog) => (
                              <tr key={blog.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <img
                                    src={blog.image_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"}
                                    alt="cover"
                                    className="w-10 h-10 object-cover rounded-lg border border-[#E2E8F0]"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                                    }}
                                  />
                                </td>
                                <td className="px-6 py-4 font-bold text-[#1A1A1A] font-sora max-w-xs truncate">{blog.title}</td>
                                <td className="px-6 py-4">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                                    {blog.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{blog.date || "N/A"}</td>
                                <td className="px-6 py-4 text-center font-bold text-slate-800">{blog.views || 0}</td>
                                <td className="px-6 py-4 text-center text-rose-600 font-bold">{blog.likes_count || 0}</td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => openBlogComments(blog)}
                                    className="px-2.5 py-1 rounded-lg border border-[#e8dfd2] bg-[#fcfbf9] text-[#D97706] font-bold hover:bg-[#e8dfd2]/40 transition text-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                                    title="Moderate Comments"
                                  >
                                    <MessageCircle size={13} />
                                    {blog.comments_count || 0}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    onClick={() => openBlogPreview(blog)}
                                    className="p-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center cursor-pointer"
                                    title="Preview Article"
                                  >
                                    <BookOpen size={14} />
                                  </button>
                                  <button
                                    onClick={() => startEditBlog(blog)}
                                    className="p-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center cursor-pointer"
                                    title="Edit Blog"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => openConfirmModal("deleteBlog", String(blog.id), blog.title)}
                                    className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition inline-flex items-center justify-center cursor-pointer"
                                    title="Delete Blog"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-[#57585A]/70">
                              No blog posts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================== */}
          {/* TAB: FAQS (FAQ MANAGEMENT)        */}
          {/* ================================== */}
          {activeTab === "faqs" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>FAQ Management</h2>
                  <p className="text-xs text-[#57585A] mt-0.5">Answer submitted questions or manage existing FAQs</p>
                </div>
              </div>

              {/* FAQs Listing & Actions */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="p-6 border-b border-[#E2E8F0] space-y-4">
                  {/* Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Status Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Status</span>
                      <select
                        value={faqStatusFilter}
                        onChange={(e) => setFaqStatusFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">All Statuses (Select All)</option>
                        <option value="answered">Answered</option>
                        <option value="unanswered">Unanswered</option>
                      </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-500">Sort By</span>
                      <select
                        value={faqSortFilter}
                        onChange={(e) => setFaqSortFilter(e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg p-2 focus:outline-none focus:border-[#172263]"
                      >
                        <option value="">Default Sort (Off)</option>
                        <option value="question_asc">Question: A-Z</option>
                        <option value="question_desc">Question: Z-A</option>
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(faqStatusFilter || faqSortFilter) && (
                      <button
                        onClick={() => {
                          setFaqStatusFilter("");
                          setFaqSortFilter("");
                        }}
                        className="mt-4 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-[#57585A]">
                    <thead className="text-xs uppercase bg-[#fcfbf9] text-[#57585A] border-b border-[#E2E8F0] font-bold">
                      <tr>
                        <th className="px-6 py-3.5">Question</th>
                        <th className="px-6 py-3.5">Answer</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Date Asked</th>
                        <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]/50 bg-white font-medium font-sora">
                      {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq) => (
                          <tr key={faq.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 max-w-xs font-semibold text-[#1A1A1A] break-words">
                              {faq.question}
                            </td>
                            <td className="px-6 py-4 max-w-sm text-xs break-words">
                              {faq.answer ? (
                                <p className="leading-relaxed">{faq.answer}</p>
                              ) : (
                                <span className="text-amber-600 font-bold italic">Unanswered</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                faq.status === 'Answered'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {faq.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-[#57585A]">
                              {new Date(faq.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {faq.status === 'Pending' ? (
                                  <button
                                    onClick={() => {
                                      setAnsweringFaqId(faq.id);
                                      setFaqAnswerText("");
                                    }}
                                    className="px-3 py-1.5 bg-[#172263] text-white hover:bg-[#11194A] text-xs font-bold rounded-xl transition cursor-pointer"
                                  >
                                    Answer
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAnsweringFaqId(faq.id);
                                      setFaqAnswerText(faq.answer || "");
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                  >
                                    Edit Answer
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteFaq(faq.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-100 rounded-xl transition cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-[#57585A]/70">
                            No FAQ questions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Answering Form Modal / Expandable Panel */}
              {answeringFaqId && (
                <div className="bg-slate-50/50 border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-[#1A1A1A] font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {adminFaqs.find(f => f.id === answeringFaqId)?.answer ? 'Edit Answer for Question' : 'Provide Answer for Question'}
                  </h3>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-[#57585A] leading-relaxed italic">
                    "{adminFaqs.find(f => f.id === answeringFaqId)?.question}"
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-[#57585A] font-bold uppercase tracking-wider block">Your Answer *</label>
                    <textarea
                      value={faqAnswerText}
                      onChange={(e) => setFaqAnswerText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263] resize-none"
                      placeholder="Type your answer here..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnswerFaqSubmit(answeringFaqId)}
                      className="px-4 py-2.5 bg-[#172263] hover:bg-[#11194A] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Save and Approve
                    </button>
                    <button
                      onClick={() => {
                        setAnsweringFaqId(null);
                        setFaqAnswerText("");
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================== */}
          {/* TAB: BACKGROUNDS Settings          */}
          {/* ================================== */}
          {activeTab === "backgrounds" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>Background Settings</h2>
                  <p className="text-xs text-[#57585A] mt-0.5">Manage the background images used on the public landing page</p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.01)] max-w-2xl">
                <h3 className="text-base font-bold text-[#1A1A1A] font-sora mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Servicing Enquiry Section Background</h3>
                
                <div className="space-y-6">
                  {/* Current Preview */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Current Background Preview</span>
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <img 
                        src={adminEnquiryBg || '/enquiry_background/background.png'} 
                        alt="Enquiry Background Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Upload Form */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sora">Upload New Background</span>
                      <p className="text-xs text-slate-500 mb-3">Recommended resolution: 1920x1080. Format: PNG, JPG, or WEBP.</p>
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 bg-[#172263] hover:bg-[#11194A] text-white rounded-xl text-xs font-bold cursor-pointer transition-all">
                          <Upload size={14} /> Select Background Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              const formData = new FormData();
                              formData.append('image', file);
                              
                              const uploadToast = toast.loading('Uploading background image...');
                              try {
                                const res = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData
                                });
                                
                                if (res.ok) {
                                  const data = await res.json();
                                  setAdminEnquiryBg(data.url);
                                  toast.success('Image uploaded successfully. Click Save Settings to apply.', { id: uploadToast });
                                } else {
                                  const err = await res.json();
                                  toast.error(err.error || 'Failed to upload image.', { id: uploadToast });
                                }
                              } catch (err) {
                                console.error(err);
                                toast.error('Error uploading image.', { id: uploadToast });
                              }
                            }}
                          />
                        </label>
                        {adminEnquiryBg && adminEnquiryBg !== '/enquiry_background/background.png' && (
                          <button
                            onClick={() => setAdminEnquiryBg('/enquiry_background/background.png')}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Reset to Default
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={async () => {
                          const saveToast = toast.loading('Saving settings...');
                          try {
                            const res = await fetch('/api/admin/settings', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                enquiry_background: adminEnquiryBg
                              })
                            });
                            
                            if (res.ok) {
                              toast.success('Background settings updated successfully!', { id: saveToast });
                            } else {
                              const err = await res.json();
                              toast.error(err.error || 'Failed to update settings.', { id: saveToast });
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error('Error saving settings.', { id: saveToast });
                          }
                        }}
                        className="px-6 py-2 bg-[#172263] hover:bg-[#11194A] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* TAB: EDIT SITE CONTENT             */}
          {/* ================================== */}
          {activeTab === "edit-content" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>Edit Site Content</h2>
                  <p className="text-xs text-[#57585A] mt-0.5">Manage, customize, and translate static texts and labels across the entire website.</p>
                </div>
              </div>

              {/* Language & Namespace Controls */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white border border-[#E2E8F0] p-5 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Lang Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#57585A] uppercase tracking-wider block font-sora">Language</span>
                    <div className="flex flex-wrap bg-[#f5eee5]/50 border border-[#E7E0D5] p-1 rounded-xl gap-1">
                      {activeLanguages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedContentLang(lang.code)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedContentLang === lang.code
                              ? "bg-[#172263] text-white shadow-sm font-extrabold"
                              : "text-[#57585A] hover:text-[#172263]"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add New Indian Language Option */}
                  {availableLanguages.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[#57585A] uppercase tracking-wider block font-sora">Add Indian Language</span>
                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedAddLang}
                          onChange={(e) => setSelectedAddLang(e.target.value)}
                          disabled={addingLanguage}
                          className="px-3 py-1.5 bg-[#f5eee5]/50 border border-[#E7E0D5] rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#172263] text-[#57585A] h-[32px] cursor-pointer"
                        >
                          {availableLanguages.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddLanguage}
                          disabled={addingLanguage}
                          className="px-4 py-1.5 bg-[#172263] hover:bg-[#11194A] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1 h-[32px]"
                        >
                          {addingLanguage ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Namespace Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#57585A] uppercase tracking-wider block font-sora">Section</span>
                    <div className="flex bg-[#f5eee5]/50 border border-[#E7E0D5] p-1 rounded-xl gap-1">
                      {[
                        { code: "pages", label: "Main Pages" },
                        { code: "static", label: "Static Labels" },
                        { code: "common", label: "Common Texts" }
                      ].map(ns => (
                        <button
                          key={ns.code}
                          onClick={() => setSelectedContentNs(ns.code)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedContentNs === ns.code
                              ? "bg-[#172263] text-white shadow-sm font-extrabold"
                              : "text-[#57585A] hover:text-[#172263]"
                          }`}
                        >
                          {ns.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Search input */}
                <div className="space-y-1.5 lg:w-80">
                  <span className="text-[10px] font-bold text-[#57585A] uppercase tracking-wider block font-sora">Search</span>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-[#57585A]" size={16} />
                    <input
                      type="text"
                      placeholder="Search content or key..."
                      value={contentSearchTerm}
                      onChange={(e) => {
                        setContentSearchTerm(e.target.value);
                        setContentPage(1);
                      }}
                      className="w-full pl-9 pr-8 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#172263] placeholder:text-[#57585A]/40"
                    />
                    {contentSearchTerm && (
                      <button
                        onClick={() => setContentSearchTerm("")}
                        className="absolute right-3 top-2 text-[#57585A] hover:text-red-500 font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              {loadingOverrides ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E2E8F0] rounded-3xl">
                  <Loader2 className="w-8 h-8 text-[#172263] animate-spin" />
                  <span className="text-xs text-[#57585A] mt-2">Loading content overrides...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const flatKeysMap = flattenObject(defaultTranslations[selectedContentLang]?.[selectedContentNs] || {});
                    
                    const keys = Object.keys(flatKeysMap);
                    const filtered = keys.filter(k => {
                      const keyMatch = k.toLowerCase().includes(contentSearchTerm.toLowerCase());
                      const defaultValMatch = flatKeysMap[k].toLowerCase().includes(contentSearchTerm.toLowerCase());
                      const overrideVal = editingOverrides[`${selectedContentLang}.${selectedContentNs}.${k}`] || "";
                      const overrideMatch = overrideVal.toLowerCase().includes(contentSearchTerm.toLowerCase());
                      return keyMatch || defaultValMatch || overrideMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-20 bg-white border border-[#E2E8F0] rounded-3xl space-y-2">
                          <div className="text-slate-300 text-5xl">🔍</div>
                          <h3 className="text-base font-bold text-[#1A1A1A] font-sora">No translations found</h3>
                          <p className="text-xs text-[#57585A] max-w-md mx-auto">Try adjusting your search criteria or selecting a different section or language.</p>
                        </div>
                      );
                    }

                    const ITEMS_PER_PAGE = 10;
                    const totalP = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                    const paginated = filtered.slice((contentPage - 1) * ITEMS_PER_PAGE, contentPage * ITEMS_PER_PAGE);

                    return (
                      <>
                        <div className="grid gap-4">
                          {paginated.map(k => {
                            const defaultVal = flatKeysMap[k];
                            const overrideKey = `${selectedContentLang}.${selectedContentNs}.${k}`;
                            const savedOverride = editingOverrides[overrideKey];
                            const isOverridden = savedOverride !== undefined;
                            
                            const displayVal = pendingEdits[k] !== undefined
                              ? pendingEdits[k]
                              : (savedOverride !== undefined ? savedOverride : "");

                            const hasChanges = pendingEdits[k] !== undefined && pendingEdits[k] !== (savedOverride !== undefined ? savedOverride : "");
                            const isLongText = defaultVal.length > 80;

                            return (
                              <div key={k} className="bg-white border border-[#E2E8F0] p-5 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-all flex flex-col gap-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2">
                                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md max-w-full break-all">
                                    {k}
                                  </span>
                                  <div className="flex gap-2">
                                    {isOverridden && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Edited Custom Content
                                      </span>
                                    )}
                                    {!isOverridden && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                        Default System text
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Default Value */}
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Default Value:</span>
                                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs text-slate-600 whitespace-pre-wrap break-words min-h-[42px] leading-relaxed">
                                      {defaultVal}
                                    </div>
                                  </div>

                                  {/* Custom Editor Value */}
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Override Value:</span>
                                    {isLongText ? (
                                      <textarea
                                        value={displayVal}
                                        placeholder={defaultVal}
                                        onChange={(e) => setPendingEdits(prev => ({ ...prev, [k]: e.target.value }))}
                                        rows={3}
                                        className="w-full p-3 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#172263] leading-relaxed resize-y"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={displayVal}
                                        placeholder={defaultVal}
                                        onChange={(e) => setPendingEdits(prev => ({ ...prev, [k]: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#172263]"
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-50">
                                  {isOverridden && (
                                    <button
                                      onClick={() => handleRevertOverride(k)}
                                      className="px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                    >
                                      Revert to Default
                                    </button>
                                  )}
                                  <button
                                    disabled={!hasChanges}
                                    onClick={() => handleSaveOverride(k, displayVal)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                      hasChanges
                                        ? "bg-[#172263] hover:bg-[#11194A] text-white cursor-pointer"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                    }`}
                                  >
                                    Save Content
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination controls */}
                        {totalP > 1 && (
                          <div className="flex items-center justify-between bg-white border border-[#E2E8F0] px-6 py-4 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.01)] mt-4">
                            <button
                              disabled={contentPage === 1}
                              onClick={() => setContentPage(p => Math.max(1, p - 1))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                contentPage === 1
                                  ? "border-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-[#E2E8F0] text-[#172263] hover:bg-[#f5eee5]/20 cursor-pointer"
                              }`}
                            >
                              Previous
                            </button>
                            <span className="text-xs font-semibold text-[#57585A]">
                              Page <strong className="text-[#1A1A1A]">{contentPage}</strong> of <strong className="text-[#1A1A1A]">{totalP}</strong>
                            </span>
                            <button
                              disabled={contentPage === totalP}
                              onClick={() => setContentPage(p => Math.min(totalP, p + 1))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                contentPage === totalP
                                  ? "border-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-[#E2E8F0] text-[#172263] hover:bg-[#f5eee5]/20 cursor-pointer"
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-md w-full rounded-[24px] p-6 space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Administrative Action Confirmation</h3>
                <p className="text-[#57585A] text-sm mt-1">
                  Are you absolutely sure you want to proceed?
                  {confirmType === 'block' && ` This will prevent "${confirmTargetName}" from logging into the website.`}
                  {confirmType === 'unblock' && ` This will restore account access privileges for "${confirmTargetName}".`}
                  {confirmType === 'wipe' && ` This will permanently delete all machine listings, requests, and profiles owned by "${confirmTargetName}", and block the user.`}
                  {confirmType === 'deleteHarv' && ` This will permanently delete listing "${confirmTargetName}".`}
                  {confirmType === 'deleteReq' && ` This will permanently remove request "${confirmTargetName}".`}
                  {confirmType === 'deleteBlog' && ` This will permanently delete the blog post "${confirmTargetName}".`}
                  {confirmType === 'deleteOp' && ` This will permanently delete operator profile "${confirmTargetName}".`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-[#57585A] font-bold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Listing Viewer Modal */}
      {showDetailModal && selectedListingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-2xl w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Banner/Header Cover Image */}
            <div className="h-56 bg-slate-100 relative shrink-0">
              {selectedListingType === 'harvester' ? (
                getAllImages(selectedListingDetail.imagePath).length > 0 ? (
                  <img
                    src={getAllImages(selectedListingDetail.imagePath)[0]}
                    alt={selectedListingDetail.machineName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center">
                    <TractorIllustration size={160} />
                  </div>
                )
              ) : (
                selectedListingDetail.image_path ? (
                  <img
                    src={selectedListingDetail.image_path}
                    alt={selectedListingDetail.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#172263]/10 to-[#E82326]/10 flex items-center justify-center">
                    <UserCheck size={80} className="text-[#172263]/60" />
                  </div>
                )
              )}
              
              {/* Category Badge */}
              <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 bg-[#172263] text-white rounded-full shadow-md uppercase tracking-wider">
                {selectedListingType === 'harvester' ? 'Harvester' : 'Operator Profile'}
              </span>

              {/* Close button */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-zinc-800 rounded-full shadow-md backdrop-blur-sm transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
              
              {/* Title Header */}
              <div>
                <h3 className="text-2xl font-extrabold text-[#1A1A1A] font-sora">
                  {selectedListingType === 'harvester' ? selectedListingDetail.machineName : selectedListingDetail.name}
                </h3>
                <p className="text-sm text-[#57585A] mt-1 font-medium flex items-center gap-1">
                  <MapPin size={14} className="text-red-500" />
                  {selectedListingDetail.location}, {selectedListingDetail.state}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#fcfbf9] p-4 border border-[#e8dfd2]/60 rounded-2xl">
                {selectedListingType === 'harvester' ? (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Company</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.company}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Model</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.model}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Model Year</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.year || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Serial No</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.serialNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Chassis No</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.chassisNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Mfg Month/Year</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.mfgMonthYear || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Engine No</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.engineNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Engine Power</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.enginePower || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Engine Make</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.engineMake || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Engine Model</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.engineModel || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Service Hotline</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.serviceHotlineNo || 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Experience</span>
                      <span className="text-sm font-bold text-[#1A1A1A] font-sora mt-0.5 block">{selectedListingDetail.experience} Years</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#57585A] tracking-wider block">Availability</span>
                      <span className="mt-1 block">
                        <AvailabilityBadge status={selectedListingDetail.availability} />
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Listing Gallery (All Images) */}
              {selectedListingType === 'harvester' && (
                <div className="border-t border-[#E2E8F0]/80 pt-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A] font-sora">Listing Gallery</h4>
                  {getAllImages(selectedListingDetail.imagePath).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {getAllImages(selectedListingDetail.imagePath).map((imgUrl: string, idx: number) => (
                        <div key={idx} className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-zinc-200 shadow-sm relative group">
                          <img
                            src={imgUrl}
                            alt={`${selectedListingDetail.machineName} - Photo ${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                            onClick={() => window.open(imgUrl, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#57585A] italic">No photos uploaded for this listing.</p>
                  )}
                </div>
              )}

              {/* Machine Expertise if Operator */}
              {selectedListingType === 'operator' && selectedListingDetail.machineExpertise && selectedListingDetail.machineExpertise.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A]">Machine Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedListingDetail.machineExpertise.map((m: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 bg-blue-50 text-[#172263] border border-[#172263]/10 rounded-full font-semibold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Operator ID Verification Files Comparison & Audit Receipt */}
              {selectedListingType === 'operator' && (
                <div className="border-t border-[#E2E8F0]/80 pt-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A] flex items-center gap-1.5 font-sora">
                    <ShieldCheck size={14} className="text-[#172263]" /> Operator ID Verification Details
                  </h4>
                  
                  {loadingVerificationDetails ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                      <Loader2 size={24} className="animate-spin text-[#172263]" />
                      <span className="text-xs text-[#57585A] font-semibold">Loading secure verification files...</span>
                    </div>
                  ) : operatorVerificationDetails ? (
                    <div className="space-y-4">
                      {/* Account Owner Profile Details */}
                      {operatorVerificationDetails.operator && (
                        <div className="bg-zinc-50 border border-zinc-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#172263] flex items-center justify-center text-white text-base font-black shrink-0 overflow-hidden ring-2 ring-zinc-200">
                              {operatorVerificationDetails.operator.signupProfilePic ? (
                                <img
                                  src={operatorVerificationDetails.operator.signupProfilePic}
                                  alt="Signup Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{operatorVerificationDetails.operator.signupName?.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#57585A] block">Submitting User Account</span>
                              <p className="font-extrabold text-sm text-[#1A1A1A] font-sora mt-0.5">{operatorVerificationDetails.operator.signupName || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="bg-white border border-zinc-150 rounded-xl px-3 py-2 shrink-0">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#57585A] block">Logged In Email</span>
                            <span className="text-xs font-bold text-[#172263] font-mono mt-0.5 block">{operatorVerificationDetails.operator.signupEmail || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                      {/* Side by Side Images */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-zinc-200 rounded-2xl p-3 flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Live Selfie Capture</span>
                          {operatorVerificationDetails.verificationFiles.selfieUrl ? (
                            <img
                              src={operatorVerificationDetails.verificationFiles.selfieUrl}
                              alt="Selfie"
                              className="w-full aspect-square object-cover rounded-xl border border-zinc-200 hover:scale-105 transition-transform cursor-zoom-in"
                              onClick={() => window.open(operatorVerificationDetails.verificationFiles.selfieUrl, '_blank')}
                            />
                          ) : (
                            <div className="w-full aspect-square bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-450 italic text-xs">
                              No selfie uploaded
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 border border-zinc-200 rounded-2xl p-3 flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 mb-2">License Front</span>
                          {operatorVerificationDetails.verificationFiles.licenseFrontUrl ? (
                            <img
                              src={operatorVerificationDetails.verificationFiles.licenseFrontUrl}
                              alt="License Front"
                              className="w-full aspect-square object-cover rounded-xl border border-zinc-200 hover:scale-105 transition-transform cursor-zoom-in"
                              onClick={() => window.open(operatorVerificationDetails.verificationFiles.licenseFrontUrl, '_blank')}
                            />
                          ) : (
                            <div className="w-full aspect-square bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-455 italic text-xs">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 border border-zinc-200 rounded-2xl p-3 flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 mb-2">License Back</span>
                          {operatorVerificationDetails.verificationFiles.licenseBackUrl ? (
                            <img
                              src={operatorVerificationDetails.verificationFiles.licenseBackUrl}
                              alt="License Back"
                              className="w-full aspect-square object-cover rounded-xl border border-zinc-200 hover:scale-105 transition-transform cursor-zoom-in"
                              onClick={() => window.open(operatorVerificationDetails.verificationFiles.licenseBackUrl, '_blank')}
                            />
                          ) : (
                            <div className="w-full aspect-square bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-456 italic text-xs">
                              No image
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cryptographic Consent Audit Logs */}
                      {operatorVerificationDetails.auditLog && (
                        <div className="bg-blue-50/50 border border-blue-200/50 p-4 rounded-2xl text-xs space-y-2">
                          <div className="font-bold text-[#172263] uppercase tracking-wider text-[10px] border-b border-blue-200/50 pb-1.5 flex items-center justify-between font-sora">
                            <span>Consent Audit Receipt (Tamper-Proof)</span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold lowercase font-sora">signature verified</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-zinc-600 font-semibold">
                            <p><strong>Signed Timestamp:</strong> {new Date(operatorVerificationDetails.auditLog.timestamp).toLocaleString()}</p>
                            <p><strong>IP Address:</strong> <code className="bg-blue-100/50 px-1.5 py-0.5 rounded text-[10px] font-mono">{operatorVerificationDetails.auditLog.ip_address}</code></p>
                            <p className="md:col-span-2"><strong>User Agent:</strong> <code className="bg-blue-100/50 px-1.5 py-0.5 rounded text-[10px] block truncate font-mono" title={operatorVerificationDetails.auditLog.user_agent}>{operatorVerificationDetails.auditLog.user_agent}</code></p>
                            <p className="md:col-span-2"><strong>Consent Text Given:</strong> <span className="italic block mt-1 bg-white p-2.5 rounded border border-zinc-200 leading-relaxed text-zinc-650 font-medium font-sora">"{operatorVerificationDetails.auditLog.consent_text}"</span></p>
                            <p className="md:col-span-2"><strong>Consent Log signature (HMAC):</strong> <code className="bg-zinc-100 px-1.5 py-1 rounded block break-all font-mono text-[9px] text-zinc-800 mt-1">{operatorVerificationDetails.auditLog.signature}</code></p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 font-semibold text-center italic font-sora">
                      This operator has not completed ID verification or secure files are currently unavailable.
                    </div>
                  )}
                </div>
              )}

              {/* Owner / Contact Details */}
              <div className="border-t border-[#E2E8F0]/80 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A]">Contact Information</h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fcfbf9] p-4 border border-[#e8dfd2]/60 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-[#57585A] uppercase block">Owner Name</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{selectedListingDetail.ownerName || selectedListingDetail.name || 'N/A'}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selectedListingDetail.phone && (
                      <a
                        href={`tel:${selectedListingDetail.phone}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                      >
                        <Phone size={14} /> Call {selectedListingDetail.phone}
                      </a>
                    )}
                    {selectedListingDetail.whatsapp && (
                      <a
                        href={`https://wa.me/91${selectedListingDetail.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-[#E2E8F0]/80 pt-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A]">Description</h4>
                <p className="text-sm text-[#57585A] leading-relaxed whitespace-pre-line bg-[#fcfbf9] p-4 border border-[#e8dfd2]/30 rounded-2xl font-semibold">
                  {selectedListingDetail.description || 'No description provided.'}
                </p>
              </div>

              {/* Verification & Moderation Console */}
              <div className="border-t border-[#E2E8F0]/80 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#57585A] flex items-center gap-1.5">
                  🛡️ Verification Status: {selectedListingType === 'operator' ? getUserVerificationStatusBadge(selectedListingDetail.verification_status) : getStatusBadge(selectedListingDetail.verification_status)}
                </h4>
                {selectedListingDetail.verification_status === 'Pending' ? (
                  <div className="bg-slate-50 border border-zinc-200 p-4 rounded-2xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1.5">
                        {selectedListingType === 'operator' ? "Verification Feedback / Rejection Reason (Optional for verification, recommended for rejection)" : "Verification Feedback / Rejection Reason (Optional for approval, highly recommended for rejection)"}
                      </label>
                      <textarea
                        value={adminFeedback}
                        onChange={(e) => setAdminFeedback(e.target.value)}
                        placeholder={selectedListingType === 'operator' ? "e.g. Please upload a clearer photo of the license, or details are incomplete." : "e.g. Please upload a clear photo of the harvester license plate, or contact details are invalid."}
                        rows={3}
                        className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-[#172263] leading-relaxed"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyListing("Approved")}
                        disabled={submittingVerification}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} /> {selectedListingType === 'operator' ? "Mark as Verified" : "Approve Listing"}
                      </button>
                      <button
                        onClick={() => handleVerifyListing("Rejected")}
                        disabled={submittingVerification}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={14} /> {selectedListingType === 'operator' ? "Mark as Unverified" : "Reject Listing"}
                      </button>
                    </div>
                  </div>
                ) : (
                  (selectedListingDetail.verificationFeedback || selectedListingDetail.verification_feedback) ? (
                    <div className="bg-[#fcfbf9] border border-zinc-200 p-4 rounded-2xl">
                      <span className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Feedback Given</span>
                      <p className="text-xs text-[#1A1A1A] font-semibold leading-relaxed">
                        {selectedListingDetail.verificationFeedback || selectedListingDetail.verification_feedback}
                      </p>
                    </div>
                  ) : null
                )}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-[#fcfbf9] border-t border-[#E2E8F0] flex justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  if (selectedListingType === 'harvester') {
                    openConfirmModal("deleteHarv", selectedListingDetail.id, selectedListingDetail.machineName);
                  } else {
                    openConfirmModal("deleteOp", selectedListingDetail.id, selectedListingDetail.name);
                  }
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Remove Listing
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Blog Comments Modal */}
      {showCommentsModal && activeBlogForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-xl w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Moderate Blog Comments</h3>
                <p className="text-xs text-[#57585A] mt-0.5 line-clamp-1">Article: {activeBlogForComments.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setActiveBlogForComments(null);
                  setSelectedBlogComments([]);
                }}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comment List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 min-h-[300px]">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[#172263] animate-spin" />
                  <span className="text-xs text-[#57585A] mt-2 font-bold">Loading comments...</span>
                </div>
              ) : selectedBlogComments.length > 0 ? (
                selectedBlogComments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-[#fcfbf9] border border-[#e8dfd2]/50 rounded-2xl flex items-start gap-4 hover:border-[#e8dfd2] transition">
                    <div className="w-8 h-8 rounded-full bg-[#172263] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1A1A1A] truncate">{comment.user_name}</span>
                        <span className="text-[10px] text-[#57585A]">
                          {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-[#57585A] mt-1 whitespace-pre-line leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBlogComment(comment.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition shrink-0 cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare size={36} className="text-[#57585A]/40 mb-2" />
                  <p className="text-sm text-[#57585A]/70 font-semibold">No comments posted on this article.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#fcfbf9] border-t border-[#E2E8F0] flex justify-end shrink-0">
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setActiveBlogForComments(null);
                  setSelectedBlogComments([]);
                }}
                className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Blog Article Preview Modal */}
      {showPreviewModal && activeBlogPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] max-w-3xl w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Image Banner header */}
            <div className="h-64 bg-zinc-100 relative shrink-0">
              <img
                src={activeBlogPreview.image_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"}
                alt={activeBlogPreview.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2.5 py-0.5 bg-[#D97706] text-white rounded-full font-bold uppercase tracking-wider">
                    {activeBlogPreview.category}
                  </span>
                  <span className="text-xs text-white/70">{activeBlogPreview.date || 'N/A'}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white font-sora line-clamp-2">
                  {activeBlogPreview.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setActiveBlogPreview(null);
                }}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 font-medium font-sora text-[#1A1A1A]">
              {/* Short Summary Card */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Executive Summary</h4>
                <p className="text-sm font-semibold text-[#57585A] leading-relaxed italic">
                  "{activeBlogPreview.short_description || activeBlogPreview.shortDescription}"
                </p>
              </div>

              {/* Full body markdown/text */}
              <div className="text-sm text-[#1A1A1A] leading-relaxed font-medium font-sora">
                {renderMarkdown(activeBlogPreview.content)}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#fcfbf9] border-t border-[#E2E8F0] flex justify-between items-center shrink-0">
              <div className="flex gap-4 text-xs text-[#57585A] font-bold">
                <span>Views: {activeBlogPreview.views || 0}</span>
                <span>Likes: {activeBlogPreview.likes_count || 0}</span>
                <span>Comments: {activeBlogPreview.comments_count || 0}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    startEditBlog(activeBlogPreview);
                  }}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Pencil size={13} /> Edit Article
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setActiveBlogPreview(null);
                  }}
                  className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* AI Blog Generator Modal */}
      {showAiBlogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E2E8F0] max-w-lg w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-sora">Generate Blog with AI</h3>
                  <p className="text-xs text-[#57585A] mt-0.5">Let AI write a formatted blog post in seconds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiBlogForm(false)}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 rounded-full transition cursor-pointer"
                disabled={generatingBlog}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAiGenerate} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#57585A] block mb-1.5 font-bold uppercase tracking-wider">Blog Title / Topic *</label>
                <input
                  type="text"
                  required
                  value={aiPromptTitle}
                  onChange={(e) => setAiPromptTitle(e.target.value)}
                  placeholder="e.g. Tractor Maintenance Tips for Rainy Season"
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  disabled={generatingBlog}
                />
              </div>

              <div>
                <label className="text-xs text-[#57585A] block mb-1.5 font-bold uppercase tracking-wider">Keywords / Focus Areas (Comma separated)</label>
                <input
                  type="text"
                  value={aiPromptKeywords}
                  onChange={(e) => setAiPromptKeywords(e.target.value)}
                  placeholder="e.g. rust prevention, battery care, lubrication"
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                  disabled={generatingBlog}
                />
              </div>

              <div>
                <label className="text-xs text-[#57585A] block mb-1.5 font-bold uppercase tracking-wider">Category *</label>
                <select
                  value={aiPromptCategory}
                  onChange={(e) => handleCategoryChange(e.target.value, 'ai')}
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#57585A] focus:outline-none focus:border-[#172263]"
                  disabled={generatingBlog}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other (One-time...)</option>
                  <option value="Add New Category...">Add New Category...</option>
                </select>
                {aiPromptCategory === "Other" && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      required
                      value={aiCustomCategory}
                      onChange={(e) => setAiCustomCategory(e.target.value)}
                      placeholder="Type custom one-time category..."
                      className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#172263]"
                      disabled={generatingBlog}
                    />
                  </div>
                )}
              </div>



              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-[#E2E8F0] mt-6">
                <button
                  type="button"
                  onClick={() => setShowAiBlogForm(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  disabled={generatingBlog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingBlog}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-60 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {generatingBlog ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate Article
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

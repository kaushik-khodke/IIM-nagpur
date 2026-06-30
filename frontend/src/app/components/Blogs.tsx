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
// BLOGS
// ===========================
export function Blogs() {
  const { t } = useTranslation(["pages", "static"]);
  const [categories, setCategories] = useState<string[]>(["All", "Harvesting Tips", "Machine Maintenance", "Success Stories", "Agri News", "Weather & Season"]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch dynamic categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/blogs/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(["All", ...data]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch blog categories", err);
      }
    };
    fetchCategories();
  }, []);

  // States for Reels/Shorts Infinite Scroll Feed (Backend Paginated)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000));
  const [hasMore, setHasMore] = useState(true);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedBlogs, setLikedBlogs] = useState<Record<string | number, boolean>>({});
  const [likesCounts, setLikesCounts] = useState<Record<string | number, number>>({});
  const [commentsCounts, setCommentsCounts] = useState<Record<string | number, number>>({});
  const [activeBlog, setActiveBlog] = useState<any | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string | number, boolean>>({});

  const feedRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pendingLikesRef = useRef<Record<string | number, boolean>>({});
  const likeTimeoutRef = useRef<any>(null);
  const currentBlogIdRef = useRef<string | number | null>(null);

  // Sync initial loading
  useEffect(() => {
    const fetchInitialBlogs = async () => {
      setLoading(true);
      const newSeed = Math.floor(Math.random() * 1000000);
      setSeed(newSeed);
      setBlogs([]);
      setHasMore(true);
      setAutoScrollPaused(false);

      try {
        const token = localStorage.getItem("tractorsewa_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const catParam = category === "All" ? "" : `category=${encodeURIComponent(category)}`;
        const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
        const limitParam = "limit=2";
        const offsetParam = "offset=0";
        const seedParam = `seed=${newSeed}`;
        const params = [catParam, searchParam, limitParam, offsetParam, seedParam].filter(Boolean).join("&");

        const res = await fetch(`/api/blogs?${params}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setBlogs(data);
          setHasMore(data.length === 2);

          // Initialize states from dynamic database values
          const initialLiked: Record<string | number, boolean> = {};
          const counts: Record<string | number, number> = {};
          const comms: Record<string | number, number> = {};
          data.forEach((b: any) => {
            initialLiked[b.id] = !!b.has_liked;
            counts[b.id] = b.likes_count || 0;
            comms[b.id] = b.comments_count || 0;
          });
          setLikedBlogs(prev => ({ ...prev, ...initialLiked }));
          setLikesCounts(prev => ({ ...prev, ...counts }));
          setCommentsCounts(prev => ({ ...prev, ...comms }));

          // Reset scroll to top
          if (feedRef.current) {
            feedRef.current.scrollTop = 0;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(() => {
      fetchInitialBlogs();
    }, 300);

    return () => clearTimeout(delay);
  }, [search, category]);

  const loadMoreBlogs = async () => {
    if (loadingMore || !hasMore || autoScrollPaused) return;
    setLoadingMore(true);

    try {
      const token = localStorage.getItem("tractorsewa_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const catParam = category === "All" ? "" : `category=${encodeURIComponent(category)}`;
      const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
      const limitParam = "limit=2";
      const offsetParam = `offset=${blogs.length}`;
      const seedParam = `seed=${seed}`;
      const params = [catParam, searchParam, limitParam, offsetParam, seedParam].filter(Boolean).join("&");

      const res = await fetch(`/api/blogs?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const existingIds = new Set(blogs.map(b => b.id));
          const filteredNewData = data.filter((b: any) => !existingIds.has(b.id));

          setBlogs(prev => [...prev, ...filteredNewData]);
          setHasMore(data.length === 2);

          const initialLiked: Record<string | number, boolean> = {};
          const counts: Record<string | number, number> = {};
          const comms: Record<string | number, number> = {};
          data.forEach((b: any) => {
            initialLiked[b.id] = !!b.has_liked;
            counts[b.id] = b.likes_count || 0;
            comms[b.id] = b.comments_count || 0;
          });
          setLikedBlogs(prev => ({ ...prev, ...initialLiked }));
          setLikesCounts(prev => ({ ...prev, ...counts }));
          setCommentsCounts(prev => ({ ...prev, ...comms }));

          // Pause after 6 blogs loaded (Initial 2 + 2 scrolls = 6 blogs)
          if (blogs.length + filteredNewData.length >= 6) {
            setAutoScrollPaused(true);
          }
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleResumeLoading = () => {
    setAutoScrollPaused(false);
    setLoadingMore(true);
    setTimeout(() => {
      const fetchNext = async () => {
        try {
          const token = localStorage.getItem("tractorsewa_token");
          const headers: Record<string, string> = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const catParam = category === "All" ? "" : `category=${encodeURIComponent(category)}`;
          const searchParam = search ? `search=${encodeURIComponent(search)}` : "";
          const limitParam = "limit=2";
          const offsetParam = `offset=${blogs.length}`;
          const seedParam = `seed=${seed}`;
          const params = [catParam, searchParam, limitParam, offsetParam, seedParam].filter(Boolean).join("&");

          const res = await fetch(`/api/blogs?${params}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              const existingIds = new Set(blogs.map(b => b.id));
              const filteredNewData = data.filter((b: any) => !existingIds.has(b.id));

              setBlogs(prev => [...prev, ...filteredNewData]);
              setHasMore(data.length === 2);

              const initialLiked: Record<string | number, boolean> = {};
              const counts: Record<string | number, number> = {};
              const comms: Record<string | number, number> = {};
              data.forEach((b: any) => {
                initialLiked[b.id] = !!b.has_liked;
                counts[b.id] = b.likes_count || 0;
                comms[b.id] = b.comments_count || 0;
              });
              setLikedBlogs(prev => ({ ...prev, ...initialLiked }));
              setLikesCounts(prev => ({ ...prev, ...counts }));
              setCommentsCounts(prev => ({ ...prev, ...comms }));
            } else {
              setHasMore(false);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingMore(false);
        }
      };
      fetchNext();
    }, 50);
  };

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore && !autoScrollPaused) {
          loadMoreBlogs();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, loadingMore, hasMore, autoScrollPaused, blogs.length]);

  // Sync likes function
  const syncPendingLikes = async () => {
    const pending = pendingLikesRef.current;
    pendingLikesRef.current = {}; // Clear immediately

    const token = localStorage.getItem("tractorsewa_token");
    if (!token) return;

    for (const [id, liked] of Object.entries(pending)) {
      try {
        await fetch(`/api/blogs/${id}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ liked }),
        });
      } catch (err) {
        console.error(`Failed to sync like for blog ${id}`, err);
      }
    }
  };

  // Sync pending changes on unmount
  useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
      if (Object.keys(pendingLikesRef.current).length > 0) {
        syncPendingLikes();
      }
    };
  }, []);

  const handleLike = (id: string | number) => {
    const token = localStorage.getItem("tractorsewa_token");
    if (!token) {
      setAuthDialogOpen(true);
      return;
    }

    const wasLiked = !!likedBlogs[id];
    const newLiked = !wasLiked;

    // Update locally
    setLikedBlogs((prev) => ({ ...prev, [id]: newLiked }));
    setLikesCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + (newLiked ? 1 : -1)),
    }));

    // Register pending change
    pendingLikesRef.current[id] = newLiked;

    // Debounce database request (1.5 seconds)
    if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
    likeTimeoutRef.current = setTimeout(() => {
      syncPendingLikes();
    }, 1500);

    toast.success(newLiked ? t("blogs.postLiked", { defaultValue: "Post liked! ❤️" }) : t("blogs.removedFromLiked", { defaultValue: "Removed from liked posts" }));
  };

  const handleShare = (id: string | number) => {
    const url = `${window.location.origin}/blogs/${id}`;
    navigator.clipboard.writeText(url);
    toast.success(t("blogs.linkCopied", { defaultValue: "Blog link copied to clipboard! 🔗" }));
  };

  const handleScrollToTop = () => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const containerHeight = e.currentTarget.clientHeight;
    if (containerHeight === 0) return;

    const index = Math.round(scrollTop / containerHeight);
    if (index >= 0 && index < blogs.length) {
      const activeBlogItem = blogs[index];
      if (activeBlogItem && activeBlogItem.id !== currentBlogIdRef.current) {
        // Blog changed! Immediately flush pending likes of previous blog
        if (Object.keys(pendingLikesRef.current).length > 0) {
          syncPendingLikes();
        }
        currentBlogIdRef.current = activeBlogItem.id;
      }
    }
  };

  const fetchBlogDetail = async (id: string | number) => {
    const token = localStorage.getItem("tractorsewa_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const res = await fetch(`/api/blogs/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setActiveBlog(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenArticle = (blog: any) => {
    setActiveBlog(blog);
    fetchBlogDetail(blog.id);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText || !newCommentText.trim() || !activeBlog) return;

    const token = localStorage.getItem("tractorsewa_token");
    if (!token) {
      setAuthDialogOpen(true);
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/blogs/${activeBlog.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newCommentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        // Update activeBlog.comments locally
        setActiveBlog((prev: any) => ({
          ...prev,
          comments: [newComment, ...(prev?.comments || [])],
        }));
        // Update commentsCount locally
        setCommentsCounts((prev) => ({
          ...prev,
          [activeBlog.id]: (prev[activeBlog.id] || 0) + 1,
        }));
        setNewCommentText("");
        toast.success(t("blogs.commentAdded", { defaultValue: "Comment added successfully!" }));
      } else {
        const data = await res.json();
        toast.error(data.error || t("blogs.failedPostComment", { defaultValue: "Failed to post comment" }));
      }
    } catch {
      toast.error(t("blogs.failedPostCommentTry", { defaultValue: "Failed to post comment. Please try again." }));
    } finally {
      setSubmittingComment(false);
    }
  };

  const fallbackImages = [
    "/blog-punjab-farmers.png",
    "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1592982537447-6f233c7f12e2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?auto=format&fit=crop&q=80&w=800",
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#ffffff]">
      <Navbar variant="auth" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-64px)] w-full relative">
        {/* Left Sidebar - Filters & Search (Desktop Only) */}
        <aside
          className={`hidden md:flex flex-col shrink-0 border-r border-[#E2E8F0] bg-white p-6 justify-between transition-all duration-300 relative ${isSidebarOpen ? "w-80" : "w-0 p-0 border-r-0 overflow-hidden"
            }`}
        >
          {isSidebarOpen && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1A1A1A] font-sora">
                    {t("blogs.harvestingKnowledge", { defaultValue: "Harvesting Knowledge" })}
                  </h2>
                  <p className="text-xs text-[#57585A] mt-1">
                    {t("blogs.subtitle", { defaultValue: "Tips, guides, and stories from the field" })}
                  </p>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-[#57585A] hover:text-[#172263] transition-colors"
                  title={t("blogs.collapseSidebar", { defaultValue: "Collapse Sidebar" })}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("blogs.searchPlaceholder", { defaultValue: "Search articles..." })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-white transition-colors"
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#57585A]">
                  {t("blogs.categoriesLabel", { defaultValue: "Categories" })}
                </label>
                <div className="flex flex-col gap-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${category === c
                          ? "bg-[#172263] text-white border-[#172263]"
                          : "bg-white border-[#E2E8F0] text-[#57585A] hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                      {t("blogCategories." + c, { ns: "static", defaultValue: c })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isSidebarOpen && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 text-center mt-auto">
              <Tractor size={32} className="mx-auto text-blue-300 mb-2" />
              <p className="text-[10px] text-[#57585A]">
                {t("blogs.needHelp", { defaultValue: "Need help with a harvester machine? Connect with operators in your area." })}
              </p>
            </div>
          )}
        </aside>

        {/* Floating Toggle Button to open Sidebar when collapsed (Desktop Only) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="hidden md:flex absolute left-4 top-4 z-20 p-2.5 bg-white border border-[#E2E8F0] rounded-full shadow-md text-[#172263] hover:bg-slate-50 transition-all active:scale-95 items-center justify-center"
            title={t("blogs.openSidebar", { defaultValue: "Open Sidebar" })}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Mobile Filter & Search Header (Mobile Only) */}
        <div className="md:hidden bg-white border-b border-[#E2E8F0] p-4 flex flex-col gap-3 shrink-0 w-full">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#57585A]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("blogs.searchPlaceholder", { defaultValue: "Search articles..." })}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${category === c
                    ? "bg-[#172263] text-white border-[#172263]"
                    : "bg-white border-[#E2E8F0] text-[#57585A]"
                  }`}
              >
                {t("blogCategories." + c, { ns: "static", defaultValue: c })}
              </button>
            ))}
          </div>
        </div>

        {/* Infinite Scroll Snapping Container */}
        <main
          ref={feedRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth w-full flex flex-col items-center bg-[#F8FAFC]"
        >
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 size={36} className="text-[#172263] animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm max-w-sm w-full p-8 text-center">
                <EmptyState title={t("blogs.noArticlesFound", { defaultValue: "No articles found" })} description={t("blogs.tryDifferentSearch", { defaultValue: "Try a different search term or category." })} />
              </div>
            </div>
          ) : (
            <>
              {blogs.map((blog) => {
                const finalImageUrl = blog.image_url || blog.imageUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                const hasImageError = !!imageErrors[blog.id];

                return (
                  <div
                    key={blog.id}
                    className="h-[calc(100vh-178px)] md:h-[calc(100vh-64px)] w-full flex items-center justify-center shrink-0 snap-start relative p-4 md:p-6"
                  >
                    {/* Shorts-style Card - Horizontal on Desktop, Vertical on Mobile */}
                    <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#E2E8F0] overflow-hidden w-full max-w-lg md:max-w-4xl h-[92%] md:h-[84%] flex flex-col md:flex-row relative group transition-all duration-300">
                      {/* Visual Banner Header */}
                      <div className="h-[35%] md:h-full md:w-[45%] bg-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                        {!hasImageError ? (
                          <img
                            src={finalImageUrl}
                            alt={blog.title}
                            onError={() => {
                              setImageErrors((prev) => ({ ...prev, [blog.id]: true }));
                            }}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${[
                              "from-[#172263] to-[#D97706]",
                              "from-[#15803D] to-[#172263]",
                              "from-[#B91C1C] to-[#D97706]",
                              "from-[#1E3A8A] to-[#3B82F6]",
                              "from-[#78350F] to-[#D97706]"
                            ][typeof blog.id === "number" ? blog.id % 5 : 0]
                            } flex flex-col items-center justify-center p-6 text-white text-center w-full relative`}>
                            <Tractor size={40} className="text-white/20 mb-2 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full mb-1">
                              {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
                            </span>
                            <h4 className="text-xs font-bold leading-snug line-clamp-3 px-2">{blog.title}</h4>
                            <WheatWatermark className="opacity-10 scale-75" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:hidden" />

                        {/* Category Badge & Date (Only on mobile overlay) */}
                        <div className="absolute top-3 left-3 md:hidden">
                          <span className="px-2.5 py-0.5 bg-[#172263] text-white text-[9px] font-bold uppercase rounded-full shadow-md">
                            {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-12 md:hidden">
                          <h3 className="text-white text-xs sm:text-sm font-bold leading-snug drop-shadow-sm line-clamp-1">
                            {blog.title}
                          </h3>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 p-5 md:p-8 flex flex-col justify-between overflow-hidden h-[65%] md:h-full">
                        {/* Title Row (Desktop Only) */}
                        <div className="hidden md:block mb-4 shrink-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 bg-[#172263] text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                              {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
                            </span>
                            <span className="text-[10px] text-[#57585A] font-medium flex items-center gap-1">
                              <Clock size={10} /> {blog.date}
                            </span>
                          </div>
                          <h3
                            className="text-[#1A1A1A] text-xl md:text-2xl font-bold leading-tight"
                            style={{ fontFamily: "'Sora', sans-serif" }}
                          >
                            {blog.title}
                          </h3>
                        </div>

                        {/* Mobile Title Sub-row (Mobile Only) */}
                        <div className="md:hidden mb-2 shrink-0 flex items-center justify-between">
                          <span className="text-[9px] text-[#57585A] font-medium flex items-center gap-0.5">
                            <Clock size={10} /> {blog.date}
                          </span>
                        </div>

                        {/* Text description with right-padding to avoid action overlay */}
                        <div className="flex-1 overflow-y-auto pr-14 scrollbar-thin space-y-4">
                          <p className="text-[#57585A] text-xs md:text-sm leading-relaxed font-normal">
                            {blog.short_description || blog.shortDescription}
                          </p>

                          {/* Decorative Agriculture highlight */}
                          <div className="bg-amber-50/40 border-l-4 border-amber-500 p-3 md:p-4 rounded-r-xl">
                            <p className="text-[10px] md:text-[11px] italic text-[#D97706] font-medium leading-relaxed">
                              {t("blogs.agriQuote", { defaultValue: "\"Agriculture is our wisest pursuit, because in the end it will contribute most to real wealth, good morals, and happiness.\"" })}
                            </p>
                          </div>
                        </div>

                        {/* Slide Footer */}
                        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {blog.authorName ? blog.authorName.charAt(0) : "A"}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#1A1A1A]">
                                {blog.authorName || t("blogs.authorFallback", { defaultValue: "Agri Team" })}
                              </p>
                              <p className="text-[9px] text-[#57585A]">{t("blogs.expertContributor", { defaultValue: "Expert Contributor" })}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenArticle(blog)}
                            className="px-4 py-2 bg-[#172263] text-white text-xs font-bold rounded-xl hover:bg-[#11194A] transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                          >
                            <BookOpen size={13} /> {t("blogs.readArticle", { defaultValue: "Read Article" })}
                          </button>
                        </div>
                      </div>

                      {/* Reels-style Floating Action Bar (Bottom-Right on Mobile, Center-Right on Desktop) */}
                      <div className="absolute right-4 bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2 flex flex-col gap-4 items-center z-10">
                        {/* Like Heart Button */}
                        <div className="flex flex-col items-center">
                          <motion.button
                            whileTap={{ scale: 1.3 }}
                            onClick={() => handleLike(blog.id)}
                            className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md border border-[#E2E8F0] backdrop-blur-md transition-all ${likedBlogs[blog.id]
                                ? "bg-red-50 text-red-500 border-red-200"
                                : "bg-white/95 text-[#57585A] hover:text-[#172263]"
                              }`}
                          >
                            <Heart size={16} className={likedBlogs[blog.id] ? "fill-current" : ""} />
                          </motion.button>
                          <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1.5 backdrop-blur-xs shadow-xs border border-white/10 select-none">
                            {likesCounts[blog.id] || 0}
                          </span>
                        </div>

                        {/* Comment Button */}
                        <div className="flex flex-col items-center">
                          <motion.button
                            whileTap={{ scale: 1.15 }}
                            onClick={() => handleOpenArticle(blog)}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 text-[#57585A] hover:text-[#172263] flex items-center justify-center shadow-md border border-[#E2E8F0] backdrop-blur-md transition-all"
                          >
                            <MessageCircle size={15} />
                          </motion.button>
                          <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1.5 backdrop-blur-xs shadow-xs border border-white/10 select-none">
                            {commentsCounts[blog.id] || 0}
                          </span>
                        </div>

                        {/* Share Copy Button */}
                        <div className="flex flex-col items-center">
                          <motion.button
                            whileTap={{ scale: 1.15 }}
                            onClick={() => handleShare(blog.id)}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 text-[#57585A] hover:text-[#172263] flex items-center justify-center shadow-md border border-[#E2E8F0] backdrop-blur-md transition-all"
                          >
                            <Share2 size={15} />
                          </motion.button>
                          <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full mt-1.5 backdrop-blur-xs shadow-xs border border-white/10 select-none">
                            {t("blogs.share", { defaultValue: "Share" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loader Slide (Visible when scrolling to retrieve more blogs) */}
              {hasMore && (
                <div
                  ref={loaderRef}
                  className="h-[calc(100vh-178px)] md:h-[calc(100vh-64px)] w-full flex items-center justify-center shrink-0 snap-start p-4 md:p-6"
                >
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] w-full max-w-lg md:max-w-4xl h-[92%] md:h-[84%] flex flex-col justify-center items-center p-8 relative shadow-sm text-center">
                    {autoScrollPaused ? (
                      <>
                        <BookOpen size={40} className="text-[#172263] mb-4 animate-bounce" />
                        <h4 className="text-sm font-semibold text-[#1A1A1A]">Ready for more?</h4>
                        <p className="text-xs text-[#57585A] mt-1 mb-6">
                          We paused loading to optimize performance. Click below to continue loading.
                        </p>
                        <button
                          onClick={handleResumeLoading}
                          className="px-6 py-3 bg-[#172263] hover:bg-[#11194A] text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Keep Loading Blogs
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 size={36} className="text-[#172263] animate-spin mb-4" />
                        <p className="text-sm font-semibold text-[#1A1A1A]">{t("blogs.fetchingUpdates", { defaultValue: "Fetching fresh updates..." })}</p>
                        <p className="text-xs text-[#57585A] mt-1">
                          {t("blogs.bestGuides", { defaultValue: "Bringing you the best harvesting guides" })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* End of Feed Card */}
              {blogs.length > 0 && !hasMore && (
                <div className="h-[calc(100vh-178px)] md:h-[calc(100vh-64px)] w-full flex items-center justify-center shrink-0 snap-start p-4 md:p-6">
                  <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#E2E8F0] overflow-hidden w-full max-w-lg md:max-w-4xl h-[92%] md:h-[84%] flex flex-col justify-center items-center p-8 relative text-center">
                    {/* Animated Check Circle */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-16 h-16 md:w-20 md:h-20 bg-green-50 border-2 border-green-500 rounded-full flex items-center justify-center text-green-500 shadow-md mb-6 animate-pulse"
                    >
                      <CheckCircle2 size={36} className="stroke-[2.5] md:size-[44px]" />
                    </motion.div>

                    <h3
                      className="text-[#1A1A1A] text-lg md:text-xl font-bold mb-2"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {t("blogs.allCaughtUp", { defaultValue: "You're All Caught Up!" })}
                    </h3>
                    <p className="text-[#57585A] text-xs md:text-sm max-w-xs mb-8">
                      {t("blogs.allCaughtUpDesc", { defaultValue: "This was all for today. Check back tomorrow for more agri guides and harvester updates." })}
                    </p>

                    {/* Back to top button */}
                    <button
                      onClick={handleScrollToTop}
                      className="px-6 py-3 bg-[#172263] text-white text-xs md:text-sm font-bold rounded-xl hover:bg-[#11194A] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
                    >
                      <ArrowLeft size={16} className="rotate-90" /> {t("blogs.backToTop", { defaultValue: "Back to Top" })}
                    </button>

                    {/* Subtle wheat watermark */}
                    <WheatWatermark className="opacity-[0.03] bottom-6 right-6 scale-90" />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Slide-Over Drawer for Full Blog content */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${activeBlog ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setActiveBlog(null)}
        />

        {/* Drawer Container */}
        <div
          className={`absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${activeBlog ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {activeBlog && (
            <>
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                    {t("blogCategories." + activeBlog.category, { ns: "static", defaultValue: activeBlog.category })}
                  </span>
                  <span className="text-xs text-[#57585A]">{activeBlog.date}</span>
                </div>
                <button
                  onClick={() => setActiveBlog(null)}
                  className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#57585A] hover:text-[#172263] hover:shadow-sm transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="h-60 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center border border-[#E2E8F0] relative overflow-hidden">
                  <img
                    src={
                      activeBlog.image_url ||
                      activeBlog.imageUrl ||
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"
                    }
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                    }}
                    alt={activeBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h1
                  className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] leading-tight"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {activeBlog.title}
                </h1>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center text-white font-bold">
                    {activeBlog.authorName ? activeBlog.authorName.charAt(0) : "T"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      {activeBlog.authorName || t("blogs.authorTeam", { defaultValue: "Tractor Seva Agri Team" })}
                    </p>
                    <p className="text-xs text-[#57585A]">{t("blogs.authorSub", { defaultValue: "Agricultural Expert & Writer" })}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-[#E2E8F0]" />

                {/* Prose content */}
                <div className="prose prose-sm max-w-none text-[#57585A] leading-relaxed space-y-4 font-normal text-sm sm:text-base">
                  <p className="font-semibold text-[#1A1A1A] text-base">
                    {activeBlog.short_description || activeBlog.shortDescription}
                  </p>
                  <div className="text-sm text-[#57585A] leading-relaxed">
                    {activeBlog.content ? renderMarkdown(activeBlog.content) : t("blogs.loadingContent", { defaultValue: "Full article text is loading..." })}
                  </div>
                </div>

                {/* Engagement: Comments Section */}
                <div className="mt-8 pt-8 border-t border-[#E2E8F0] space-y-4">
                  <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <MessageCircle size={18} /> {t("blogs.discussion", { defaultValue: "Discussion" })} ({activeBlog.comments ? activeBlog.comments.length : commentsCounts[activeBlog.id] || 0})
                  </h3>

                  {/* Comment Form */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder={t("blogs.writeComment", { defaultValue: "Share your thoughts or ask a question..." })}
                      className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:outline-none focus:border-[#172263] bg-[#F8FAFC]"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="px-4 py-2 bg-[#172263] text-white text-xs font-bold rounded-xl hover:bg-[#11194A] transition-colors disabled:opacity-60 shrink-0"
                    >
                      {submittingComment ? t("blogs.posting", { defaultValue: "Posting..." }) : t("blogs.postComment", { defaultValue: "Comment" })}
                    </button>
                  </form>

                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {activeBlog.comments && activeBlog.comments.length > 0 ? (
                      activeBlog.comments.map((comment: any) => (
                        <div key={comment.id} className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] text-xs space-y-1">
                          <div className="flex justify-between font-semibold text-[#1A1A1A]">
                            <span>{comment.user_name}</span>
                            <span className="text-[#57585A] font-normal">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[#57585A] mt-1 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#57585A] italic text-center py-4">
                        {t("blogs.noDiscussionsYet", { defaultValue: "No discussions yet. Be the first to share your thoughts!" })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal for Logged out users attempting to like/comment */}
      <AuthChooserDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        initialMode="login"
      />
    </div>
  );
}

// Helper to parse Markdown content and render styled JSX elements in blogs
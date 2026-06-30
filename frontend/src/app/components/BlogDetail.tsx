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

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown, getStatusBadge, getUserVerificationStatusBadge } from "./pagesShared";

// ===========================
// BLOG DETAIL
// ===========================
export function BlogDetail() {
  const { t } = useTranslation(["pages", "static"]);
  const { id } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBlog(data);
        }

        const relRes = await fetch(`/api/blogs?limit=4`);
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelatedBlogs(relData.filter((b: any) => String(b.id) !== id).slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!blog) return <EmptyState title={t("blogs.notFound", { defaultValue: "Blog not found" })} />;

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Navbar variant="auth" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <nav className="text-sm text-[#57585A] mb-6 flex items-center gap-2">
          <Link to="/blogs" className="hover:text-[#172263]">{t("blogs.title", { defaultValue: "Blogs" })}</Link>
          <ChevronRight size={14} />
          <span className="text-[#172263]">{t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}</span>
          <ChevronRight size={14} />
          <span className="truncate">{blog.title}</span>
        </nav>

        <div className="h-64 bg-zinc-100 rounded-2xl overflow-hidden mb-8 border border-[#E2E8F0] relative">
          <img
            src={blog.image_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-sm">
            {t("blogCategories." + blog.category, { ns: "static", defaultValue: blog.category })}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#172263] to-[#D97706] flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm text-[#57585A]">{t("blogs.authorFallback", { defaultValue: "Agri Team" })}</span>
          </div>
          <span className="text-sm text-[#57585A]">{blog.date}</span>
        </div>

        <h1
          className="text-4xl text-[#1A1A1A] mb-6 leading-tight"
          style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
        >
          {blog.title}
        </h1>

        <div className="prose prose-sm max-w-none text-[#57585A] leading-relaxed space-y-4">
          <p className="font-semibold text-lg">{blog.short_description || blog.shortDescription}</p>
          <div className="w-full h-px bg-[#E2E8F0] my-4" />
          <div className="text-sm text-[#57585A] leading-relaxed">
            {blog.content ? renderMarkdown(blog.content) : t("blogs.loadingContent", { defaultValue: "Full article text is loading..." })}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <p className="text-xs text-[#57585A] mb-3">{t("blogs.aboutAuthor", { defaultValue: "About the Author" })}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div>
              <p className="text-[#1A1A1A] text-sm" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                {t("blogs.authorTeam", { defaultValue: "Tractor Seva Agri Team" })}
              </p>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                {t("blogs.authorRole", { defaultValue: "Agriculture Expert" })}
              </span>
            </div>
          </div>
        </div>

        {relatedBlogs.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl text-[#1A1A1A] mb-5" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
              {t("blogs.relatedArticles", { defaultValue: "Related Articles" })}
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedBlogs.map((b) => (
                <BlogCard key={b.id} {...b} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
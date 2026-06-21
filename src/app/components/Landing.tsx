import { useState, useEffect, Suspense, memo, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { motion, useInView } from "motion/react";
import {
  Search,
  MapPin,
  Users,
  Tractor,
  MessageSquare,
  BarChart3,
  Filter,
  CheckCircle,
  ArrowRight,
  Star,
  Wheat,
  Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import CountUp from "@/components/ui/CountUp";
import {
  Navbar,
  OperatorCard,
  HarvesterCard,
  BlogCard,
  TractorIllustration,
  WheatWatermark,
  SkeletonCard,
  AuthChooserDialog,
} from "./shared";
import tractorSevaLogo from "@/assets/tractor-seva-logo.png";
import { Canvas } from "@react-three/fiber";
import { TractorModel } from "@/components/ui/Tractor3D";
import { CinematicFooter } from "@/components/motion-footer";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  SearchHeader,
  TractorHeader,
  ChatHeader,
  TrackingHeader,
  BoardHeader,
  LocationHeader,
  GlobeHeader,
} from "@/components/ui/bento-headers";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import districtsData from "./districts.json";

const INDIAN_STATES = districtsData.states.map((s: any) => s.state);

function generateDeterministicChartBars(id: number, type: string) {
  const bars = [];
  const labels = ["W1", "W2", "W3", "W4"];
  let seed = id;
  for (let i = 0; i < 4; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const value = 2 + (seed % 13);
    bars.push({
      label: labels[i],
      value: value
    });
  }
  return bars;
}

function DirectorySkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col md:flex-row gap-6 animate-pulse">
      <div className="w-full md:w-[40%] shrink-0">
        <div className="w-full aspect-[4/3] md:aspect-auto md:h-full min-h-[220px] bg-slate-100 rounded-2xl" />
      </div>
      <div className="w-full md:w-[60%] flex flex-col justify-between space-y-4">
        <div className="space-y-4 flex-1">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-100 rounded-lg w-3/4" />
              <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
            </div>
            <div className="h-5 bg-slate-100 rounded-full w-20" />
          </div>
          <div className="h-12 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 my-3">
            <div className="h-full bg-slate-200 rounded w-1/3" />
            <div className="h-full bg-slate-200 rounded w-1/3" />
            <div className="h-full bg-slate-200 rounded w-1/3" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100" />
            <div className="h-3 bg-slate-100 rounded w-16" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

function BlogCard3D({
  id,
  title,
  category,
  shortDescription,
  date,
  image_url,
}: {
  id: string | number;
  title: string;
  category: string;
  shortDescription: string;
  date: string;
  image_url?: string;
}) {
  const { t } = useTranslation(["pages"]);

  const fallbackImages = [
    "/login-bg.png"
  ];
  const imgIndex = typeof id === 'number' ? id % fallbackImages.length : String(id).length % fallbackImages.length;
  const finalImageUrl = image_url || fallbackImages[imgIndex];

  return (
    <CardContainer className="inter-var w-full h-full py-0" containerClassName="w-full h-full py-0">
      <CardBody className="bg-white relative group/card border-[#E2E8F0] w-full h-full rounded-2xl border flex flex-col hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] shadow-[0_2px_16px_rgba(232,114,12,0.08)] transition-all duration-300">
        <Link to={`/blogs/${id}`} className="block h-full flex flex-col w-full">
          <CardItem translateZ="50" className="w-full h-48 overflow-hidden rounded-t-2xl shrink-0 bg-gray-200">
            <img
              src={finalImageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = "/login-bg.png";
                if (target.src !== window.location.origin + fallback) {
                  target.src = fallback;
                }
              }}
            />
          </CardItem>
          <div className="p-5 flex-1 flex flex-col w-full">
            <CardItem translateZ="40" className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full">
                {category}
              </span>
              <span className="text-xs text-[#57585A]">{date}</span>
            </CardItem>
            <CardItem
              translateZ="60"
              className="text-[#1A1A1A] text-base mb-2 line-clamp-2"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
            >
              {title}
            </CardItem>
            <CardItem
              as="p"
              translateZ="50"
              className="text-[#57585A] text-sm line-clamp-2 mb-4 flex-1 w-full"
            >
              {shortDescription}
            </CardItem>
            <CardItem
              translateZ="30"
              className="text-[#172263] text-sm font-medium group-hover/card:underline mt-auto"
            >
              {t("blogs.readMore", { ns: "pages" })} →
            </CardItem>
          </div>
        </Link>
      </CardBody>
    </CardContainer>
  );
}

const Tractor3DCanvas = memo(function Tractor3DCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 53 }}>
      <Suspense fallback={null}>
        <TractorModel />
      </Suspense>
    </Canvas>
  );
});

export function Landing() {
  const { t } = useTranslation(["pages", "common", "dashboard"]);
  const [operators, setOperators] = useState<any[]>([]);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [chooserOpen, setChooserOpen] = useState(false);
  const [chooserMode, setChooserMode] = useState<"login" | "register">("login");

  const navigate = useNavigate();

  const hero3DRef = useRef<HTMLDivElement>(null);
  const isHero3DInView = useInView(hero3DRef, { once: false, margin: "-50px" });

  // Directory state
  const [dirSearch, setDirSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dirCategory, setDirCategory] = useState<"all" | "harvester" | "operator">("all");
  const [dirState, setDirState] = useState("");
  const [dirDistrict, setDirDistrict] = useState("");
  const [dirSortBy, setDirSortBy] = useState<"nameAsc" | "nameDesc" | "dateNewest" | "ratingHighest">("dateNewest");
  const [directoryItems, setDirectoryItems] = useState<any[]>([]);
  const [dirLoading, setDirLoading] = useState(true);
  const [dirLimit, setDirLimit] = useState(8);

  // Sync debounced search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDirSearch(searchTerm);
      setDirLimit(8);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync searchTerm when dirSearch changes externally
  useEffect(() => {
    if (dirSearch !== searchTerm) {
      setSearchTerm(dirSearch);
    }
  }, [dirSearch]);

  const handleBookingClick = (ownerId: number | string) => {
    const token = localStorage.getItem("tractorsewa_token");
    if (!token) {
      setChooserMode("login");
      setChooserOpen(true);
    } else {
      navigate(`/messages?userId=${ownerId}`);
    }
  };

  useEffect(() => {
    const fetchDirectory = async () => {
      setDirLoading(true);
      try {
        let fetchedHarvesters: any[] = [];
        let fetchedOperators: any[] = [];

        // Build query params
        const params = new URLSearchParams();
        if (dirSearch) params.append("search", dirSearch);
        if (dirState) params.append("state", dirState);
        if (dirDistrict) params.append("location", dirDistrict);
        params.append("limit", String(dirLimit));

        const token = localStorage.getItem("tractorsewa_token");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const promises: Promise<any>[] = [];

        if (dirCategory === "all" || dirCategory === "harvester") {
          promises.push(
            fetch(`/api/harvesters?${params.toString()}`, { headers })
              .then((res) => (res.ok ? res.json() : []))
              .then((data) => {
                fetchedHarvesters = data.map((item: any) => ({
                  ...item,
                  id: item.id,
                  name: item.machineName,
                  subtitle: item.ownerName,
                  image: item.imagePath,
                  ownerImage: item.ownerProfilePic,
                  type: "harvester",
                  ownerId: item.userId,
                }));
              })
              .catch(() => {})
          );
        }

        if (dirCategory === "all" || dirCategory === "operator") {
          promises.push(
            fetch(`/api/operators?${params.toString()}`, { headers })
              .then((res) => (res.ok ? res.json() : []))
              .then((data) => {
                fetchedOperators = data.map((item: any) => ({
                  ...item,
                  id: item.id,
                  name: item.name,
                  subtitle: item.name,
                  image: item.image_path,
                  ownerImage: item.image_path,
                  type: "operator",
                  ownerId: item.user_id,
                }));
              })
              .catch(() => {})
          );
        }

        await Promise.all(promises);

        // Merge items
        let merged = [...fetchedHarvesters, ...fetchedOperators];

        // Apply sorting
        merged.sort((a, b) => {
          if (dirSortBy === "nameAsc") {
            return a.name.localeCompare(b.name);
          } else if (dirSortBy === "nameDesc") {
            return b.name.localeCompare(a.name);
          } else if (dirSortBy === "ratingHighest") {
            return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
          } else {
            // dateNewest (sort by id DESC)
            return b.id - a.id;
          }
        });

        setDirectoryItems(merged);
      } catch (err) {
        console.error("Error loading directory items:", err);
      } finally {
        setDirLoading(false);
      }
    };

    fetchDirectory();
  }, [dirSearch, dirCategory, dirState, dirDistrict, dirSortBy, dirLimit]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const opsRes = await fetch('/api/operators?limit=4');
        if (opsRes.ok) {
          const opsData = await opsRes.json();
          setOperators(opsData);
        }

        const harvsRes = await fetch('/api/harvesters?limit=4');
        if (harvsRes.ok) {
          const harvsData = await harvsRes.json();
          setHarvesters(harvsData);
        }

        const blogsRes = await fetch('/api/blogs?limit=3');
        if (blogsRes.ok) {
          const blogsData = await blogsRes.json();
          setBlogs(blogsData);
        }
      } catch {
        /* network error – server likely unreachable */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
  }, []);


  const [activePersona, setActivePersona] = useState<'farmer' | 'operator'>('farmer');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = [
    { num: "01", icon: <Users size={24} />, title: t("landing.steps.step1.title"), desc: t("landing.steps.step1.desc") },
    { num: "02", icon: <Star size={24} />, title: t("landing.steps.step2.title"), desc: t("landing.steps.step2.desc") },
    { num: "03", icon: <Search size={24} />, title: t("landing.steps.step3.title"), desc: t("landing.steps.step3.desc") },
    { num: "04", icon: <Wheat size={24} />, title: t("landing.steps.step4.title"), desc: t("landing.steps.step4.desc") },
  ];

  const personaSteps = {
    farmer: [
      {
        num: "01", icon: <Users size={22} />, title: t("landing.persona.farmer.s1.title"),
        desc: t("landing.persona.farmer.s1.desc"),
        detail: t("landing.persona.farmer.s1.detail"),
        color: "from-blue-600 to-blue-800",
      },
      {
        num: "02", icon: <MapPin size={22} />, title: t("landing.persona.farmer.s2.title"),
        desc: t("landing.persona.farmer.s2.desc"),
        detail: t("landing.persona.farmer.s2.detail"),
        color: "from-amber-500 to-orange-600",
      },
      {
        num: "03", icon: <Search size={22} />, title: t("landing.persona.farmer.s3.title"),
        desc: t("landing.persona.farmer.s3.desc"),
        detail: t("landing.persona.farmer.s3.detail"),
        color: "from-green-500 to-green-700",
      },
      {
        num: "04", icon: <Wheat size={22} />, title: t("landing.persona.farmer.s4.title"),
        desc: t("landing.persona.farmer.s4.desc"),
        detail: t("landing.persona.farmer.s4.detail"),
        color: "from-[#172263] to-[#0f174d]",
      },
    ],
    operator: [
      {
        num: "01", icon: <Users size={22} />, title: t("landing.persona.operator.s1.title"),
        desc: t("landing.persona.operator.s1.desc"),
        detail: t("landing.persona.operator.s1.detail"),
        color: "from-blue-600 to-blue-800",
      },
      {
        num: "02", icon: <Star size={22} />, title: t("landing.persona.operator.s2.title"),
        desc: t("landing.persona.operator.s2.desc"),
        detail: t("landing.persona.operator.s2.detail"),
        color: "from-amber-500 to-orange-600",
      },
      {
        num: "03", icon: <BarChart3 size={22} />, title: t("landing.persona.operator.s3.title"),
        desc: t("landing.persona.operator.s3.desc"),
        detail: t("landing.persona.operator.s3.detail"),
        color: "from-green-500 to-green-700",
      },
      {
        num: "04", icon: <Wheat size={22} />, title: t("landing.persona.operator.s4.title"),
        desc: t("landing.persona.operator.s4.desc"),
        detail: t("landing.persona.operator.s4.detail"),
        color: "from-[#172263] to-[#0f174d]",
      },
    ],
  };

  const features = [
    { icon: <Search size={22} />, title: t("landing.featureList.f1.title"), desc: t("landing.featureList.f1.desc"), headerComponent: <SearchHeader /> },
    { icon: <Tractor size={22} />, title: t("landing.featureList.f2.title"), desc: t("landing.featureList.f2.desc"), headerComponent: <TractorHeader /> },
    { icon: <MessageSquare size={22} />, title: t("landing.featureList.f3.title"), desc: t("landing.featureList.f3.desc"), headerComponent: <ChatHeader /> },
    { icon: <CheckCircle size={22} />, title: t("landing.featureList.f4.title"), desc: t("landing.featureList.f4.desc"), headerComponent: <TrackingHeader /> },
    { icon: <Filter size={22} />, title: t("landing.featureList.f5.title"), desc: t("landing.featureList.f5.desc"), headerComponent: <BoardHeader /> },
    { icon: <MapPin size={22} />, title: t("landing.featureList.f6.title"), desc: t("landing.featureList.f6.desc"), headerComponent: <LocationHeader /> },
    { icon: <Globe size={22} />, title: t("landing.featureList.f7.title"), desc: t("landing.featureList.f7.desc"), headerComponent: <GlobeHeader /> },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <main className="relative z-10 bg-[#ffffff] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-b-3xl">
        <Navbar variant="public" />

        {/* ---- HERO & STATS WRAPPER ---- */}
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          {/* ---- HERO ---- */}
          <section className="relative flex-1 overflow-hidden bg-gradient-to-br from-[#ffffff] via-[#F4F6FA] to-[#F4F6FA] pt-4 pb-12 md:pt-6 md:pb-16 flex items-center">
            <div ref={hero3DRef} className="absolute inset-y-0 right-0 w-full md:w-1/2 z-0 opacity-80">
              {isHero3DInView ? <Tractor3DCanvas /> : <div className="w-full h-full bg-transparent" />}
            </div>

            <WheatWatermark className="right-10 top-10 z-0" />
            <WheatWatermark className="left-5 bottom-10 z-0" />

            <div className="relative z-10 w-full mx-auto px-4 sm:px-6 grid md:grid-cols-5 gap-12 items-center pointer-events-none -mt-10">
              {/* Left */}
              <motion.div
                className="md:col-span-3 pointer-events-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-sm mb-6">
                  {t("landing.agriNetworkBadge", { ns: "pages", defaultValue: "India's Leading Agri-Harvesting Network" })}
                </span>
                <h1
                  className="text-5xl md:text-6xl leading-[1.1] mb-6"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800 }}
                >
                  {t("landing.title", { ns: "pages" })}
                </h1>
                <p className="text-[#57585A] text-lg max-w-xl leading-relaxed mb-8">
                  {t("landing.subtitle", { ns: "pages" })}
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  {localStorage.getItem("tractorsewa_token") ? (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-6 py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-all duration-200 shadow-[0_4px_14px_rgba(232,114,12,0.3)] cursor-pointer"
                    >
                      {t("landing.goToDashboard", { ns: "pages", defaultValue: "Go to Dashboard" })} <ArrowRight size={18} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/enquiry"
                        className="flex items-center gap-2 px-6 py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-all duration-200 shadow-[0_4px_14px_rgba(232,114,12,0.3)] cursor-pointer"
                      >
                        {t("landing.submitEnquiry", { ns: "pages", defaultValue: "Submit Enquiry" })} <ArrowRight size={18} />
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => {
                          localStorage.setItem("tractorsewa_preview_mode", "true");
                        }}
                        className="flex items-center gap-2 px-6 py-3 border-2 border-[#172263] text-[#172263] rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        {t("landing.exploreDashboard", { ns: "pages" })}
                      </Link>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-[#57585A]">
                  {[
                    t("landing.freeToJoin", { ns: "pages", defaultValue: "Free to Join" }),
                    t("landing.verifiedProfiles", { ns: "pages", defaultValue: "Verified Profiles" }),
                    t("landing.cities", { ns: "pages", defaultValue: "50+ Cities" })
                  ].map((badge) => (
                    <span key={badge} className="flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-green-600" /> {badge}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Right Floating Stats (Over the 3D Tractor) */}
              <div className="md:col-span-2 relative h-[400px] w-full pointer-events-none hidden md:block">
                {/* Top Right Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute top-10 right-0 bg-white/70 backdrop-blur-md shadow-xl rounded-2xl px-5 py-3 border border-white/40 flex items-center gap-3"
                >
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">{t("landing.activeOperators", { ns: "pages", defaultValue: "500+ Operators" })}</p>
                    <p className="text-[#57585A] text-xs">{t("landing.onlineNow", { ns: "pages", defaultValue: "Online Now" })}</p>
                  </div>
                </motion.div>

                {/* Bottom Left Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="absolute bottom-20 -left-32 bg-white/70 backdrop-blur-md shadow-xl rounded-2xl px-5 py-3 border border-white/40 flex items-center gap-3"
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Star size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">{t("landing.topRated", { ns: "pages", defaultValue: "Top Rated" })}</p>
                    <p className="text-[#57585A] text-xs">{t("landing.verifiedProfiles", { ns: "pages", defaultValue: "Verified Profiles" })}</p>
                  </div>
                </motion.div>

                {/* Bottom Right Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="absolute bottom-5 right-10 bg-white/70 backdrop-blur-md shadow-xl rounded-2xl px-5 py-3 border border-white/40 flex items-center gap-3"
                >
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Wheat size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">{t("landing.multipleCrops", { ns: "pages", defaultValue: "Multiple Crops" })}</p>
                    <p className="text-[#57585A] text-xs">{t("landing.wheatRice", { ns: "pages", defaultValue: "Wheat, Rice & more" })}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ---- STATS BAR ---- */}
          <section className="bg-[#172263] py-3 shrink-0">
            <div className="w-full mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { num: 500, label: t("landing.stats.operatorsRegistered", { ns: "pages", defaultValue: "Operators Registered" }) },
                { num: 200, label: t("landing.stats.harvestersListed", { ns: "pages", defaultValue: "Harvesters Listed" }) },
                { num: 50, label: t("landing.stats.citiesCovered", { ns: "pages", defaultValue: "Cities Covered" }) },
                { num: 1000, label: t("landing.stats.connectionsMade", { ns: "pages", defaultValue: "Connections Made" }) },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.5 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-white text-4xl mb-1 flex items-center justify-center gap-0" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
                    <CountUp from={0} to={s.num} duration={2} />+
                  </div>
                  <p className="text-blue-100 text-sm uppercase tracking-widest">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* ---- BROWSE DIRECTORY SECTION ---- */}
        <section id="directory" className="py-20 bg-gradient-to-b from-slate-50 to-white border-t border-b border-slate-100">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
            
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2
                className="text-4xl text-[#1A1A1A] mb-4"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                {t("landing.directory.title", { ns: "pages" })}
              </h2>
              <p className="text-[#57585A] max-w-xl mx-auto text-base">
                {t("landing.directory.subtitle", { ns: "pages" })}
              </p>
            </div>

            {/* Filters Controls Panel */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Search input */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("landing.directory.searchPlaceholder", { ns: "pages" })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:border-[#172263] focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Category Type filter */}
                <select
                  value={dirCategory}
                  onChange={(e: any) => {
                    setDirCategory(e.target.value);
                    setDirLimit(8);
                  }}
                  className="px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:border-[#172263] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">{t("landing.directory.typeAll", { ns: "pages" })}</option>
                  <option value="harvester">{t("landing.directory.typeHarvester", { ns: "pages" })}</option>
                  <option value="operator">{t("landing.directory.typeOperator", { ns: "pages" })}</option>
                </select>

                {/* State selector */}
                <select
                  value={dirState}
                  onChange={(e) => {
                    setDirState(e.target.value);
                    setDirDistrict("");
                    setDirLimit(8);
                  }}
                  className="px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:border-[#172263] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">{t("landing.directory.filterState", { ns: "pages" })}</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {t("states." + state, { ns: "static", defaultValue: state })}
                    </option>
                  ))}
                </select>

                {/* District selector */}
                <select
                  value={dirDistrict}
                  onChange={(e) => {
                    setDirDistrict(e.target.value);
                    setDirLimit(8);
                  }}
                  disabled={!dirState}
                  className="px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:border-[#172263] focus:bg-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="">{t("landing.directory.filterDistrict", { ns: "pages" })}</option>
                  {dirState &&
                    districtsData.states
                      .find((s) => s.state === dirState)
                      ?.districts.map((d) => (
                        <option key={d} value={d}>
                          {t("districts." + d, { ns: "static", defaultValue: d })}
                        </option>
                      ))}
                </select>

                {/* Sort dropdown */}
                <select
                  value={dirSortBy}
                  onChange={(e: any) => {
                    setDirSortBy(e.target.value);
                    setDirLimit(8);
                  }}
                  className="px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm text-slate-700 focus:outline-none focus:border-[#172263] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="dateNewest">{t("landing.directory.sortDateNewest", { ns: "pages" })}</option>
                  <option value="ratingHighest">{t("landing.directory.sortRatingHighest", { ns: "pages" })}</option>
                  <option value="nameAsc">{t("landing.directory.sortNameAsc", { ns: "pages" })}</option>
                  <option value="nameDesc">{t("landing.directory.sortNameDesc", { ns: "pages" })}</option>
                </select>

              </div>
              
              {/* Active Filter Badges & Clear button */}
              {(dirSearch || dirCategory !== "all" || dirState || dirDistrict) && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 items-center">
                  <span className="text-xs text-slate-400 font-medium mr-1">Active filters:</span>
                  {dirSearch && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      "{dirSearch}"
                      <button onClick={() => setDirSearch("")} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  {dirCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {dirCategory === "harvester" ? t("landing.directory.typeHarvester", { ns: "pages" }) : t("landing.directory.typeOperator", { ns: "pages" })}
                      <button onClick={() => setDirCategory("all")} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  {dirState && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {t("states." + dirState, { ns: "static", defaultValue: dirState })}
                      <button onClick={() => { setDirState(""); setDirDistrict(""); }} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  {dirDistrict && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {t("districts." + dirDistrict, { ns: "static", defaultValue: dirDistrict })}
                      <button onClick={() => setDirDistrict("")} className="hover:text-red-500 font-bold ml-0.5">×</button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setDirSearch("");
                      setDirCategory("all");
                      setDirState("");
                      setDirDistrict("");
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold ml-auto hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Results Grid */}
            {dirLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {Array(6).fill(0).map((_, i) => (
                  <DirectorySkeletonCard key={i} />
                ))}
              </div>
            ) : directoryItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-slate-100 max-w-2xl mx-auto px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={24} />
                </div>
                <h3 className="text-slate-800 text-lg font-bold font-sora mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {t("landing.directory.noResults", { ns: "pages" })}
                </h3>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                  {directoryItems.slice(0, dirLimit).map((item) => (
                    <div 
                      key={`${item.type}-${item.id}`} 
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(23,34,99,0.08)] transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
                    >
                      {/* Card Body */}
                      <div className="p-6 flex flex-col md:flex-row gap-6 flex-1">
                        
                        {/* Left Column: Image */}
                        <div className="w-full md:w-[40%] flex flex-col">
                          <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-full min-h-[220px] rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.src = "";
                                  e.currentTarget.className = "hidden";
                                }}
                              />
                            ) : null}
                            {!item.image && (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                {item.type === "harvester" ? (
                                  <Tractor className="w-12 h-12 text-[#172263]/20" />
                                ) : (
                                  <Users className="w-12 h-12 text-[#15803D]/20" />
                                )}
                              </div>
                            )}
                            
                            {/* Type Badge */}
                            <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm tracking-wide ${
                              item.type === "harvester" 
                                ? "bg-blue-100/95 text-blue-800 border border-blue-200/50" 
                                : "bg-green-100/95 text-green-800 border border-green-200/50"
                            }`}>
                              {item.type === "harvester" ? t("landing.directory.harvester", { ns: "pages" }) : t("landing.directory.operator", { ns: "pages" })}
                            </span>
                          </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="w-full md:w-[60%] flex flex-col justify-between pl-0 md:pl-2">
                          <div>
                            {/* Title & Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 
                                  className="text-lg text-slate-800 font-bold font-sora line-clamp-1 group-hover:text-[#172263] transition-colors"
                                  style={{ fontFamily: "'Sora', sans-serif" }}
                                >
                                  {item.name}
                                </h3>
                                <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                                  <MapPin size={13} className="text-amber-500 shrink-0" />
                                  <span className="line-clamp-1">{item.location}, {item.state}</span>
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            {item.description && (
                              <p className="text-slate-500 text-xs line-clamp-2 mt-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Technical Details Grid */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 py-3.5 border-y border-slate-100/80 my-3">
                              {item.type === "harvester" ? (
                                <>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                      {t("landing.directory.company", { ns: "pages" })}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700">{item.company}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                      {t("landing.directory.model", { ns: "pages" })}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700">{item.model}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                      {t("landing.directory.year", { ns: "pages" })}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700">{item.year || "N/A"}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                      {t("landing.directory.experience", { ns: "pages" })}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700">
                                      {t("exploreOperators.experienceYears", { ns: "pages", count: parseInt(item.experience) || item.experience })}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                      {t("landing.directory.availability", { ns: "pages" })}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                                      item.availability === "Available"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}>
                                      {item.availability || "Available"}
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                      {t("landing.directory.expertise", { ns: "pages" })}
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {Array.isArray(item.machineExpertise) && item.machineExpertise.length > 0 ? (
                                        item.machineExpertise.map((exp: string, idx: number) => (
                                          <span key={idx} className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200/60">
                                            {exp}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs text-slate-500">General Operator</span>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                          </div>

                          {/* Bottom info: Owner & rating */}
                          <div className="flex items-center justify-between gap-4 pt-1 mt-auto">
                            {/* Owner info */}
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden shrink-0 border border-slate-200">
                                {item.ownerImage ? (
                                  <img src={item.ownerImage} alt={item.subtitle} className="w-full h-full object-cover" />
                                ) : (
                                  item.subtitle?.charAt(0)
                                )}
                              </span>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                                  {item.type === "harvester" ? t("landing.directory.owner", { ns: "pages" }) : t("landing.directory.operator", { ns: "pages" })}
                                </span>
                                <span className="text-xs font-semibold text-slate-700 line-clamp-1 mt-0.5">{item.subtitle}</span>
                              </div>
                            </div>

                            {/* Rating info */}
                            <div className="flex flex-col items-end shrink-0">
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star size={13} fill="currentColor" className="stroke-amber-500" />
                                <span className="text-xs font-bold text-slate-800">{item.avgRating || "0.0"}</span>
                                <span className="text-[10px] text-slate-400">({item.ratingCount || 0})</span>
                              </div>
                              <div className="flex gap-0.5 mt-0.5">
                                {Array(5).fill(0).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={9}
                                    fill={i < Math.round(parseFloat(item.avgRating || "0")) ? "currentColor" : "none"}
                                    className="stroke-amber-500"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* Footer Button */}
                      <button 
                        onClick={() => handleBookingClick(item.ownerId)}
                        className={`w-full py-3.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-t border-slate-100 ${
                          item.type === "harvester"
                            ? "bg-[#172263] hover:bg-[#11194A] text-white"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        }`}
                      >
                        <MessageSquare size={16} />
                        {item.type === "harvester" ? t("landing.directory.bookNow", { ns: "pages" }) : t("landing.directory.hireNow", { ns: "pages" })}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Explore More Button */}
                {directoryItems.length >= dirLimit && (
                  <div className="text-center mt-12">
                    <button
                      onClick={() => setDirLimit((prev) => prev + 8)}
                      className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:border-[#172263] hover:text-[#172263] transition-all shadow-sm hover:shadow cursor-pointer animate-fade-in"
                    >
                      {t("landing.directory.exploreMore", { ns: "pages" })}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </section>

        {/* ---- FEATURES ---- */}
        <section id="features" className="py-20 bg-gradient-to-br from-[#F4F6FA] to-[#F4F6FA]">
          <div className="w-full mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2
                className="text-4xl text-[#1A1A1A] mb-3"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                {t("landing.features", { ns: "pages" })}
              </h2>
              <p className="text-[#57585A] max-w-xl mx-auto">
                {t("landing.featuresSub", { ns: "pages", defaultValue: "Built for the realities of Indian agricultural workflow — field-tested, farmer-approved." })}
              </p>
            </div>
            <BentoGrid className="max-w-6xl mx-auto">
              {features.map((f, i) => (
                <BentoGridItem
                  key={i}
                  title={
                    <span className="text-[#1A1A1A] text-lg mb-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                      {f.title}
                    </span>
                  }
                  description={<span className="text-[#57585A] text-sm leading-relaxed">{f.desc}</span>}
                  header={f.headerComponent}
                  icon={<div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#172263]">{f.icon}</div>}
                  className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                />
              ))}
            </BentoGrid>
          </div>
        </section>

        {/* ---- HOW IT WORKS ---- */}
        <section id="how-it-works" className="py-20 w-full mx-auto px-4 sm:px-6 min-h-[calc(100vh-64px)] flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-4xl text-[#1A1A1A] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
              {t("landing.howItWorks", { ns: "pages", defaultValue: "How It Works" })}
            </h2>
            <p className="text-[#57585A] max-w-xl mx-auto mb-8">
              {t("landing.howItWorksSub", { ns: "pages", defaultValue: "A tailored journey for every person on the platform. Choose your role below." })}
            </p>

            {/* Persona Toggle */}
            <div className="inline-flex items-center bg-[#F4F6FA] border border-[#E2E8F0] rounded-2xl p-1.5 gap-1">
              {([
                ['farmer', t("landing.persona.farmerTab", { ns: "pages", defaultValue: "🌾 I am a Farmer" })],
                ['operator', t("landing.persona.operatorTab", { ns: "pages", defaultValue: "🚜 I am an Operator" })]
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setActivePersona(key); setExpandedStep(null); }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activePersona === key
                      ? 'bg-[#172263] text-white shadow-md scale-[1.02]'
                      : 'text-[#57585A] hover:text-[#172263] hover:bg-white'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps Grid */}
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-4 gap-5 relative"
          >
            {personaSteps[activePersona].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative z-10 group h-full"
              >
                <div className="w-full h-full flex flex-col text-left rounded-2xl border border-[#E2E8F0] bg-white group-hover:border-[#172263]/50 group-hover:shadow-[0_8px_32px_rgba(23,34,99,0.13)] transition-all duration-300 overflow-hidden">
                  {/* Always-visible top content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-center mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 shrink-0`}>
                        <span className="text-white/70 text-[10px] font-bold mb-0.5">{step.num}</span>
                        <span className="text-white">{step.icon}</span>
                      </div>
                    </div>
                    <h3 className="text-[#1A1A1A] text-base text-center mb-1.5 group-hover:text-[#172263] transition-colors duration-300 shrink-0" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>
                      {step.title}
                    </h3>
                    <p className="text-[#57585A] text-sm leading-relaxed text-center flex-1">{step.desc}</p>

                    {/* Hover hint */}
                    <div className="flex items-center justify-center gap-1 mt-auto pt-3 text-xs font-semibold text-zinc-300 group-hover:opacity-0 transition-opacity duration-200 shrink-0">
                      {t("landing.hoverToLearnMore", { ns: "pages", defaultValue: "Hover to learn more ↓" })}
                    </div>
                  </div>

                  {/* Hover-reveal detail panel */}
                  <div className="max-h-0 group-hover:max-h-48 overflow-hidden transition-all duration-500 ease-in-out shrink-0">
                    <div className={`bg-gradient-to-br ${step.color} mx-3 mb-3 rounded-xl p-4`}>
                      <p className="text-white text-sm leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA below steps */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-zinc-500 mb-4">{t("landing.readyToGetStarted", { ns: "pages", defaultValue: "Ready to get started?" })}</p>
            <button
              onClick={() => { setChooserMode("register"); setChooserOpen(true); }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#172263] text-white rounded-xl font-semibold hover:bg-[#11194A] transition-all shadow-[0_4px_14px_rgba(23,34,99,0.3)] hover:shadow-[0_6px_20px_rgba(23,34,99,0.4)] hover:-translate-y-0.5"
            >
              {t("landing.joinFree", { ns: "pages", defaultValue: "Join Free — It Takes 2 Minutes" })} <ArrowRight size={16} />
            </button>
          </motion.div>
        </section>




        {/* ---- BLOGS ---- */}
        <section className="py-20 w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-3xl text-[#1A1A1A]"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              {t("blogs.title", { ns: "pages" })}
            </h2>
            <Link to="/blogs" className="text-[#172263] text-sm font-medium hover:underline flex items-center gap-1">
              {t("buttons.viewAll", { ns: "common", defaultValue: "View All" })} <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : blogs.slice(0, 3).map((b) => <BlogCard3D key={b.id} {...b} />)}
          </div>
          {blogs.length >= 3 && (
            <div className="text-center mt-10">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:border-[#172263] hover:text-[#172263] transition-all shadow-sm hover:shadow cursor-pointer"
              >
                {t("landing.directory.exploreMore", { ns: "pages", defaultValue: "Explore More" })}
              </Link>
            </div>
          )}
        </section>


      </main>

      {/* ---- FOOTER ---- */}
      <div id="contact">
        <CinematicFooter />
      </div>

      {/* Auth Chooser Dialog */}
      <AuthChooserDialog
        isOpen={chooserOpen}
        onClose={() => setChooserOpen(false)}
        initialMode={chooserMode}
      />
    </div>
  );
}

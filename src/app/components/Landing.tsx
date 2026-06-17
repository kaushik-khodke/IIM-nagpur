import { useState, useEffect, Suspense } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
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
            {/* 3D Tractor Background */}
            <div className="absolute inset-y-0 right-0 w-full md:w-1/2 z-0 opacity-80">
              <Canvas camera={{ position: [0, 0, 5], fov: 53 }}>
                <Suspense fallback={null}>
                  <TractorModel />
                </Suspense>
              </Canvas>
            </div>

            <WheatWatermark className="right-10 top-10 z-0" />
            <WheatWatermark className="left-5 bottom-10 z-0" />

            <div className="relative z-10 w-full mx-auto px-4 sm:px-6 grid md:grid-cols-5 gap-12 items-center">
              {/* Left */}
              <motion.div
                className="md:col-span-3"
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
              : blogs.map((b) => <BlogCard3D key={b.id} {...b} />)}
          </div>
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

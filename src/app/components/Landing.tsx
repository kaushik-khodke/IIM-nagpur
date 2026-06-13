import { useState, useEffect } from "react";
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
      } catch (err) {
        console.error("Error fetching landing page data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const steps = [
    { num: "01", icon: <Users size={24} />, title: "Register", desc: "Create your free account as farmer, operator, or both." },
    { num: "02", icon: <Star size={24} />, title: "Create Profile", desc: "Add your machine expertise, location, and availability." },
    { num: "03", icon: <Search size={24} />, title: "Find Match", desc: "Search and filter operators or harvesters near you." },
    { num: "04", icon: <Wheat size={24} />, title: "Connect & Harvest", desc: "Message directly, agree on terms, and get to work!" },
  ];

  const features = [
    { icon: <Search size={22} />, title: "Operator Search", desc: "Find verified operators by location, experience & machine type.", headerComponent: <SearchHeader /> },
    { icon: <Tractor size={22} />, title: "Harvester Directory", desc: "Browse machines from all major brands across India.", headerComponent: <TractorHeader /> },
    { icon: <MessageSquare size={22} />, title: "Direct Messaging", desc: "Connect directly without middlemen or brokers.", headerComponent: <ChatHeader /> },
    { icon: <CheckCircle size={22} />, title: "Availability Tracking", desc: "Real-time availability status for every operator.", headerComponent: <TrackingHeader /> },
    { icon: <Filter size={22} />, title: "Requirements Board", desc: "Post your seasonal requirements and get applications.", headerComponent: <BoardHeader /> },
    { icon: <MapPin size={22} />, title: "Location Filters", desc: "Pinpoint operators in your district, state or region.", headerComponent: <LocationHeader /> },
    { icon: <Globe size={22} />, title: "Multilingual Support", desc: "Access the platform in Hindi, Punjabi, Marathi, and other regional languages.", headerComponent: <GlobeHeader /> },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <main className="relative z-10 bg-[#ffffff] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-b-3xl">
        <Navbar variant="public" />

      {/* ---- HERO ---- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#ffffff] via-[#F4F6FA] to-[#F4F6FA] py-20 md:py-28 min-h-[calc(100vh-64px)] flex items-center">
        <WheatWatermark className="right-10 top-10" />
        <WheatWatermark className="left-5 bottom-10" />

        <div className="relative z-10 w-full mx-auto px-4 sm:px-6 grid md:grid-cols-5 gap-12 items-center">
          {/* Left */}
          <motion.div
            className="md:col-span-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-sm mb-6">
              🌾 India's Leading Agri-Harvesting Network
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
              <button
                onClick={() => {
                  setChooserMode("register");
                  setChooserOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[#172263] text-white rounded-xl hover:bg-[#11194A] transition-all duration-200 shadow-[0_4px_14px_rgba(232,114,12,0.3)] cursor-pointer"
              >
                {t("landing.getStarted", { ns: "pages" })} <ArrowRight size={18} />
              </button>
              <Link
                to="/harvesters"
                className="flex items-center gap-2 px-6 py-3 border-2 border-[#172263] text-[#172263] rounded-xl hover:bg-blue-50 transition-colors"
              >
                {t("landing.exploreHarvesters", { ns: "pages" })}
              </Link>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-[#57585A]">
              {["Free to Join", "Verified Profiles", "50+ Cities"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-green-600" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right card */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl border border-[#E2E8F0] p-8 shadow-[0_8px_32px_rgba(232,114,12,0.12)]">
              <div className="flex justify-center mb-4">
                <TractorIllustration size={160} />
              </div>
              <div className="absolute top-4 right-4 bg-white shadow-md rounded-xl px-3 py-2 text-xs font-medium text-[#1A1A1A] border border-[#E2E8F0]">
                🌾 Harvesting Rabi &amp; Kharif Crops
              </div>
              <div className="absolute top-16 left-0 -translate-x-4 bg-white shadow-md rounded-xl px-3 py-2 text-xs font-medium text-[#1A1A1A] border border-[#E2E8F0]">
                ✅ 500+ Operators Online
              </div>
              <div className="absolute bottom-16 right-0 translate-x-4 bg-white shadow-md rounded-xl px-3 py-2 text-xs font-medium text-[#1A1A1A] border border-[#E2E8F0]">
                🌾 Wheat · Rice · Maize · Sugarcane
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <p className="text-[#172263] text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>500+</p>
                  <p className="text-xs text-[#57585A]">Operators</p>
                </div>
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <p className="text-[#15803D] text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>200+</p>
                  <p className="text-xs text-[#57585A]">Machines</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- STATS BAR ---- */}
      <section className="bg-[#172263] py-10">
        <div className="w-full mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "500+", label: "Operators Registered" },
            { num: "200+", label: "Harvesters Listed" },
            { num: "50+", label: "Cities Covered" },
            { num: "1000+", label: "Connections Made" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-white text-4xl mb-1" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
                {s.num}
              </p>
              <p className="text-blue-100 text-sm uppercase tracking-widest">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="py-20 w-full mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2
            className="text-4xl text-[#1A1A1A] mb-3"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            How It Works
          </h2>
          <p className="text-[#57585A] max-w-xl mx-auto">
            Get started in minutes and connect with the right people for your harvest season.
          </p>
        </div>
        <div className="relative grid md:grid-cols-4 gap-8">
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-blue-200" />
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="relative text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#172263] rounded-full flex flex-col items-center justify-center relative z-10">
                  <span className="text-white text-xs mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {step.num}
                  </span>
                  <span className="text-white">{step.icon}</span>
                </div>
              </div>
              <h3
                className="text-[#1A1A1A] text-lg mb-2"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
              >
                {step.title}
              </h3>
              <p className="text-[#57585A] text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="py-20 bg-gradient-to-br from-[#F4F6FA] to-[#F4F6FA]">
        <div className="w-full mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              className="text-4xl text-[#1A1A1A] mb-3"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              {t("landing.features", { ns: "pages" })}
            </h2>
            <p className="text-[#57585A] max-w-xl mx-auto">
              Built for the realities of Indian agricultural workflow — field-tested, farmer-approved.
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

      {/* ---- OPERATORS ---- */}
      <section className="py-20 w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl text-[#1A1A1A]"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            {t("operators.title", { ns: "dashboard" })}
          </h2>
          <Link to="/operators" className="text-[#172263] text-sm font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : operators.length > 0 ? (
                operators.map((op) => <OperatorCard key={op.id} {...op} />)
              ) : (
                <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-[#E2E8F0]">
                  <p className="text-[#57585A] mb-4">No operators registered yet. Be the first to join!</p>
                  <Link
                    to="/register"
                    onClick={(e) => {
                      e.preventDefault();
                      setChooserMode("register");
                      setChooserOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#172263] text-white rounded-xl text-sm font-medium hover:bg-[#11194A] transition-colors"
                  >
                    Register as Operator
                  </Link>
                </div>
              )
          }
        </div>
      </section>

      {/* ---- HARVESTERS ---- */}
      <section className="py-20 bg-[#ffffff]">
        <div className="w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-3xl text-[#1A1A1A]"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              {t("harvesters.title", { ns: "dashboard" })}
            </h2>
            <Link to="/harvesters" className="text-[#172263] text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : harvesters.length > 0 ? (
                  harvesters.map((h) => <HarvesterCard key={h.id} {...h} />)
                ) : (
                  <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-[#E2E8F0]">
                    <p className="text-[#57585A] mb-4">No harvesters listed yet. List your machine to reach farmers!</p>
                    <Link
                      to="/register"
                      onClick={(e) => {
                        e.preventDefault();
                        setChooserMode("register");
                        setChooserOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      List Your Harvester
                    </Link>
                  </div>
                )
            }
          </div>
        </div>
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
            View All <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : blogs.map((b) => <BlogCard key={b.id} {...b} />)}
        </div>
      </section>

      {/* ---- CTA BANNER ---- */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#172263] to-[#15803D]" />
        <WheatWatermark className="left-10 top-0 opacity-[0.05]" />
        <WheatWatermark className="right-10 bottom-0 opacity-[0.05]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-white text-4xl mb-4"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Ready to grow your harvest business?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of farmers and operators across India who are already using Tractor Seva.
          </p>
          <Link
            to="/register"
            onClick={(e) => {
              e.preventDefault();
              setChooserMode("register");
              setChooserOpen(true);
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#172263] rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            {t("landing.joinNow", { ns: "pages" })} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      </main>

      {/* ---- FOOTER ---- */}
      <CinematicFooter />

      {/* Auth Chooser Dialog */}
      <AuthChooserDialog
        isOpen={chooserOpen}
        onClose={() => setChooserOpen(false)}
        initialMode={chooserMode}
      />
    </div>
  );
}

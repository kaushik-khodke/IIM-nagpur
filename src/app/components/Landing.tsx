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
} from "lucide-react";
import {
  Navbar,
  OperatorCard,
  HarvesterCard,
  BlogCard,
  TractorIllustration,
  WheatWatermark,
  SkeletonCard,
} from "./shared";
import { ThreeBackground } from "./ThreeBackground";
import tractorSevaLogo from "@/assets/tractor-seva-logo.png";

export function Landing() {
  const [operators, setOperators] = useState<any[]>([]);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    { icon: <Search size={22} />, title: "Operator Search", desc: "Find verified operators by location, experience & machine type." },
    { icon: <Tractor size={22} />, title: "Harvester Directory", desc: "Browse machines from all major brands across India." },
    { icon: <MessageSquare size={22} />, title: "Direct Messaging", desc: "Connect directly without middlemen or brokers." },
    { icon: <CheckCircle size={22} />, title: "Availability Tracking", desc: "Real-time availability status for every operator." },
    { icon: <Filter size={22} />, title: "Requirements Board", desc: "Post your seasonal requirements and get applications." },
    { icon: <MapPin size={22} />, title: "Location Filters", desc: "Pinpoint operators in your district, state or region." },
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="public" />

      {/* ---- HERO ---- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FDFAF4] via-[#FEF3E2] to-[#F0FDF4] py-20 md:py-28">
        <ThreeBackground variant="hero" />
        <WheatWatermark className="right-10 top-10" />
        <WheatWatermark className="left-5 bottom-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-5 gap-12 items-center">
          {/* Left */}
          <motion.div
            className="md:col-span-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-sm mb-6">
              🌾 India's Leading Agri-Harvesting Network
            </span>
            <h1
              className="text-5xl md:text-6xl leading-[1.1] mb-6"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800 }}
            >
              Find Skilled<br />
              <span className="text-[#E8720C]">Harvester Operators</span><br />
              Near You
            </h1>
            <p className="text-[#78716C] text-lg max-w-xl leading-relaxed mb-8">
              Connecting farmers, machine operators, and harvester owners across India. Hire verified workers, rent out machinery, and secure your seasonal crop yield on time.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-2 px-6 py-3 bg-[#E8720C] text-white rounded-xl hover:bg-[#C9610A] transition-all duration-200 shadow-[0_4px_14px_rgba(232,114,12,0.3)]"
              >
                Get Started <ArrowRight size={18} />
              </button>
              <Link
                to="/harvesters"
                className="flex items-center gap-2 px-6 py-3 border-2 border-[#E8720C] text-[#E8720C] rounded-xl hover:bg-orange-50 transition-colors"
              >
                Explore Platform
              </Link>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-[#78716C]">
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
            <div className="relative bg-gradient-to-br from-orange-50 to-green-50 rounded-3xl border border-[#E7E0D5] p-8 shadow-[0_8px_32px_rgba(232,114,12,0.12)]">
              <div className="flex justify-center mb-4">
                <TractorIllustration size={160} />
              </div>
              <div className="absolute top-4 right-4 bg-white shadow-md rounded-xl px-3 py-2 text-xs font-medium text-[#1C1008] border border-[#E7E0D5]">
                🌾 Harvesting Rabi &amp; Kharif Crops
              </div>
              <div className="absolute top-16 left-0 -translate-x-4 bg-white shadow-md rounded-xl px-3 py-2 text-xs font-medium text-[#1C1008] border border-[#E7E0D5]">
                ✅ 500+ Operators Online
              </div>
              <div className="absolute bottom-16 right-0 translate-x-4 bg-white shadow-md rounded-xl px-3 py-2 text-xs font-medium text-[#1C1008] border border-[#E7E0D5]">
                🌾 Wheat · Rice · Maize · Sugarcane
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <p className="text-[#E8720C] text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>500+</p>
                  <p className="text-xs text-[#78716C]">Operators</p>
                </div>
                <div className="bg-white/80 rounded-xl p-3 text-center">
                  <p className="text-[#15803D] text-lg" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>200+</p>
                  <p className="text-xs text-[#78716C]">Machines</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- STATS BAR ---- */}
      <section className="bg-[#E8720C] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
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
              <p className="text-orange-100 text-sm uppercase tracking-widest">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2
            className="text-4xl text-[#1C1008] mb-3"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            How It Works
          </h2>
          <p className="text-[#78716C] max-w-xl mx-auto">
            Get started in minutes and connect with the right people for your harvest season.
          </p>
        </div>
        <div className="relative grid md:grid-cols-4 gap-8">
          <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-orange-200" />
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
                <div className="w-16 h-16 bg-[#E8720C] rounded-full flex flex-col items-center justify-center relative z-10">
                  <span className="text-white text-xs mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {step.num}
                  </span>
                  <span className="text-white">{step.icon}</span>
                </div>
              </div>
              <h3
                className="text-[#1C1008] text-lg mb-2"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
              >
                {step.title}
              </h3>
              <p className="text-[#78716C] text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="py-20 bg-gradient-to-br from-[#FEF3E2] to-[#F0FDF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              className="text-4xl text-[#1C1008] mb-3"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              Everything You Need
            </h2>
            <p className="text-[#78716C] max-w-xl mx-auto">
              Built for the realities of Indian agricultural workflow — field-tested, farmer-approved.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-2xl p-6 border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.08)] hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] transition-all duration-300 hover:scale-[1.02]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-[#E8720C]">
                  {f.icon}
                </div>
                <h3
                  className="text-[#1C1008] text-lg mb-2"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
                >
                  {f.title}
                </h3>
                <p className="text-[#78716C] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- OPERATORS ---- */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl text-[#1C1008]"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Meet Skilled Operators
          </h2>
          <Link to="/operators" className="text-[#E8720C] text-sm font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : operators.length > 0 ? (
                operators.map((op) => <OperatorCard key={op.id} {...op} />)
              ) : (
                <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-[#E7E0D5]">
                  <p className="text-[#78716C] mb-4">No operators registered yet. Be the first to join!</p>
                  <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8720C] text-white rounded-xl text-sm font-medium hover:bg-[#C9610A] transition-colors">
                    Register as Operator
                  </Link>
                </div>
              )
          }
        </div>
      </section>

      {/* ---- HARVESTERS ---- */}
      <section className="py-20 bg-[#FDFAF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-3xl text-[#1C1008]"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              Available Machines
            </h2>
            <Link to="/harvesters" className="text-[#E8720C] text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : harvesters.length > 0 ? (
                  harvesters.map((h) => <HarvesterCard key={h.id} {...h} />)
                ) : (
                  <div className="col-span-full bg-white rounded-2xl p-8 text-center border border-[#E7E0D5]">
                    <p className="text-[#78716C] mb-4">No harvesters listed yet. List your machine to reach farmers!</p>
                    <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                      List Your Harvester
                    </Link>
                  </div>
                )
            }
          </div>
        </div>
      </section>

      {/* ---- BLOGS ---- */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl text-[#1C1008]"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Harvesting Knowledge
          </h2>
          <Link to="/blogs" className="text-[#E8720C] text-sm font-medium hover:underline flex items-center gap-1">
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#E8720C] to-[#15803D]" />
        <WheatWatermark className="left-10 top-0 opacity-[0.05]" />
        <WheatWatermark className="right-10 bottom-0 opacity-[0.05]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-white text-4xl mb-4"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Ready to grow your harvest business?
          </h2>
          <p className="text-orange-100 text-lg mb-8">
            Join thousands of farmers and operators across India who are already using Tractor Seva.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#E8720C] rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
          >
            Join Tractor Seva Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="bg-[#1C1008] text-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={tractorSevaLogo} alt="Tractor Seva" className="h-10 w-auto brightness-0 invert" />
            </div>
            <p className="text-orange-200 text-sm leading-relaxed">
              India's trusted platform for connecting farmers with harvester operators and machinery.
            </p>
          </div>
          {[
            { title: "Platform", links: [{ to: "/harvesters", label: "Browse Harvesters" }, { to: "/operators", label: "Find Operators" }, { to: "/blogs", label: "Knowledge Hub" }] },
            { title: "Account", links: [{ to: "/login", label: "Login" }, { to: "/register", label: "Sign Up" }, { to: "/dashboard", label: "Dashboard" }] },
            { title: "Add Listing", links: [{ to: "/add-harvester", label: "List Harvester" }, { to: "/add-operator", label: "Register Operator" }, { to: "/requests", label: "Post Requirement" }] },
          ].map((col) => (
            <div key={col.title}>
              <h4
                className="text-white text-sm mb-4 uppercase tracking-widest"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-orange-200 text-sm hover:text-[#E8720C] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-orange-900/50 py-6 text-center text-orange-300 text-sm">
          © 2025 Tractor Seva. Made for Indian Farmers 🇮🇳
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Tractor,
  Users,
  Search,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import {
  Navbar,
  OperatorCard,
  HarvesterCard,
  SkeletonCard,
  WheatWatermark,
  MOCK_OPERATORS,
  MOCK_HARVESTERS,
} from "./shared";

const ACTIVITY_FEED = [
  { icon: <CheckCircle2 size={14} className="text-green-600" />, text: "Rajesh Kumar accepted your request", time: "2 mins ago" },
  { icon: <MessageSquare size={14} className="text-blue-500" />, text: "New message from Suresh Patel", time: "15 mins ago" },
  { icon: <Tractor size={14} className="text-orange-500" />, text: "John Deere S660 listing was viewed 12 times", time: "1 hr ago" },
  { icon: <Users size={14} className="text-purple-500" />, text: "Mohan Singh connected with you", time: "3 hrs ago" },
  { icon: <FileText size={14} className="text-[#E8720C]" />, text: "Your requirement post is live", time: "5 hrs ago" },
];

export function Dashboard() {
  const [operators, setOperators] = useState<typeof MOCK_OPERATORS>([]);
  const [harvesters, setHarvesters] = useState<typeof MOCK_HARVESTERS>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setOperators(MOCK_OPERATORS.slice(0, 6));
      setHarvesters(MOCK_HARVESTERS.slice(0, 6));
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFAF4]">
      <Navbar variant="auth" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-r from-orange-50 via-[#FDFAF4] to-green-50 rounded-2xl p-8 mb-8 border border-[#E7E0D5]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WheatWatermark className="right-10 top-5" />
          <h1
            className="text-3xl text-[#1C1008] mb-1"
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
          >
            Good Morning, Rajesh 👋
          </h1>
          <p className="text-[#78716C] mb-6">What are you looking to do today?</p>
          <div className="flex flex-wrap gap-3">
            {[
              { to: "/operators", icon: <Search size={14} />, label: "Find Operator" },
              { to: "/harvesters", icon: <Tractor size={14} />, label: "Browse Machines" },
              { to: "/requests", icon: <FileText size={14} />, label: "Post Requirement" },
            ].map((chip) => (
              <Link
                key={chip.to}
                to={chip.to}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E0D5] rounded-full text-sm text-[#78716C] hover:border-[#E8720C] hover:text-[#E8720C] transition-colors shadow-sm"
              >
                {chip.icon} {chip.label}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Hero action cards + activity feed */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {/* Action cards */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            <motion.div
              className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <WheatWatermark className="right-0 bottom-0 opacity-[0.06]" />
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Tractor size={24} />
              </div>
              <h3
                className="text-xl mb-1"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                Browse Machines
              </h3>
              <p className="text-orange-100 text-sm mb-4">200+ harvesters listed across India</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs mb-4">
                200+ Listed
              </span>
              <div>
                <Link
                  to="/harvesters"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-xl text-sm hover:bg-orange-50 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
                >
                  Explore <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="relative overflow-hidden bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3
                className="text-xl mb-1"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                Find Operators
              </h3>
              <p className="text-green-100 text-sm mb-4">500+ verified operators ready to hire</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs mb-4">
                500+ Operators
              </span>
              <div>
                <Link
                  to="/operators"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-xl text-sm hover:bg-green-50 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
                >
                  Explore <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Stats row */}
            {[
              { label: "Total Operators", value: "500+", color: "text-[#E8720C]" },
              { label: "Total Harvesters", value: "200+", color: "text-green-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#E7E0D5] shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
                <p className={`text-2xl mb-1 ${s.color}`} style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>
                  {s.value}
                </p>
                <p className="text-[#78716C] text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-2xl border border-[#E7E0D5] p-5 shadow-[0_2px_16px_rgba(232,114,12,0.06)]">
            <h3
              className="text-[#1C1008] text-base mb-4"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}
            >
              Latest Activity
            </h3>
            <div className="space-y-4">
              {ACTIVITY_FEED.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm text-[#1C1008] leading-snug">{item.text}</p>
                    <p className="text-xs text-[#78716C] flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Operators */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-2xl text-[#1C1008]"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              Recent Operators
            </h2>
            <Link to="/operators" className="text-[#E8720C] text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="shrink-0 w-56">
                    <SkeletonCard />
                  </div>
                ))
              : operators.map((op) => (
                  <div key={op.id} className="shrink-0 w-56">
                    <OperatorCard {...op} />
                  </div>
                ))}
          </div>
        </div>

        {/* Recent Harvesters */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-2xl text-[#1C1008]"
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
            >
              Recent Harvesters
            </h2>
            <Link to="/harvesters" className="text-[#E8720C] text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="shrink-0 w-64">
                    <SkeletonCard />
                  </div>
                ))
              : harvesters.map((h) => (
                  <div key={h.id} className="shrink-0 w-64">
                    <HarvesterCard {...h} />
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

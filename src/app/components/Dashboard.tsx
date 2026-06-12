import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
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
} from "./shared";

export function Dashboard() {
  const [operators, setOperators] = useState<any[]>([]);
  const [harvesters, setHarvesters] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [userName, setUserName] = useState("User");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("tractorsewa_token");
    const fetchData = async () => {
      try {
        let userProfile: any = null;
        if (token) {
          const userRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userRes.ok) {
            userProfile = await userRes.json();
            if (userProfile.role === 'admin') {
              navigate('/admin', { replace: true });
              return;
            }
            setUserName(userProfile.name);
            setCurrentUser(userProfile);
          }
        }

        const opsRes = await fetch('/api/operators?limit=6');
        const opsData = opsRes.ok ? await opsRes.json() : [];
        setOperators(opsData);

        const harvsRes = await fetch('/api/harvesters?limit=6');
        const harvsData = harvsRes.ok ? await harvsRes.json() : [];
        setHarvesters(harvsData);

        // Build dynamic activity feed
        const newActivities: any[] = [];
        if (userProfile && token) {
          // 1. Check user's harvesters
          const userHarvs = harvsData.filter((h: any) => h.ownerName === userProfile.name);
          userHarvs.forEach((h: any) => {
            newActivities.push({
              icon: <Tractor size={14} className="text-orange-500" />,
              text: `Your machine "${h.machineName}" listing is live`,
              time: "Active",
              timestamp: h.id * 1000,
            });
          });

          // 2. Check user's requests
          const reqsRes = await fetch('/api/requests?userId=me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reqsRes.ok) {
            const reqsData = await reqsRes.json();
            reqsData.forEach((r: any) => {
              newActivities.push({
                icon: <FileText size={14} className="text-[#E8720C]" />,
                text: `Your ${r.machineType} requirement in ${r.location} is live`,
                time: "Open",
                timestamp: r.id * 1000,
              });
            });
          }

          // 3. Check messages
          const msgsRes = await fetch('/api/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (msgsRes.ok) {
            const partnersData = await msgsRes.json();
            partnersData.forEach((p: any) => {
              if (p.lastMessage) {
                newActivities.push({
                  icon: <MessageSquare size={14} className="text-blue-500" />,
                  text: `New chat with ${p.name}`,
                  time: "Recent",
                  timestamp: p.lastMessageTime ? new Date(p.lastMessageTime).getTime() : 0,
                });
              }
            });
          }
        }

        // Sort desc by timestamp
        newActivities.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(newActivities.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userName]);

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
            Good Morning, {userName} 👋
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
              {activities.length > 0 ? (
                activities.map((item, i) => (
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
                ))
              ) : (
                <div className="text-sm text-[#78716C] py-2">
                  No recent activities. Post a requirement or add a machine to see updates here!
                </div>
              )}
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
              : operators.length > 0 ? (
                  operators.map((op) => (
                    <div key={op.id} className="shrink-0 w-56">
                      <OperatorCard {...op} isOwner={currentUser && op.user_id === currentUser.id} />
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-white rounded-2xl p-6 text-center border border-[#E7E0D5] text-sm text-[#78716C]">
                    No operators registered yet.
                  </div>
                )
            }
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
              : harvesters.length > 0 ? (
                  harvesters.map((h) => (
                    <div key={h.id} className="shrink-0 w-64">
                      <HarvesterCard {...h} isOwner={userName === h.ownerName} />
                    </div>
                  ))
                ) : (
                  <div className="w-full bg-white rounded-2xl p-6 text-center border border-[#E7E0D5] text-sm text-[#78716C]">
                    No machines listed yet.{" "}
                    <Link to="/add-harvester" className="text-[#E8720C] hover:underline font-medium">
                      List yours today!
                    </Link>
                  </div>
                )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

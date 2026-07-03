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
  useIsMobile,
} from "./shared";
import { toast } from "sonner";
import districtsData from "./districts.json";
import { detectUserLocation, matchLocationWithDistricts } from "./locationHelper";
import { ImageCropperDialog } from "./ImageCropperDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { INDIAN_STATES, MACHINE_TYPES, COMPANIES, HARVESTER_MODELS, HARVESTER_COMPANIES, renderMarkdown } from "./pagesShared";

// MESSAGES
// ===========================
export function Messages() {
  const { t } = useTranslation(["pages", "static"]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");

  const [chatPartners, setChatPartners] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        
        let meData = null;
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          meData = await meRes.json();
          setCurrentUser(meData);
        }

        let partners = [];
        const partnersRes = await fetch('/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (partnersRes.ok) {
          partners = await partnersRes.json();
          setChatPartners(partners);
        }

        if (userIdParam && meData) {
          if (userIdParam === meData.id) {
            // User tried to message themselves (e.g. clicked Book Now on own listing)
            toast.error(t("messages.cannotMessageSelf", { defaultValue: "You cannot message yourself. This is your own listing." }));
            navigate("/dashboard", { replace: true });
            return;
          }
          const existingPartner = partners.find((p: any) => p.id === userIdParam);
          if (existingPartner) {
            setActive(existingPartner);
          } else {
            try {
              const partnerRes = await fetch(`/api/users/${userIdParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (partnerRes.ok) {
                const partnerData = await partnerRes.json();
                const newPartner = {
                  id: partnerData.id,
                  name: partnerData.name,
                  role: partnerData.role,
                  imagePath: partnerData.imagePath,
                  lastMessage: "",
                  lastMessageTime: null
                };
                setChatPartners((prev) => [newPartner, ...prev]);
                setActive(newPartner);
              } else {
                toast.error(t("messages.userNotFound", { defaultValue: "Could not find this user. They may no longer exist." }));
              }
            } catch (partnerErr) {
              console.error("Failed to load chat partner:", partnerErr);
              toast.error(t("messages.loadPartnerFailed", { defaultValue: "Failed to load chat partner. Please try again." }));
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [userIdParam]);

  useEffect(() => {
    if (!active) return;
    const fetchChat = async () => {
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const res = await fetch(`/api/messages?chatPartnerId=${active.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setChat(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchChat();

    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [active]);

  const sendMsg = async () => {
    if (!message.trim() || !active) return;
    try {
      const token = localStorage.getItem("tractorsewa_token");
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: active.id,
          content: message
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChat((prev) => [...prev, newMsg]);
        setMessage("");

        setChatPartners((prevPartners) => {
          const exists = prevPartners.some(p => p.id === active.id);
          if (exists) {
            return prevPartners.map((p) => {
              if (p.id === active.id) {
                return { ...p, lastMessage: message, lastMessageTime: new Date().toISOString() };
              }
              return p;
            }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
          } else {
            return [{
              id: active.id,
              name: active.name,
              imagePath: active.imagePath,
              lastMessage: message,
              lastMessageTime: new Date().toISOString()
            }, ...prevPartners];
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return t("messages.yesterday", { defaultValue: "Yesterday" });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-left font-sans h-full">
        {/* Render Navbar only if no active conversation on mobile to show bottom tabs */}
        {!active && <Navbar variant="auth" />}

        {active ? (
          /* Full-screen Chat Window */
          <div className="flex flex-col h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#efeae2]">
            {/* Chat header */}
            <div className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActive(null);
                    setSearchParams({});
                  }}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} className="text-slate-600 stroke-[2.5px]" />
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  {active.imagePath ? (
                    <img src={active.imagePath} alt={active.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#172263] text-white flex items-center justify-center font-bold text-xs">
                      {active.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 font-sora block leading-snug">{active.name}</h3>
                  <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block leading-none">{active.role || "User"}</span>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-[10px] font-bold bg-white/70 border border-slate-100 px-3 py-1 rounded-full text-slate-500 shadow-xs uppercase tracking-wider">
                    Say Hello! 👋
                  </span>
                </div>
              ) : (
                chat.map((msg, idx) => {
                  const isMe = currentUser && msg.sender_id === currentUser.id;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} snap-end`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs shadow-xs leading-relaxed ${
                        isMe ? "bg-[#172263] text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      }`}>
                        <p>{msg.content}</p>
                        <span className={`text-[8px] font-bold block text-right mt-1 ${isMe ? "text-blue-200" : "text-zinc-400"}`}>
                          {new Date(msg.created_at || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(e);
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
            >
              <input
                type="text"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-[#172263] font-semibold"
              />
              <button
                type="submit"
                className="w-10 h-10 bg-[#172263] text-white rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        ) : (
          /* Chat partners list */
          <div className="px-4 pt-4 flex-1 pb-24">
            <h1 className="text-xl font-extrabold font-sora text-slate-800 mb-4">Messages 💬</h1>
            {chatPartners.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200/60 text-center shadow-xs mt-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#172263]/40">
                  <MessageSquare size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">No Messages Yet</h3>
                <p className="text-xs text-[#57585A] leading-relaxed max-w-xs mx-auto">
                  Start direct chats with harvester operators and owners by browsing their details and hitting Book/Hire!
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100">
                {chatPartners.map((partner) => {
                  const isSelected = active && active.id === partner.id;
                  return (
                    <div
                      key={partner.id}
                      onClick={() => {
                        setActive(partner);
                        setSearchParams({ userId: partner.id });
                      }}
                      className="p-4 flex gap-3.5 items-center active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-150 shrink-0">
                        {partner.imagePath ? (
                          <img src={partner.imagePath} alt={partner.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#172263] text-white flex items-center justify-center font-bold text-sm">
                            {partner.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="text-xs font-black text-slate-800 font-sora truncate">{partner.name}</h4>
                          <span className="text-[8px] font-bold text-zinc-400">
                            {partner.lastMessageTime ? formatTime(partner.lastMessageTime) : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#57585A] font-semibold truncate">
                          {partner.lastMessage || "Click to start chatting"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9]">
      <Navbar variant="auth" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-3xl border border-[#E7E0D5] overflow-hidden shadow-[0_4px_20px_rgba(23,34,99,0.04)] flex" style={{ height: "calc(100vh - 180px)", minHeight: "550px" }}>
          
          {/* Left conversations list */}
          <div className={`w-full md:w-80 border-r border-[#E7E0D5] flex flex-col flex-shrink-0 bg-white ${active ? "hidden md:flex" : "flex"}`}>
            {/* Header */}
            <div className="p-5 border-b border-[#E7E0D5]">
              <h1 className="text-xl font-extrabold text-[#172263] font-sora tracking-tight">{t("messages.title", { defaultValue: "Chats" })} 💬</h1>
            </div>
            
            {/* Conversations */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E7E0D5]/40">
              {loading ? (
                <div className="p-8 text-center text-sm text-[#57585A] flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#172263] border-t-transparent rounded-full animate-spin" />
                  {t("messages.loadingChats", { defaultValue: "Loading chats..." })}
                </div>
              ) : chatPartners.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#57585A] italic">
                  {t("messages.noConversations", { defaultValue: "No conversations yet. Open a machine or operator listing to message the owner!" })}
                </div>
              ) : (
                chatPartners.map((m) => {
                  const isAdminUser = m.role === 'admin';
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActive(m)}
                      className={`w-full p-4 flex items-center gap-3 transition-all text-left ${
                        active?.id === m.id 
                          ? "bg-[#f5eee5] border-l-4 border-l-[#172263]" 
                          : "hover:bg-[#fcfbf9]"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-slate-100 ${
                        isAdminUser 
                          ? "bg-gradient-to-br from-emerald-600 to-green-500 text-white" 
                          : "bg-gradient-to-br from-[#172263] to-[#D97706] text-white"
                      }`}>
                        {isAdminUser ? (
                          <ShieldCheck size={20} className="text-white" />
                        ) : m.imagePath ? (
                          <img src={m.imagePath} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-extrabold text-sm">{m.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-extrabold font-sora truncate flex items-center gap-1 ${
                            isAdminUser ? "text-emerald-700 font-extrabold" : "text-[#1A1A1A]"
                          }`}>
                            {m.name}
                            {isAdminUser && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90 origin-left">
                                Admin
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] font-bold text-[#57585A]/80 shrink-0">{formatTime(m.lastMessageTime)}</span>
                        </div>
                        <p className="text-xs text-[#57585A] truncate">{m.lastMessage || t("messages.noMessages", { defaultValue: "No messages yet" })}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right chat window */}
          {active ? (
            <div className={`flex-1 flex flex-col bg-[#FAF9F6] ${active ? "flex" : "hidden md:flex"}`}>
              {/* Active Header */}
              <div className="p-4 border-b border-[#E7E0D5] bg-white flex items-center justify-between shadow-xs relative z-10">
                <div className="flex items-center gap-3">
                  <button className="md:hidden p-1 mr-1 text-[#57585A] hover:text-[#172263] hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setActive(null)}>
                    <ArrowLeft size={20} />
                  </button>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-slate-100 ${
                    active.role === 'admin' 
                      ? "bg-gradient-to-br from-emerald-600 to-green-500 text-white" 
                      : "bg-gradient-to-br from-[#172263] to-[#D97706] text-white"
                  }`}>
                    {active.role === 'admin' ? (
                      <ShieldCheck size={18} className="text-white" />
                    ) : active.imagePath ? (
                      <img src={active.imagePath} alt={active.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-extrabold text-sm">{active.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold font-sora flex items-center gap-1.5 ${
                      active.role === 'admin' ? "text-emerald-700" : "text-[#1A1A1A]"
                    }`}>
                      {active.name}
                      {active.role === 'admin' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] font-bold text-[#57585A] capitalize tracking-wide">
                      {active.role ? t("roles." + active.role.toLowerCase(), { ns: "static", defaultValue: active.role }) : t("roles.user", { ns: "static", defaultValue: "User" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chat.map((msg, i) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  const msgTime = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                  const isMsgFromAdmin = !isMe && msg.senderRole === 'admin';
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {isMsgFromAdmin && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mb-0.5 ml-2">
                          <ShieldCheck size={11} />
                          <span>Verified Admin</span>
                        </div>
                      )}
                      <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] relative pb-6 ${
                        isMe 
                          ? "bg-[#172263] text-white rounded-tr-none" 
                          : isMsgFromAdmin
                            ? "bg-emerald-50/80 border border-emerald-200 text-emerald-950 rounded-tl-none font-medium shadow-[0_1px_3px_rgba(16,185,129,0.08)]"
                            : "bg-white border border-[#E7E0D5] text-[#1A1A1A] rounded-tl-none"
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span className={`absolute bottom-1 right-2.5 text-[9px] font-medium shrink-0 ${
                          isMe ? "text-white/60" : isMsgFromAdmin ? "text-emerald-700/60" : "text-slate-400"
                        }`}>
                          {msgTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Row */}
              <div className="p-4 border-t border-[#E7E0D5] bg-white flex gap-3 items-center">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                  placeholder={t("messages.typeMessage", { defaultValue: "Type a message..." })}
                  className="flex-1 px-4 py-3 border border-[#E7E0D5] rounded-xl text-sm focus:outline-none focus:border-[#172263] bg-[#fcfbf9] transition-all placeholder:text-[#57585A]/60"
                />
                <button 
                  onClick={sendMsg} 
                  disabled={!message.trim()}
                  className="w-11 h-11 bg-[#172263] hover:bg-[#11194A] text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:hover:bg-[#172263] shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#FAF9F6] text-[#57585A]">
              <div className="text-center max-w-sm px-6">
                <div className="w-16 h-16 bg-[#172263]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#172263]/10">
                  <MessageSquare size={32} className="text-[#172263]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-sora mb-2">{t("messages.yourMessages", { defaultValue: "Your Messages" })}</h3>
                <p className="text-xs text-[#57585A] leading-relaxed">
                  {t("messages.noMessagesSelect", { defaultValue: "Send private messages to machine owners and operators to negotiate prices, coordinates, and seasonal availability details." })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

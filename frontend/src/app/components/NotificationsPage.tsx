import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, LoadingSpinner } from "./shared";
import { Bell, MessageSquare, Star, UserCheck, ShieldCheck, CheckCircle, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function NotificationsPage() {
  const { t } = useTranslation(["pages", "dashboard", "common"]);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("tractorsewa_token");

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleNotifClick = async (notif: any) => {
    if (notif.type !== 'message' && !notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    } else if (notif.type === 'message') {
      try {
        await fetch(`/api/messages/unread/mark-read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ messageIds: [notif.id] })
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Navigation logic matching Navbar
    if (notif.type === 'message') {
      navigate(`/messages?userId=${notif.senderId || notif.targetId}`);
    } else if (notif.type.includes('operator') && notif.targetId) {
      navigate(`/operators/${notif.targetId}`);
    } else if (notif.type.includes('harvester') && notif.targetId) {
      navigate(`/harvesters/${notif.targetId}`);
    } else if (notif.type.includes('machine') && notif.targetId) {
      navigate(`/harvesters/${notif.targetId}`);
    } else if (notif.type.includes('rating') && notif.targetId) {
      if (notif.type.endsWith('operator')) {
        navigate(`/operators/${notif.targetId}`);
      } else {
        navigate(`/harvesters/${notif.targetId}`);
      }
    } else if (notif.type.includes('comment') && notif.targetId) {
      if (notif.type.endsWith('operator')) {
        navigate(`/operators/${notif.targetId}`);
      } else {
        navigate(`/harvesters/${notif.targetId}`);
      }
    } else if (notif.type.includes('harvester')) {
      navigate('/profile?tab=listings');
    } else if (notif.type.includes('operator')) {
      navigate('/profile?tab=operator');
    } else {
      navigate('/dashboard');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await fetch(`/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // messages unread clear
      const msgIds = notifications.filter(n => n.type === 'message').map(n => n.id);
      if (msgIds.length > 0) {
        await fetch(`/api/messages/unread/mark-read`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ messageIds: msgIds })
        });
      }
      toast.success("All alerts marked as read");
      setNotifications([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <Navbar variant="auth" />
      
      <div className="max-w-md mx-auto p-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors md:hidden"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="text-xl font-extrabold font-sora text-slate-800">Alerts & Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-[#E82326] px-2 py-1 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/60 text-center shadow-xs mt-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#172263]/40">
              <Bell size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">All Caught Up!</h3>
            <p className="text-xs text-[#57585A] leading-relaxed max-w-xs mx-auto">
              You have no new notifications or alerts at the moment. Keep checkin' back for updates!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const isMsg = notif.type === 'message';
              const isVerify = notif.type.includes('verification');
              const isRating = notif.type === 'rating';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`bg-white border rounded-2xl p-4 shadow-xs hover:border-[#172263]/30 active:scale-[0.99] transition-all flex gap-3.5 items-start cursor-pointer ${
                    notif.isRead ? 'border-slate-100 opacity-85' : 'border-[#172263]/10 border-l-[3.5px] border-l-[#172263]'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isMsg ? 'bg-indigo-50 text-indigo-600' :
                    isVerify ? 'bg-emerald-50 text-emerald-600' :
                    isRating ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {isMsg ? <MessageSquare size={16} /> :
                     isVerify ? <UserCheck size={16} /> :
                     isRating ? <Star size={16} fill="currentColor" /> : <Bell size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-snug break-words">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] font-bold text-zinc-400">
                        {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 bg-[#172263] rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { useEffect, useState, lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/shared";
import i18n from "../i18n/config";

// Lazy-loaded page components
const Landing = lazy(() => import("./components/Landing").then(m => ({ default: m.Landing })));
const AuthPage = lazy(() => import("./components/Auth").then(m => ({ default: m.AuthPage })));
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const Settings = lazy(() => import("./components/Settings").then(m => ({ default: m.Settings })));
const ActivityPage = lazy(() => import("./components/ActivityPage").then(m => ({ default: m.ActivityPage })));
const EnquiryPage = lazy(() => import("./components/Enquiry").then(m => ({ default: m.EnquiryPage })));
const AskQuestion = lazy(() => import("./components/AskQuestion").then(m => ({ default: m.AskQuestion })));

// Lazy-loaded components from individual page files
const ExploreHarvesters = lazy(() => import("./components/ExploreHarvesters").then(m => ({ default: m.ExploreHarvesters })));
const HarvesterDetail = lazy(() => import("./components/HarvesterDetail").then(m => ({ default: m.HarvesterDetail })));
const ExploreOperators = lazy(() => import("./components/ExploreOperators").then(m => ({ default: m.ExploreOperators })));
const OperatorProfile = lazy(() => import("./components/OperatorProfile").then(m => ({ default: m.OperatorProfile })));
const AddOperator = lazy(() => import("./components/AddOperator").then(m => ({ default: m.AddOperator })));
const AddHarvester = lazy(() => import("./components/AddHarvester").then(m => ({ default: m.AddHarvester })));
const Requests = lazy(() => import("./components/Requests").then(m => ({ default: m.Requests })));
const RequestDetail = lazy(() => import("./components/RequestDetail").then(m => ({ default: m.RequestDetail })));
const Blogs = lazy(() => import("./components/Blogs").then(m => ({ default: m.Blogs })));
const BlogDetail = lazy(() => import("./components/BlogDetail").then(m => ({ default: m.BlogDetail })));
const Profile = lazy(() => import("./components/Profile").then(m => ({ default: m.Profile })));
const Messages = lazy(() => import("./components/Messages").then(m => ({ default: m.Messages })));
const EditProfile = lazy(() => import("./components/EditProfile").then(m => ({ default: m.EditProfile })));
const AdminPortal = lazy(() => import("./components/AdminPortal").then(m => ({ default: m.AdminPortal })));
const EditHarvester = lazy(() => import("./components/EditHarvester").then(m => ({ default: m.EditHarvester })));
const AnalyticsDashboard = lazy(() => import("./components/AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard })));
const TermsAndCondition = lazy(() => import("./components/TermsAndCondition").then(m => ({ default: m.TermsAndCondition })));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const ServiceAgreement = lazy(() => import("./components/ServiceAgreement").then(m => ({ default: m.ServiceAgreement })));
const CancellationPolicy = lazy(() => import("./components/CancellationPolicy").then(m => ({ default: m.CancellationPolicy })));
function ProtectedPage({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function MessageNotifier() {
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("tractorsewa_token");
    if (!token) return;

    const checkUnread = async () => {
      if (location.pathname === "/messages") return;

      try {
        const res = await fetch("/api/messages/unread", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const unreadMsgs = await res.json();
          if (unreadMsgs.length > 0) {
            unreadMsgs.forEach((msg: any) => {
              toast(`Message from ${msg.senderName}`, {
                description: msg.content.length > 60 ? `${msg.content.substring(0, 60)}...` : msg.content,
                action: {
                  label: "Reply",
                  onClick: () => {
                    window.location.href = `/messages?userId=${msg.sender_id}`;
                  }
                }
              });
            });

            const ids = unreadMsgs.map((m: any) => m.id);
            await fetch("/api/messages/unread/mark-read", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ messageIds: ids })
            });
          }
        }
      } catch (err) {
        console.error("Error checking unread messages:", err);
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return null;
}



export default function App() {

  return (
    <BrowserRouter>
      <MessageNotifier />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            borderRadius: "0.75rem",
            border: "1px solid #E7E0D5",
          },
        }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#172263] rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/enquiry" element={<EnquiryPage />} />
          <Route path="/ask-question" element={<AskQuestion />} />
          <Route path="/terms-and-condition" element={<TermsAndCondition />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/service-agreement" element={<ServiceAgreement />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedPage>
                <Dashboard />
              </ProtectedPage>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedPage>
                <AnalyticsDashboard />
              </ProtectedPage>
            }
          />
          <Route
            path="/harvesters"
            element={
              <ProtectedPage>
                <ExploreHarvesters />
              </ProtectedPage>
            }
          />
          <Route
            path="/harvesters/:id"
            element={
              <ProtectedPage>
                <HarvesterDetail />
              </ProtectedPage>
            }
          />
          <Route
            path="/harvesters/:id/edit"
            element={
              <ProtectedPage>
                <EditHarvester />
              </ProtectedPage>
            }
          />
          <Route
            path="/operators"
            element={
              <ProtectedPage>
                <ExploreOperators />
              </ProtectedPage>
            }
          />
          <Route
            path="/operators/:id"
            element={
              <ProtectedPage>
                <OperatorProfile />
              </ProtectedPage>
            }
          />
          <Route
            path="/add-operator"
            element={
              <ProtectedPage>
                <AddOperator />
              </ProtectedPage>
            }
          />
          <Route
            path="/add-harvester"
            element={
              <ProtectedPage>
                <AddHarvester />
              </ProtectedPage>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedPage>
                <Requests />
              </ProtectedPage>
            }
          />
          <Route
            path="/requests/:id"
            element={
              <ProtectedPage>
                <RequestDetail />
              </ProtectedPage>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedPage>
                <Profile />
              </ProtectedPage>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedPage>
                <EditProfile />
              </ProtectedPage>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedPage>
                <AdminPortal />
              </ProtectedPage>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedPage>
                <Messages />
              </ProtectedPage>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedPage>
                <Settings />
              </ProtectedPage>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedPage>
                <ActivityPage />
              </ProtectedPage>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

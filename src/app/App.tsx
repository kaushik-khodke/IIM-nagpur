import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "sonner";
import { Landing } from "./components/Landing";
import { AuthPage } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import {
  ExploreHarvesters,
  HarvesterDetail,
  ExploreOperators,
  OperatorProfile,
  AddOperator,
  AddHarvester,
  Requests,
  RequestDetail,
  Blogs,
  BlogDetail,
  Profile,
  Messages,
  EditProfile,
  AdminPortal,
} from "./components/Pages";
import { EnquiryPage } from "./components/Enquiry";
import { ProtectedRoute } from "./components/shared";

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            borderRadius: "0.75rem",
            border: "1px solid #E7E0D5",
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:id" element={<BlogDetail />} />
        <Route path="/enquiry" element={<EnquiryPage />} />

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
      </Routes>
    </BrowserRouter>
  );
}

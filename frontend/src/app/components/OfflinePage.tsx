import { useState } from "react";
import { WifiOff, RefreshCw, SignalZero, ShieldAlert } from "lucide-react";

interface OfflinePageProps {
  onRetry?: () => void;
}

export function OfflinePage({ onRetry }: OfflinePageProps) {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      if (onRetry) {
        onRetry();
      } else {
        const res = await fetch("/api/site-settings", { cache: "no-store" });
        if (res.ok) {
          window.location.reload();
        }
      }
    } catch (err) {
      // Still offline
    } finally {
      setTimeout(() => setIsChecking(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-['Inter',sans-serif]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#E7E0D5] p-8 text-center relative overflow-hidden">
        {/* Top Decorative Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-[#172263] to-amber-500" />
        
        {/* Offline Icon Container */}
        <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm relative">
          <WifiOff className="w-10 h-10 text-amber-600" />
          <span className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md">
            <SignalZero className="w-4 h-4" />
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-3 tracking-tight font-['Sora',sans-serif]">
          You Are Offline
        </h2>

        {/* Message */}
        <p className="text-[#57585A] text-sm leading-relaxed mb-6">
          We can&apos;t connect to the server right now. Please check your internet connection or network cable and try again.
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>No Internet or Server Unreachable</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full bg-[#172263] hover:bg-[#11194A] text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-75"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checking Connection..." : "Retry Connection"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-50 hover:bg-gray-100 text-[#57585A] font-medium py-2.5 px-4 rounded-xl text-sm transition-colors border border-gray-200"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "./shared";
import { CinematicFooter } from "@/components/motion-footer";
import { ArrowLeft, BookOpen, Shield, ShieldCheck, Scale, Phone, Mail, Globe, MapPin, XCircle, RefreshCw, Landmark } from "lucide-react";

export function CancellationPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: "cancellation", label: "1. Cancellation Policy" },
    { id: "rescheduling", label: "2. Rescheduling Policy" },
    { id: "refund", label: "3. Refund Terms" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* Main Navbar */}
      <Navbar variant="public" />


      {/* Hero Banner Section */}
      <div className="bg-gradient-to-r from-[#172263] to-[#0A1138] text-white py-16 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(232,114,12,0.1),transparent_50%)]" />
        <div className="max-w-[1440px] mx-auto relative z-10 w-full">
          <div className="flex items-center gap-2 text-[#E8720C] text-sm font-semibold mb-3 tracking-wider uppercase">
            <XCircle size={16} /> Booking Rules
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Cancellation & Rescheduling
          </h1>
          <p className="text-white/80 max-w-2xl text-base md:text-lg leading-relaxed">
            Understand details about cancelling appointments, rescheduling limits, and processing fee deductions.
          </p>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-12 flex-1 w-full">
        {/* Breadcrumb & Back Link */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#57585A] hover:text-[#172263] transition-colors font-medium">
            <ArrowLeft size={16} /> Back to Homepage
          </Link>
          <div className="text-xs text-[#57585A] font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <span>Home</span> <span className="mx-1 text-slate-400">/</span> <span className="text-[#172263]">Cancellation Policy</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sticky Sidebar (Table of Contents) */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
              <h3 className="text-sm font-bold text-[#1A1A1A] tracking-wider uppercase mb-4 pb-2 border-b border-slate-100 flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                <BookOpen size={16} className="text-[#172263]" /> Table of Contents
              </h3>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="w-full text-left py-1 px-1 text-sm text-[#57585A] hover:text-[#172263] font-medium transition-all duration-200 block truncate hover:translate-x-1"
                  >
                    {sec.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 text-slate-700 leading-relaxed text-sm md:text-base max-w-none">
            
            {/* Section: Cancellation */}
            <section id="cancellation" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <XCircle size={22} className="text-[#D32F2F] shrink-0" /> 1. Cancellation Policy
              </h2>
              <div className="space-y-4">
                <p>
                  You can cancel a service appointment anytime up to <strong>3 hours</strong> before the scheduled appointment time.
                </p>
                <p className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-medium text-sm">
                  ⚠️ After this period, no refunds will be provided.
                </p>
              </div>
            </section>

            {/* Section: Rescheduling */}
            <section id="rescheduling" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <RefreshCw size={22} className="text-[#172263] shrink-0" /> 2. Rescheduling Policy
              </h2>
              <div className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[#172263] rounded-full mt-2 shrink-0" />
                    <div>
                      <strong>For Workshop Servicing:</strong> You have the flexibility to reschedule your appointment at any time before the scheduled day ends.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[#172263] rounded-full mt-2 shrink-0" />
                    <div>
                      <strong>For At-Door Servicing:</strong> Appointments can be rescheduled anytime before 3 hours of the scheduled appointment time.
                    </div>
                  </li>
                </ul>
                <p>
                  Appointments can be rescheduled within the time frame allowed by Tractor Seva' Company policy. If no slots are available for rescheduling within that time frame, the appointment will be automatically canceled, and a refund will be initiated.
                </p>
                <p>
                  If there is a User No Show or no rescheduling of the appointment, it will be automatically canceled at the end of the day.
                </p>
                <p>
                  Rescheduling cannot be requested once the service has started.
                </p>
                <p>
                  It is important to note that users are allowed to request rescheduling for each appointment a maximum of <strong>two times</strong>. In other words, once you made your payment and booked an appointment, you can reschedule it at no additional cost up to two times. After these two rescheduling instances, the only available option is to cancel the appointment and request a refund in accordance with the company's policies.
                </p>
              </div>
            </section>

            {/* Section: Refund */}
            <section id="refund" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Landmark size={22} className="text-[#172263] shrink-0" /> 3. Refund Terms
              </h2>
              <div className="space-y-4">
                <p>
                  Upon cancellation, you are responsible for paying the complete processing fees and transaction costs.
                </p>
                <p>
                  You will receive a refund of <strong>100% of the remaining amount</strong> after deducting processing fees and transaction costs within <strong>7 working days</strong>.
                </p>
                <p>
                  Refunds will be credited to the same bank account from which the initial payment was received.
                </p>
                <p>
                  Please carefully review our <Link to="/terms-and-condition" className="text-[#172263] font-semibold hover:underline">Terms of Use</Link> for any additional terms related to your use of Tractor Seva' services. If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:customercare@tractorseva.com" className="text-[#172263] hover:underline font-semibold font-sans">customercare@tractorseva.com</a>.
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Cinematic Footer */}
      <CinematicFooter />
    </div>
  );
}

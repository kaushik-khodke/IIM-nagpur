import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "./shared";
import { CinematicFooter } from "@/components/motion-footer";
import { ArrowLeft, BookOpen, Shield, ShieldCheck, Scale, Phone, Mail, Globe, MapPin, Eye, Lock } from "lucide-react";

export function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: "introduction", label: "1. Introduction" },
    { id: "info-collect", label: "2. Information We Collect" },
    { id: "info-use", label: "3. How We Use Your Information" },
    { id: "user-content", label: "4. User Content & Data" },
    { id: "disclosure", label: "5. Disclosure of Information" },
    { id: "security", label: "6. Security" },
    { id: "third-party", label: "7. Third-Party Links" },
    { id: "changes", label: "8. Changes to Privacy Policy" },
    { id: "contact-us", label: "9. Contact Us" },
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
            <Eye size={16} /> Data Protection
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Privacy Policy
          </h1>
          <p className="text-white/80 max-w-2xl text-base md:text-lg leading-relaxed">
            Your privacy is extremely important to us. Learn how we handle, safeguard, and secure your personal information.
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
            <span>Home</span> <span className="mx-1 text-slate-400">/</span> <span className="text-[#172263]">Privacy Policy</span>
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
            
            {/* Section: Introduction */}
            <section id="introduction" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 1. Introduction
              </h2>
              <div className="space-y-4">
                <p>
                  BEDIENUNG SOLUTION PRIVATE LIMITED, doing business as 'Tractor Seva' ('we,' 'us,' or 'our'), is committed to protecting your privacy and safeguarding your personal information.
                </p>
                <p>
                  This Privacy Policy outlines our practices regarding the collection, use, disclosure, and protection of your information when you use our website <a href="https://tractorseva.com" className="text-[#172263] hover:underline font-semibold">tractorseva.com</a>, our mobile application, and related services (collectively referred to as the 'Services').
                </p>
                <p>
                  By using our Services, you consent to the practices described in this Privacy Policy.
                </p>
              </div>
            </section>

            {/* Section: Information We Collect */}
            <section id="info-collect" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 2. Information We Collect
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">2.1. User Data</h3>
                  <p className="mb-3">
                    To access and use Tractor Seva, you must register for a User Account. During the registration process, we collect the following information:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Vehicle details</li>
                    <li>Location information</li>
                  </ul>
                  <p className="mt-3">
                    This information is collectively referred to as 'User Data.' By submitting your User Data, you agree to the terms of this Privacy Policy.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">2.2. User Records</h3>
                  <p className="mb-3">
                    Tractor Seva may collect and store additional information about your interactions with the Services, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>User-generated data or information such as appointments with Workshops and vehicle details.</li>
                    <li>Service records generated during your interactions with Workshops ('Vehicle Data').</li>
                    <li>Telephone calls, which may be recorded, between you and our customer support or service representatives.</li>
                  </ul>
                  <p className="mt-3">
                    This information, together with your User Data, constitutes 'User Records.' We may use User Records for various purposes, including analysis, improving our services, and complying with legal requirements.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">2.3. Third-Party Content</h3>
                  <p>
                    Our platform may feature content from other Users or third parties ('Third-Party Content'). Please note that we do not verify the completeness, accuracy, legality, or safety of Third-Party Content. Additionally, Tractor Seva may display contextual advertisements from third-party advertisers, and we do not review the content of these advertisements. It is your responsibility to verify the authenticity and suitability of offerings from third-party advertisers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section: How We Use Your Information */}
            <section id="info-use" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 3. How We Use Your Information
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">3.1. User Data</h3>
                  <p className="mb-3">We use your User Data for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Creating and maintaining your User Account.</li>
                    <li>Facilitating appointments with Workshops.</li>
                    <li>Contacting you for feedback about our Services.</li>
                    <li>Providing you with information about our Services and promotions, where permitted by applicable law.</li>
                    <li>Sending you reminders when your vehicle’s next servicing is due.</li>
                    <li>Complying with legal obligations.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">3.2. User Records</h3>
                  <p className="mb-3">We may use User Records for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Conducting analysis to improve our Services.</li>
                    <li>Complying with legal requirements and responding to legal requests.</li>
                    <li>Sharing User Records with third parties as allowed by applicable law.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">3.3. Third-Party Content</h3>
                  <p>
                    While we do not take responsibility for the accuracy, legality, or safety of Third-Party Content, we may examine legitimate notices of infringements or unlawful content and take appropriate actions as required by law.
                  </p>
                </div>
              </div>
            </section>

            {/* Section: User Content/Data */}
            <section id="user-content" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 4. User Content / Data
              </h2>
              <div className="space-y-4">
                <p>
                  <strong>4.1. Ownership:</strong> By submitting User Content/Data, you grant Tractor Seva a fully paid, irrevocable, perpetual, royalty-free, worldwide, sub-licensable, non-exclusive license and right to use your User Content/Data for the sole purpose of enabling Tractor Seva to perform its obligations and provide its services in accordance with this Privacy Policy.
                </p>
                <p>
                  <strong>4.2. Warranties:</strong> By submitting User Content/Data, you warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You have all necessary rights and title to grant Tractor Seva the license for your User Content/Data.</li>
                  <li>Your User Content/Data does not infringe or violate the intellectual property rights of a third party.</li>
                  <li>Your User Content/Data complies with the Terms of Use and applicable laws.</li>
                  <li>Your User Content/Data is free of viruses, worms, malware, Trojan horses, or any other harmful elements.</li>
                </ul>
                <p>
                  <strong>4.3. Backups:</strong> You are responsible for regularly backing up your User Content/Data on an alternative storage medium.
                </p>
              </div>
            </section>

            {/* Section: Disclosure of Information */}
            <section id="disclosure" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 5. Disclosure of Information
              </h2>
              <div className="space-y-4">
                <p>
                  We may disclose your information to government authorities when required by law, rule, regulation, or valid legal processes.
                </p>
              </div>
            </section>

            {/* Section: Security */}
            <section id="security" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <ShieldCheck size={22} className="text-[#172263] shrink-0" /> 6. Security
              </h2>
              <div className="space-y-4">
                <p>
                  We employ reasonable security measures to protect your information, but no method of transmission or storage is entirely secure. You are responsible for maintaining the confidentiality of your User Account credentials.
                </p>
              </div>
            </section>

            {/* Section: Third-Party Links */}
            <section id="third-party" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 7. Third-Party Links
              </h2>
              <div className="space-y-4">
                <p>
                  Our Services may contain links to third-party websites or applications. Tractor Seva does not endorse or control these third-party sites and is not responsible for their privacy practices. We recommend reviewing the privacy policies of such sites before using them.
                </p>
              </div>
            </section>

            {/* Section: Changes to this Privacy Policy */}
            <section id="changes" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 8. Changes to this Privacy Policy
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva may update this Privacy Policy from time to time. Significant changes will be communicated through our Services or other means. Your continued use of our Services after such changes constitutes your acceptance of the updated Privacy Policy.
                </p>
              </div>
            </section>

            {/* Section: Contact Us */}
            <section id="contact-us" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Lock size={22} className="text-[#172263] shrink-0" /> 9. Contact Us
              </h2>
              <div className="space-y-4">
                <p>
                  If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact us at <a href="mailto:customercare@tractorseva.com" className="text-[#172263] hover:underline font-semibold font-sans">customercare@tractorseva.com</a>.
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

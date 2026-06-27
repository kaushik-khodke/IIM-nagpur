"use client";

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import tractorSevaLogo from "@/assets/tractor-seva-logo.png";

export function CinematicFooter() {
  const { t } = useTranslation(["pages", "common", "static"]);
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (location.pathname === "/") {
      e.preventDefault();
      if (anchor === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      if (anchor === "top") {
        e.preventDefault();
        navigate("/");
      } else {
        e.preventDefault();
        navigate(`/#${anchor}`);
      }
    }
  };

  return (
    <footer className="w-full bg-[#002855] text-white py-10 px-6 md:px-12 relative overflow-hidden font-sans border-t border-[#001D3D] z-10">
      {/* Subtle Aurora Glow background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(232,114,12,0.05),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(23,34,99,0.2),transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* 1. Top Section: Have a Question & Franchise Inquiry */}
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 pb-6 border-b border-white/10">
          
          {/* Left Block: Have a Question */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left justify-between">
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white mb-0.5">
                {t("footer.haveQuestion", { defaultValue: "Have a Question?" })}
              </h3>
              <p className="text-lg md:text-xl font-bold text-white/80 mb-4">
                {t("footer.feelFreeToAsk", { defaultValue: "Feel free to ask" })}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Phone className="w-3.5 h-3.5 text-white" />
              </div>
              <a 
                href="tel:+919209392096" 
                className="text-lg md:text-xl font-bold text-white hover:text-[#E8720C] transition-colors duration-300"
              >
                +91 92093 92096
              </a>
            </div>
          </div>

          {/* Vertical Separator Line (Desktop only) */}
          <div className="hidden md:block w-px bg-white/10 self-stretch my-1" />

          {/* Right Block: Franchise Inquiry */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6 md:pl-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white mb-0.5">
                {t("footer.sendInquiry", { defaultValue: "Send Inquiry" })}
              </h3>
              <p className="text-lg md:text-xl font-bold text-white/80">
                {t("footer.forFranchise", { defaultValue: "For Franchise" })}
              </p>
            </div>
            <Link
              to="/enquiry"
              className="px-6 py-2.5 bg-white text-[#002855] font-extrabold rounded-lg hover:bg-[#E8720C] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 text-center min-w-[130px] text-sm"
            >
              {t("shared.inquiry", { defaultValue: "Inquiry" })}
            </Link>
          </div>

        </div>

        {/* 2. Middle Section: Five Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 xl:gap-8 pt-2">
          
          {/* Column 1: Logo & Social Media */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={tractorSevaLogo} 
                alt="Tractor Seva" 
                className="h-12 w-auto brightness-0 invert object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            </Link>
            <div className="w-full text-center md:text-left space-y-3">
              <h4 className="text-xs font-bold text-white/60 tracking-widest uppercase">
                {t("footer.followUs", { defaultValue: "Follow Us" })}
              </h4>
              <div className="flex justify-center md:justify-start gap-3">
                <a 
                  href="https://www.facebook.com/tractorsevaindia?mibextid=LQQJ4d" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-[#E8720C] hover:border-[#E8720C] hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.instagram.com/tractorseva/?igsh=MXBsZGk3ajkyMTA4NQ%3D%3D" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-[#E8720C] hover:border-[#E8720C] hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://twitter.com/TractorSeva" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-[#E8720C] hover:border-[#E8720C] hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
                  title="X (Twitter)"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/company/tractor-seva/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white hover:bg-[#E8720C] hover:border-[#E8720C] hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Important Links */}
          <div className="text-center md:text-left space-y-3">
            <h4 className="text-base font-bold text-white tracking-wider">
              {t("footer.importantLinksHeader", { defaultValue: "Important Links" })}
            </h4>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>
                <a href="#" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.termsAndCondition", { defaultValue: "Terms and Condition" })}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.privacyPolicy", { defaultValue: "Privacy Policy" })}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.serviceAgreement", { defaultValue: "Service Agreement" })}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.cancellationPolicy", { defaultValue: "Cancellation and Rescheduling Policy" })}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="text-center md:text-left space-y-3">
            <h4 className="text-base font-bold text-white tracking-wider">
              {t("footer.quickLinksHeader", { defaultValue: "Quick Links" })}
            </h4>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>
                <a href="#top" onClick={(e) => handleAnchorClick(e, "top")} className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("nav.home", { ns: "common", defaultValue: "Home" })}
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => handleAnchorClick(e, "how-it-works")} className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("landing.howItWorks", { ns: "pages", defaultValue: "How It Works" })}
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleAnchorClick(e, "features")} className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("landing.features", { ns: "pages", defaultValue: "Features" })}
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => handleAnchorClick(e, "faq")} className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("nav.faq", { ns: "common", defaultValue: "FAQ" })}
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => handleAnchorClick(e, "contact")} className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("nav.contact", { ns: "common", defaultValue: "Contact" })}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Our Offerings */}
          <div className="text-center md:text-left space-y-3">
            <h4 className="text-base font-bold text-white tracking-wider">
              {t("footer.ourOfferingsHeader", { defaultValue: "Our Offerings" })}
            </h4>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>
                <Link to="/harvesters" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.bookService", { defaultValue: "Book Service" })}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.buyKits", { defaultValue: "Buy Kits" })}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.buyPartsAndAccessories", { defaultValue: "Buy Parts & Accessories" })}
                </a>
              </li>
              <li>
                <a href="https://tractorseva.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#E8720C] hover:translate-x-1 transition-all duration-300 block">
                  {t("footer.tractorSevaLink", { defaultValue: "Tractor-seva" })}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Us Details */}
          <div className="text-center md:text-left space-y-3 lg:col-span-1 md:col-span-2">
            <h4 className="text-base font-bold text-white tracking-wider">
              {t("footer.contactUsHeader", { defaultValue: "Contact Us" })}
            </h4>
            <div className="space-y-2.5 text-sm text-white/70">
              
              {/* Address */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs md:text-sm text-white/80 leading-relaxed text-center md:text-left">
                  Bedienung Solution Private Limited (Tractor Seva)<br />
                  C/o- InFED Indian Institute of Management Nagpur Mihan (Non-Sez), Nagpur, Maharashtra, India - 441108
                </p>
              </div>

              {/* Email */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white shrink-0">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <a href="mailto:customercare@tractorseva.com" className="text-xs md:text-sm text-white/80 hover:text-[#E8720C] transition-colors">
                  customercare@tractorseva.com
                </a>
              </div>

              {/* Phone */}
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <a href="tel:+919209392096" className="text-xs md:text-sm text-white/80 hover:text-[#E8720C] transition-colors">
                  +91 92093 92096
                </a>
              </div>

            </div>
          </div>

        </div>

        {/* 3. Bottom Bar: Copyright & Payment Logos */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          
          {/* Copyright Text */}
          <div className="text-xs text-white/60 font-semibold tracking-wide text-center md:text-left">
            {t("footer.copyrightText", { defaultValue: "All rights reserved to Tractor seva" })}
          </div>

          {/* Payment Gateways */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            
            {/* UPI Logo */}
            <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded flex items-center justify-center h-7" title="UPI">
              <span className="text-[10px] font-black italic tracking-wider text-white">UPI</span>
            </div>

            {/* RuPay Logo */}
            <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded flex items-center justify-center h-7" title="RuPay">
              <span className="text-[10px] font-black italic text-white flex items-center gap-0.5">
                RuPay<span className="text-[#E8720C] font-black">▶</span>
              </span>
            </div>

            {/* Mastercard Logo */}
            <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded flex items-center justify-center gap-1 h-7" title="MasterCard">
              <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] -mr-2" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F00] opacity-80" />
            </div>

            {/* Visa Logo */}
            <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded flex items-center justify-center h-7" title="Visa">
              <span className="text-[10px] font-black italic text-white tracking-widest">VISA</span>
            </div>

            {/* Amex Logo */}
            <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded flex items-center justify-center h-7" title="American Express">
              <span className="text-[8px] font-extrabold text-white tracking-tighter uppercase border border-white/20 px-1 bg-[#0170B9]/20 rounded-sm">
                AMEX
              </span>
            </div>

          </div>

        </div>

      </div>
    </footer>
  );
}
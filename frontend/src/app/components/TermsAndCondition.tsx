import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "./shared";
import { CinematicFooter } from "@/components/motion-footer";
import { ArrowLeft, BookOpen, Shield, ShieldCheck, Scale, Phone, Mail, Globe, MapPin } from "lucide-react";

export function TermsAndCondition() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: "introduction", label: "1. Introduction" },
    { id: "registration", label: "2. Registration & Account" },
    { id: "service-terms", label: "3. Service Terms" },
    { id: "cancellation", label: "4. Cancellation & Refund" },
    { id: "access-data", label: "5. Responsibility for Access Data" },
    { id: "reviews", label: "6. Reviews & Feedback" },
    { id: "user-records", label: "7. User Records" },
    { id: "third-party", label: "8. Third-Party Content" },
    { id: "user-content", label: "9. User Content & Data" },
    { id: "intellectual-property", label: "10. Intellectual Property" },
    { id: "liability", label: "11. Representation & Liability" },
    { id: "suspension", label: "12. Suspension & Termination" },
    { id: "data-privacy", label: "13. Data Privacy" },
    { id: "prohibited-activities", label: "14. Prohibited Activities" },
    { id: "changes", label: "15. Changes to Terms" },
    { id: "applicable-law", label: "16. Applicable Law" },
    { id: "dispute-resolution", label: "17. Dispute Resolution" },
    { id: "force-majeure", label: "18. Force Majeure" },
    { id: "miscellaneous", label: "19. Miscellaneous" },
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
            <Scale size={16} /> Legal Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Terms of Use
          </h1>
          <p className="text-white/80 max-w-2xl text-base md:text-lg leading-relaxed">
            Welcome to Tractor Seva. Please read these Terms of Use carefully before using our website, application, or agricultural services.
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
            <span>Home</span> <span className="mx-1 text-slate-400">/</span> <span className="text-[#172263]">Terms of Use</span>
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
                <Shield size={22} className="text-[#172263] shrink-0" /> 1. Introduction
              </h2>
              <div className="space-y-4">
                <p>
                  Welcome to Tractor Seva! These Terms of Use (the “Terms”) are legally binding and apply to all users of Tractor Seva, hereinafter referred to as “Tractor Seva,” “Tractor Seva,” or “the Company.” Please take a moment to carefully read and understand these Terms.
                </p>
                <p>
                  By using or accessing the Tractor Seva websites at <a href="https://tractorseva.com" className="text-[#172263] hover:underline font-semibold">tractorseva.com</a> or our mobile application (collectively the “Website”), as well as utilizing the Tractor Seva services (the “Services”) through a third-party website or service (the “Third-Party Service”), you are indicating your agreement to comply with these Terms, along with all applicable laws and regulations.
                </p>
                <p>
                  Your use of the Services is conditional upon your acceptance of these Terms, any other relevant Tractor Seva terms and policies, and all applicable laws and regulations. If you do not agree to abide by these Terms in their entirety, you must refrain from accessing or using the Services and terminate your use immediately.
                </p>
                <p>
                  To register and use Tractor Seva in any capacity, you must be 18 years of age or older. By registering, visiting, or using Tractor Seva, or by accepting these Terms of Use, you represent and warrant to Tractor Seva that you are at least 18 years old and possess the requisite authority and a valid driver' license to operate a vehicle.
                </p>
                <p>
                  To access Tractor Seva, you must first visit our website at <a href="https://tractorseva.com" className="text-[#172263] hover:underline font-semibold">tractorseva.com</a>. Our Tractor Seva mobile application is currently compatible with both Android and iOS operating systems. Please ensure that you have the capability for mobile data communication, and be aware that you will be responsible for any associated data transfer costs charged by your mobile data provider. For optimal performance and functionality, it is recommended that you always use the latest version of Tractor Seva.
                </p>
                <p>
                  Tractor Seva' primary goal is to simplify the online booking process for servicing heavy-duty vehicles, particularly tractors. Our service can be availed at either Tractor Seva' dedicated workshops or a location of your choice. Furthermore, we offer the valuable feature of creating and maintaining comprehensive service records for your vehicles (collectively referred to as the “Services”). These Services are provided by Tractor Seva through its network of franchise holders located throughout the country, also known as “Workshops.”
                </p>
                <p>
                  Please note that the aforementioned Services may be subject to changes over time, at Tractor Seva' sole discretion. These Terms of Use apply to all users who visit Tractor Seva and use our Services, as well as to any information you provide on Tractor Seva at any given time.
                </p>
                <p>
                  By downloading, installing, copying, accessing, clicking the “I accept” or “I agree” button, or otherwise using Tractor Seva, you acknowledge that you have agreed to these Terms of Use. If you disagree with any part of these Terms, please refrain from using our tool. Access to and use of Tractor Seva and its Services are granted solely at Tractor Seva' discretion.
                </p>
                <p>
                  Tractor Seva reserves the right to modify or terminate any portion of these Terms of Use for any reason and at any time. Such modifications will be communicated to users via notifications. It is essential that you regularly check for updates to these Terms and continue to use the latest version of Tractor Seva. Your continued use of Tractor Seva after any modifications signifies your agreement to comply with the revised Terms of Use.
                </p>
                <p>
                  If you enter into this agreement as a representative of a legal entity or partnership, such as the company for which you work, you must ensure that you possess the necessary authority to legally bind the company to these Terms.
                </p>
                <p>
                  Tractor Seva reserves the right to have any of its services performed by third parties, including affiliated group companies of Tractor Seva, who act as subcontractors or Franchise Holders.
                </p>
              </div>
            </section>

            {/* Section: Registration, Tractor Seva account */}
            <section id="registration" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 2. Registration, Tractor Seva account
              </h2>
              <div className="space-y-4">
                <p>
                  To access and use the Tractor Seva Tractor Service platform, users are required to complete the registration process by selecting a User ID and password. Registration is free of charge.
                </p>
                <p>
                  During the registration procedure, users must provide and grant Tractor Seva access to specific user details, which include their name, email address, phone number, vehicle information, and location (collectively referred to as “User Data”). By submitting this User Data, the user is extending an offer to Tractor Seva to establish a contractual agreement based on these Terms of Use.
                </p>
                <p>
                  If the provided User Data is accurate and valid, Tractor Seva may accept the user's offer, resulting in the formation of a binding contract (“User Relationship”). Upon activation of the Tractor Seva account, the user is granted permission to utilize Tractor Seva in accordance with these Terms of Use. It is the user's responsibility to ensure the accuracy and completeness of their User Data at all times.
                </p>
                <p>
                  Should Tractor Seva determine at any stage, whether during or after account registration, that the provided User Data is inaccurate, false, or misleading, Tractor Seva reserves the right, at its sole discretion, to suspend or terminate the User Relationship.
                </p>
                <p>
                  Users are obliged to maintain the confidentiality of their User Account details and password. Unless Tractor Seva receives written notification from the user indicating a possible breach, all access to the User Account will be presumed to be initiated by the user or executed under the user's authorization. Tractor Seva disclaims any liability in cases of unauthorized access to User Accounts.
                </p>
                <p>
                  Each user is permitted to register with Tractor Seva only once. Multiple registrations may lead to the suspension of the User Account. Please note that, as a general practice, we do not conduct identity or information verification during the registration process. Consequently, we assume no responsibility for verifying the authenticity of each profile owner as claimed by the respective account holder.
                </p>
              </div>
            </section>

            {/* Section: Service Terms */}
            <section id="service-terms" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 3. Service Terms
              </h2>
              <div className="space-y-4">
                <p>
                  For a comprehensive understanding of how Tractor Seva provides services to its users, please refer to Tractor Seva' <Link to="/service-agreement" className="text-[#172263] font-semibold hover:underline">Service Agreement</Link>.
                </p>
                <p>
                  It is important to note that the Service Agreement should be read in conjunction with these Terms of Use and both documents, along with the other policies mentioned in these Terms of Use, collectively form a binding agreement. We strongly recommend that users carefully review all of these policies before entering into any service contracts.
                </p>
              </div>
            </section>

            {/* Section: Cancellation, Rescheduling and refund */}
            <section id="cancellation" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 4. Cancellation, Rescheduling and Refund
              </h2>
              <div className="space-y-4">
                <p>
                  For detailed information on our cancellation terms, please consult Tractor Seva' <Link to="/cancellation-policy" className="text-[#172263] font-semibold hover:underline">Cancellation and Rescheduling Policy</Link>.
                </p>
              </div>
            </section>

            {/* Section: Responsibility for the access data */}
            <section id="access-data" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 5. Responsibility for the Access Data
              </h2>
              <div className="space-y-4">
                <p>
                  It is your responsibility to maintain the confidentiality of your access data, including your password, and to prevent unauthorized third parties from gaining access. You are further accountable for ensuring that access to Tractor Seva and the utilization of Tractor Seva services occur exclusively under your supervision or under the authority of those you designate.
                </p>
                <p>
                  If there is reason to believe that unauthorized third parties have become aware of or obtained your access data, it is imperative to promptly inform Tractor Seva.
                </p>
                <p>
                  Please be aware that you are fully liable for any use and/or other activities on Tractor Seva carried out under your access data.
                </p>
              </div>
            </section>

            {/* Section: Reviews and feedback by User */}
            <section id="reviews" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 6. Reviews and Feedback by User
              </h2>
              <div className="space-y-4">
                <p>
                  Users are permitted to provide ratings and reviews regarding their experiences with the Workshops (“Feedback”) at their sole discretion. However, it is incumbent upon the user to ensure that such Feedback complies with applicable laws. It is important to understand that Tractor Seva is not obligated to take any specific actions to implement the content of User Feedback, such as delisting a particular Workshop from Tractor Seva.
                </p>
                <p>
                  Tractor Seva' role in publishing Feedback is that of an 'intermediary' as defined by the Information Technology Act, 2000. Tractor Seva disclaims all responsibility for the content of Feedback, and its role concerning such content is limited to its obligations as an 'intermediary' under the aforementioned Act. Tractor Seva is not liable to compensate any user for the Feedback provided.
                </p>
                <p>
                  By using Tractor Seva, you agree that Tractor Seva may contact you via telephone, email, SMS, or any other electronic means of communication to solicit feedback about the Workshops or the Services.
                </p>
              </div>
            </section>

            {/* Section: User’s Records */}
            <section id="user-records" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 7. User’s Records
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva offers users a feature called “Records” within its web application to maintain the following information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>User-created:</strong> This includes User Data or information generated during the user's interactions with the Tractor Seva ecosystem, such as appointments with Workshops and vehicle details.
                  </li>
                  <li>
                    <strong>Service-created:</strong> These are service records generated as a result of the user's interactions with Workshops (“Vehicle Data”).
                  </li>
                </ul>
                <p>
                  These collectively constitute “User Records.” Users acknowledge that the Workshops they visit through Tractor Seva may utilize Tractor Seva' software for their business purposes and Tractor Seva' services, including but not limited to the storage of User Records, in accordance with applicable laws.
                </p>
                <p>
                  By sharing or storing User Records on Tractor Seva products used by Workshops, users agree to the storage of User Records by Tractor Seva for the purposes of the respective Workshops' business operations, in compliance with applicable laws. Upon creating a User Account with Tractor Seva, users also agree to the mapping of such User Records, as available in Tractor Seva' database, to their User Account.
                </p>
                <p>
                  Users can access a log of their vehicle service records, including Workshop names, types of service, service dates, and other service details, from the Bookings page on Tractor Seva.
                </p>
                <p>
                  It is important to note that Tractor Seva assumes no responsibility for the accuracy or completeness of User Records. Tractor Seva is under no obligation to retain User Records for any specific duration or to make them available to users at all times. While engaged with Tractor Seva, reasonable efforts will be made to provide access to User Records.
                </p>
                <p>
                  Users also agree that Tractor Seva may use User Records for analysis and business improvement purposes, and may share them with third parties in accordance with applicable laws. Tractor Seva does not provide compensation for the use of User Records.
                </p>
                <p>
                  Users have the right to request the deletion of User Data upon termination of the User Relationship through the 'Contact Us' option on Tractor Seva. However, Vehicle Data may remain available in Tractor Seva for a duration determined by Tractor Seva.
                </p>
              </div>
            </section>

            {/* Section: Third-Party Content */}
            <section id="third-party" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 8. Third-Party Content
              </h2>
              <div className="space-y-4">
                <p>
                  The content on the Tractor Seva platform originates from both Tractor Seva itself and other users or third parties. Content from users and other third parties is collectively referred to as “Third-Party Content.” Tractor Seva does not verify the completeness, accuracy, legality, or timeliness of Third-Party Content and does not claim it as its own. Therefore, Tractor Seva accepts no responsibility or guarantee for the completeness, accuracy, legality, timeliness, quality, or suitability of Third-Party Content for specific purposes. Tractor Seva does not conduct safety checks on Third-Party Content and assumes no responsibility or guarantee for its safety aspects.
                </p>
                <p>
                  Tractor Seva, at its discretion, will examine legitimate notices of violations of these Terms of Use or any unlawful or inaccurate Third-Party Content and take appropriate actions when necessary. This includes removing unlawful or offensive Third-Party Content as soon as Tractor Seva becomes aware of it.
                </p>
                <p>
                  Tractor Seva may display contextual advertisements from third-party advertisers for promotional purposes. Tractor Seva does not review the content of such advertisements and disclaims responsibility or liability for their accuracy, completeness, reliability, suitability, legality, infringement, compliance with laws and regulations, or any other aspect. Users are solely responsible for verifying the authenticity and suitability of such offerings before engaging with third-party advertisers.
                </p>
              </div>
            </section>

            {/* Section: User Content/ Data */}
            <section id="user-content" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 9. User Content / Data
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva does not acquire any ownership rights over User Content/Data when it is transferred, uploaded, transmitted, or published in connection with the use of Tractor Seva. Users retain ownership of their User Content/Data and are solely responsible for it.
                </p>
                <p>
                  By submitting, uploading, sharing, publishing, transmitting, or otherwise making User Content/Data available on or through Tractor Seva, users grant Tractor Seva a fully paid, irrevocable, perpetual, royalty-free, worldwide, sub-licensable, non-exclusive license and right to use User Content/Data solely for the purpose of enabling Tractor Seva to fulfill its obligations and provide its services in accordance with these Terms of Use. This right of use encompasses:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Storing User Content/Data on Tractor Seva' servers or those of third parties contracted by Tractor Seva, both domestically and internationally.</li>
                  <li>Reproducing, modifying, and publishing User Content/Data, including publicly displaying User Content/Data via the App (or parts thereof).</li>
                  <li>Transferring User Content/Data to affiliates and third parties associated with Tractor Seva, strictly in compliance with data protection regulations on a need-to-know basis.</li>
                </ol>
                <p>
                  Users warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>They possess all necessary rights and title to User Content/Data required to grant Tractor Seva the rights specified in these Terms of Use and that User Content/Data does not infringe upon or violate third-party intellectual property.</li>
                  <li>User Content/Data complies with these Terms of Use and applicable laws.</li>
                  <li>User Content/Data is free from viruses, worms, malware, Trojan horses, or any other harmful features.</li>
                </ul>
                <p>
                  While Tractor Seva is obligated to store User Content, users are responsible for regularly backing up User Content/Data in an alternative storage medium.
                </p>
                <p>
                  Tractor Seva may disclose User Content/Data to government authorities if such disclosure is required by law, regulations, or validly issued administrative or judicial processes.
                </p>
                <p>
                  “User Content” encompasses all data, including text, audio, video, or image files, that a user transfers to Tractor Seva in connection with the use of the tool, including User Data.
                </p>
                <p>
                  Users must respect the rights of third parties at all times when using the Tractor Seva platform. Users are solely responsible for all User Content they submit and share on Tractor Seva, ensuring that it does not violate legal prohibitions or third-party rights, including but not limited to name rights, personality rights, copyrights, data protection rights, and trademark rights.
                </p>
              </div>
            </section>

            {/* Section: Intellectual Property and license restrictions */}
            <section id="intellectual-property" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 10. Intellectual Property and License Restrictions
              </h2>
              <div className="space-y-4">
                <p>
                  The Tractor Seva platform and its content are the property of Tractor Seva or its licensors and are protected by copyright and other intellectual property rights. Subject to the terms and conditions outlined herein, users are granted a limited, non-transferable, non-exclusive license to use Tractor Seva for accessing the Services.
                </p>
                <p>
                  Trademarks and logos associated with this App, excluding Third-Party Content, are the trademarks of Tractor Seva and may not be used by any other party without prior written consent from Tractor Seva. Users are prohibited from removing references and comments within Tractor Seva that pertain to confidentiality, copyrights, trademarks, patent rights, and other intellectual property rights.
                </p>
                <p>
                  Regarding the license to use Tractor Seva as described herein, users agree to the following license restrictions:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users have no right to sublicense, rent, lease, assign, sell, distribute, or transfer the license to any third party without the express prior written permission of Tractor Seva.</li>
                  <li>Users shall not, or enable others to, copy, decompile, reverse engineer, disassemble, attempt to derive the source code of the App or its algorithms, decrypt, modify, or create derivative works of the App or any services provided by the App, or any part thereof. Any such attempt is a violation of Tractor Seva' rights with respect to the App.</li>
                  <li>Users shall not allow any third party to make error corrections or otherwise modify or adapt the Tractor Seva platform or Tractor Seva services.</li>
                </ul>
              </div>
            </section>

            {/* Section: Representation, Warranty, Liability */}
            <section id="liability" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 11. Representation, Warranty and Liability
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva provides services on an “as-is” basis and does not guarantee that Tractor Seva will meet the User's requirements or that it will be continuously available and error-free. Tractor Seva assumes no warranty or maintenance responsibility for the Tractor Seva Service. Tractor Seva does not guarantee uninterrupted access to and use of Tractor Seva, as it may be affected by downtimes, maintenance activities, developments, updates, upgrades, malfunctions, or other situations beyond Tractor Seva' control.
                </p>
                <p>
                  The use of Tractor Seva is solely at the User's risk. Tractor Seva does not make any representations or warranties regarding the adequacy of Workshop facilities, the authenticity and quality of spare parts used by Workshops, the quality of services provided by Workshops, the expertise of Workshop employees, or the reasonableness of Workshop prices. Users are expected to conduct their own due diligence and checks before entrusting their vehicles to a Workshop.
                </p>
                <p>
                  Tractor Seva does not guarantee the availability of services listed on Tractor Seva at all times or that services will not be delayed.
                </p>
                <p>
                  Tractor Seva shall not be responsible for any consequences resulting from interruptions in mobile data connectivity.
                </p>
                <p>
                  Any disputes between the User and the Workshop must be settled solely between the User and the Workshop, without involving Tractor Seva in any way.
                </p>
                <p>
                  Tractor Seva does not recommend or vouch for any representations made by any Workshop. Tractor Seva' role is limited to providing listings of Workshops in the vicinity of the User or at the location requested by the User. The User agrees that the decision to avail of Workshop services is made at their own discretion.
                </p>
                <p>
                  Tractor Seva bears no liability for third-party ratings of the Workshops. Tractor Seva has no influence or control over third-party ratings and reviews of the Workshops. Relying on ratings and reviews is solely at the User's discretion and risk.
                </p>
                <p>
                  The User has no claims or actions against Tractor Seva for any grievances, disputes, losses, or damages suffered due to the use of the Tractor Seva Website or App or interactions with Workshops.
                </p>
                <p>
                  The User represents and warrants that all data and details provided herein are true and correct and will remain so at all times.
                </p>
                <p>
                  The User represents and warrants that the vehicle is used for its intended purpose and is duly insured as required by law, and is otherwise fit for use. The vehicle is driven by a qualified individual with a valid driver' license.
                </p>
                <p>
                  Tractor Seva provides a platform to connect Users with Workshops and facilitate vehicle maintenance and improvement solutions. Therefore, Tractor Seva is not liable to Users for any acts, omissions, negligence, misconduct of the Workshops, non-availability of Workshop facilities, or any other acts or omissions by third parties beyond Tractor Seva' control.
                </p>
                <p>
                  To the maximum extent permitted by law, Tractor Seva shall not be liable for any direct, indirect, incidental, special, consequential, or any other damages, including but not limited to loss of profits, data corruption, failure to transmit or receive data, delays, accidents, injuries, business interruptions, or any other commercial damages or losses arising from the use of Tractor Seva and/or the Services. This limitation of liability applies regardless of the theory of liability (contract, tort, or otherwise) and even if Tractor Seva has been advised of the possibility of such damages.
                </p>
                <p>
                  These limitations of liability also apply to the fault of individuals engaged by Tractor Seva in the performance of its obligations and to the personal liability of Tractor Seva employees, representatives, and corporate bodies.
                </p>
              </div>
            </section>

            {/* Section: Suspension, Termination of User Relationship */}
            <section id="suspension" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 12. Suspension, Termination of User Relationship
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva reserves the right to temporarily or permanently suspend a User's access to Tractor Seva if the User breaches their representations, obligations, or violates the Terms of Use. Tractor Seva' decision in this regard shall be final and binding.
                </p>
                <p>
                  Tractor Seva will send a notification to the User before suspending or terminating their account. However, in exceptional cases, such as serious or repeated violations, Tractor Seva may take action without prior warning.
                </p>
                <p>
                  The User Relationship begins on the date of creating the User Account and continues until terminated by Tractor Seva or the User.
                </p>
                <p>
                  Both the User and Tractor Seva have the right to terminate the User Relationship without providing a reason. Tractor Seva will provide one week's notice before terminating the User Relationship.
                </p>
                <p>
                  Upon termination, the User's right to use Tractor Seva will automatically end, and access to the Services will no longer be available.
                </p>
                <p>
                  In the case of a temporary suspension, access will be reinstated after the suspension period expires, and the User will be notified by email. A permanently suspended access cannot be restored.
                </p>
                <p>
                  Tractor Seva, at its sole discretion and without obligation to inform or provide notice to Users, may take down Tractor Seva and terminate services for all Users, resulting in the termination of the User Relationship. Any bookings made but not used at the time of such tool closure will be considered canceled by the User. Points will be canceled, and Vehicle Records will no longer be available.
                </p>
              </div>
            </section>

            {/* Section: Data Privacy */}
            <section id="data-privacy" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <ShieldCheck size={22} className="text-[#172263] shrink-0" /> 13. Data Privacy
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva processes all personal data in accordance with the Tractor Seva <Link to="/privacy-policy" className="text-[#172263] font-semibold hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            </section>

            {/* Section: Prohibited activities */}
            <section id="prohibited-activities" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 14. Prohibited Activities
              </h2>
              <div className="space-y-4">
                <p>
                  Commercial use is only permitted within authorized scopes. Unauthorized commercial use includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Offering and promoting paid content, services, and products, both owned and third-party.</li>
                  <li>Conducting commercial activities such as competitions, lotteries, barter, advertisements, or pyramid schemes.</li>
                  <li>Collecting identity and contact information (including email addresses) from members for any purpose, including sending unsolicited emails.</li>
                  <li>Exploiting the services available on Tractor Seva.</li>
                </ul>
                <p>
                  You are prohibited from any activity on or in connection with Tractor Seva that violates applicable law, the rights of third parties, or the principles of protecting minors. Specifically, you are prohibited from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Posting, distributing, offering, or promoting pornographic content, services, or products that violate child protection laws, data protection laws, or other laws.</li>
                  <li>Using content that offends or defames other users or third parties.</li>
                  <li>Using, providing, or distributing content, services, or products protected by law or burdened with third-party rights (such as copyrights) without explicit authorization.</li>
                </ul>
                <p>
                  Additionally, you are prohibited from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Spreading viruses, Trojans, and other harmful files.</li>
                  <li>Sending junk or spam emails, as well as chain emails.</li>
                  <li>Disseminating offensive, sexually explicit, obscene, or defamatory content or communication, or content that promotes racism, fanaticism, hate, physical violence, or illegal acts.</li>
                  <li>Harassing other users or promoting or supporting such harassment.</li>
                  <li>Requesting other users to reveal passwords or personal data for commercial, legal, or illegal purposes.</li>
                  <li>Distributing or publicly reproducing content available on Tractor Seva without explicit permission.</li>
                  <li>Actions likely to disrupt the smooth operation of Tractor Seva, particularly by overloading our IT systems.</li>
                </ul>
                <p>
                  If you become aware of any illegal, abusive, or unauthorized use of Tractor Seva, you can report it to BEDIENUNG SOLUTION PRIVATE LIMITED at the provided address or email for further review and appropriate action.
                </p>
                <p>
                  We reserve the right to refuse, edit, block, or remove any content posted by you without prior notice if it violates these provisions or if there are concrete indications of a serious breach, taking into consideration your legitimate interests.
                </p>
              </div>
            </section>

            {/* Section: Changes to Tractor Seva and the Terms of Use */}
            <section id="changes" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 15. Changes to Tractor Seva and the Terms of Use
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva reserves the right to modify the Tractor Seva platform, its appearance, features, and services, fix bugs, and update versions at any time without notifying Users.
                </p>
                <p>
                  Tractor Seva may also, within reason, change the Terms of Use. Users will be notified of changes within a reasonable period and will be advised of their right to object and terminate the User Relationship. If a User does not object within fifteen (15) days of receiving the notification, the changes will be considered agreed upon. In case of objection, the User Relationship will be terminated as mentioned earlier.
                </p>
                <p>
                  Editorial changes to the Terms of Use, such as correcting typographical errors, may be made without notifying Users.
                </p>
              </div>
            </section>

            {/* Section: Applicable law and place of jurisdiction */}
            <section id="applicable-law" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Scale size={22} className="text-[#172263] shrink-0" /> 16. Applicable Law and Jurisdiction
              </h2>
              <div className="space-y-4">
                <p>
                  This Agreement shall be construed and governed in accordance with the laws of India excluding its choice of law rules. All disputes relating to this Agreement shall be subject to exclusive jurisdiction of competent courts at Nagpur, Maharashtra.
                </p>
              </div>
            </section>

            {/* Section: Dispute resolution procedure */}
            <section id="dispute-resolution" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Scale size={22} className="text-[#172263] shrink-0" /> 17. Dispute Resolution Procedure
              </h2>
              <div className="space-y-4">
                <p>
                  Any disputes arising from or relating to this agreement will be resolved through arbitration. The decision of the arbitrator(s) will be binding and final.
                </p>
              </div>
            </section>

            {/* Section: Force Majeure */}
            <section id="force-majeure" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 18. Force Majeure
              </h2>
              <div className="space-y-4">
                <p>
                  Operational disruptions caused by force majeure or other unavoidable events beyond Tractor Seva' control, which:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>could not be averted with reasonable effort,</li>
                  <li>could not have been foreseen even with reasonable care, or</li>
                  <li>make Tractor Seva' obligations under these Terms of Use considerably more difficult or completely or partially impossible, shall release Tractor Seva from performance for the duration of the event.</li>
                </ul>
              </div>
            </section>

            {/* Section: Miscellaneous */}
            <section id="miscellaneous" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <Shield size={22} className="text-[#172263] shrink-0" /> 19. Miscellaneous
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva’s relevance algorithm for the Workshops is a fully automated system that lists the Workshops, their address and location. These listings of Workshops do not represent any fixed objective ranking or endorsement by Tractor Seva. Tractor Seva will not be liable for any change in the relevance of the Workshops on search results, which may take place from time to time. The listing of Workshops will be based on automated computation of the various factors including inputs made by the Users including their comments and feedback. Such factors may change from time to time, in order to improve the listing algorithm. Tractor Seva in no event will be held responsible for the accuracy and the relevancy of the listing order of the Workshops on Tractor Seva.
                </p>
                <p>
                  Tractor Seva may make available to the User certain promotions, discounts, coupons and offers from time to time based on its discretion. Such promotions, discounts, coupons and offers, if provided, are valid for a limited time only and subject to additional conditions. Tractor Seva reserves the right to modify or cancel coupons at any time. Coupons are non-transferable and cannot be converted to cash or kind. Tractor Seva shall have no responsibility or liability in respect of products, services provided against coupons. Unused coupons shall expire immediately on termination of User Relationship.
                </p>
                <p>
                  No provision of this Agreement shall be deemed to be waived and no breach excused, unless such waiver or consent shall be in writing and signed by Tractor Seva. Any consent by Tractor Seva to, or a waiver by Tractor Seva of any breach by you, whether expressed or implied, shall not constitute consent to, waiver of, or excuse for any other different or subsequent breach.
                </p>
                <p>
                  User may not assign any or all portion of its obligations without the prior written consent of Tractor Seva, not to be unreasonably withheld.
                </p>
                <p>
                  Should any provision of these Terms of Use be or become invalid or unenforceable, this shall, however, not affect the remaining provisions.
                </p>
                <p>
                  Tractor Seva assumes no liability in respect of User’s use of this Tractor Seva or experience at the Workshop or consequences thereof nor any obligation to pay or be liable to settle any costs, fee, compensation, damages that the User may claim against the Workshop. Tractor Seva only facilitates listing of Workshops through this Tractor Seva and User chooses the Workshop at its sole discretion and on its own responsibility.
                </p>
                <p>
                  If you have any questions about any part of the Terms of Use, feel free to contact us at <a href="mailto:customercare@tractorseva.com" className="text-[#172263] hover:underline font-semibold">customercare@tractorseva.com</a>.
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

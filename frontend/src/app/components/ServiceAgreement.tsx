import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "./shared";
import { CinematicFooter } from "@/components/motion-footer";
import { ArrowLeft, BookOpen, Shield, ShieldCheck, Scale, Phone, Mail, Globe, MapPin, FileText, CheckCircle } from "lucide-react";

export function ServiceAgreement() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: "introduction", label: "1. Introduction" },
    { id: "service-offer", label: "2. Service Offer & Availability" },
    { id: "booking", label: "3. Booking Service Appointments" },
    { id: "conduct", label: "4. Customer Conduct" },
    { id: "support", label: "5. Support" },
    { id: "fee", label: "6. Service Fee" },
    { id: "payment", label: "7. Payment Terms" },
    { id: "liability", label: "8. Representation & Liability" },
    { id: "other-terms", label: "9. Other Terms" },
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
            <FileText size={16} /> User Agreement
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            Service Agreement
          </h1>
          <p className="text-white/80 max-w-2xl text-base md:text-lg leading-relaxed">
            This agreement governs the booking and provision of heavy vehicle servicing, workshop support, and At-door tractor servicing.
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
            <span>Home</span> <span className="mx-1 text-slate-400">/</span> <span className="text-[#172263]">Service Agreement</span>
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
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 1. Introduction
              </h2>
              <div className="space-y-4">
                <p>
                  BEDIENUNG SOLUTION PRIVATE LIMITED, hereinafter referred to as 'Tractor Seva,' with its registered office located at Flat No. 302, 7B, Building No. 7, Mahindra Bloomdale Co-operative Housing Society, Mihan, Nagpur (Urban), Khapri Maharashtra- 441108, India, provides the Tractor Seva tool through its web portal, <a href="https://tractorseva.com" className="text-[#172263] hover:underline font-semibold">tractorseva.com</a>, and its mobile application ('Tractor Seva App') for delivering its services to you, a vehicle owner referred to as the 'User,' based on the terms outlined in this Service Agreement.
                </p>
                <p>
                  The Tractor Seva tool has been designed to facilitate Users in discovering and connecting with workshops that specialize in servicing heavy vehicles, particularly tractors ('Workshop Services'). Furthermore, it offers the option to schedule a service at a location chosen by the User ('At-door Service') and to establish and manage service records for the User's vehicle, collectively referred to as the 'Services.'
                </p>
                <p>
                  Workshops are made available by Tractor Seva through its network of franchisees spread across the country. At-door Services shall be provided by 'Service Professionals' assigned by Tractor Seva.
                </p>
                <p>
                  Please note that the Services mentioned above may undergo periodic changes at Tractor Seva' discretion, and this Service Agreement applies to all Users who visit Tractor Seva to utilize its Services, as well as to all information provided by Users on the Tractor Seva platform at any given time.
                </p>
                <p>
                  Tractor Seva retains the right to amend or terminate any part of this Service Agreement at its discretion and at any time. Users will be notified of such modifications through notifications. Users are encouraged to use the most recent version of Tractor Seva and to review the Service Agreement regularly. Your continued use of Tractor Seva following any such modification signifies your agreement to abide by the revised Service Agreement.
                </p>
                <p>
                  Tractor Seva is authorized to delegate the performance of any of its services to third parties, including affiliated group companies of Tractor Seva, who may act as subcontractors or Franchise Holders.
                </p>
              </div>
            </section>

            {/* Section: Service Offer and Availability */}
            <section id="service-offer" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 2. Service Offer and Availability
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva provides a platform with a variety of services that enable you, as a User, to access information and interact with workshops and other service providers. For a comprehensive overview of the services and the associated requirements, please consult our service description at <a href="https://tractorseva.com" className="text-[#172263] hover:underline font-semibold">tractorseva.com</a>. Users also have the option to specify their service requirements beyond those outlined in the service description. However, the availability of such services depends on the individual workshops. Tractor Seva cannot guarantee the availability of such services.
                </p>
                <p>
                  We retain the right to supplement the services available on Tractor Seva or to restrict the usage of certain services. Users do not have an inherent right to retain specific services or features.
                </p>
                <p>
                  To access certain services, you must complete the registration process, which is free of charge. However, we reserve the right to offer specific services for a fee.
                </p>
                <p>
                  For free services, there is no guarantee of uninterrupted usage.
                </p>
                <p>
                  It is possible that access to or use of Tractor Seva may be temporarily interrupted or impaired due to maintenance, upgrades, or other disruptions that may result in data loss. We make every effort to ensure uninterrupted usability of Tractor Seva services, but temporary disruptions or interruptions may occur due to technical issues, such as power outages, hardware and software glitches, or technical problems with data lines.
                </p>
              </div>
            </section>

            {/* Section: Booking Service Appointment */}
            <section id="booking" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 3. Booking Service Appointments
              </h2>
              <div className="space-y-4">
                <p>
                  By utilizing Tractor Seva' services, Users acknowledge and consent to the sharing of their User Data with Workshops, which is necessary to facilitate communication and appointments.
                </p>
                <p>
                  Users can choose between two service options: 'Workshop Servicing,' where the service is performed at the Workshop selected by the User, or 'At-door Servicing,' where the service is conducted at a location designated by the User. Users should be aware that the quality of service for At-door Servicing may differ from that of Workshop Servicing. Tractor Seva recommends Workshop Servicing for a higher quality service experience.
                </p>
                <p>
                  It's important to understand that although Tractor Seva provides appointment booking services, Tractor Seva assumes no liability if a Workshop cancels a confirmed appointment or if the selected Workshop is unavailable at the scheduled time.
                </p>
                <p>
                  Any search results generated by Users on Tractor Seva for Workshops should not be construed as an endorsement by Tractor Seva of any particular Workshop. If Users decide to engage with a Workshop for vehicle services, they do so at their own discretion.
                </p>
                <p>
                  Without limiting the generality of the above, please note that Tractor Seva is not involved in providing vehicle services and, as such, is not responsible for any interactions between Users and Workshops. Users expressly acknowledge and agree that Tractor Seva shall not be held liable for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Any interactions or associated issues that Users may have with Workshops.</li>
                  <li>The ability or intent of Workshops, or their lack thereof, in fulfilling their obligations to Users.</li>
                  <li>Any issues related to the wrong parts, accessories, or quality of service provided by Workshops, or any negligence on the part of Workshops in delivering services.</li>
                  <li>Inappropriate behavior, damage to the vehicle before, during, or after service, the misplacement or loss of personal belongings, or any similar difficulties or inconveniences experienced by Users due to Workshop failures to provide agreed-upon services.</li>
                  <li>Inappropriate behavior, damage to the vehicle before, during, or after service, the misplacement or loss of personal belongings, or any similar difficulties or inconveniences experienced by Workshops due to a lack of detailed information about the vehicle service or any other reasons.</li>
                  <li>Cancellation, no-shows, or rescheduling of booked appointments by Workshops.</li>
                </ul>
                <p>
                  It is expressly clarified that any information obtained or received by Users from Tractor Seva, its employees, contractors, partners, sponsors, advertisers, licensors, or other sources on Tractor Seva is for informational purposes only. Tractor Seva makes no guarantees, representations, or warranties, whether expressed or implied, regarding professional qualifications, work quality, the use of spare parts in vehicles, Workshop expertise, or any other information provided on Tractor Seva. In no event shall Tractor Seva be liable to Users or anyone else for any decisions made or actions taken by Users based on such information.
                </p>
              </div>
            </section>

            {/* Section: Customer Conduct */}
            <section id="conduct" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 4. Customer Conduct
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva strictly prohibits discrimination against Service Professionals based on factors including but not limited to race, religion, caste, national origin, disability, sexual orientation, sex, marital status, gender identity, age, or any other characteristic protected under applicable law. This prohibition encompasses all forms of discrimination, including the refusal to accept Services from Service Professionals based on any of these characteristics.
                </p>
                <p>
                  We kindly request that you treat all Service Professionals with courtesy and respect, and that you ensure they have a safe and suitable environment in which to perform their Services. Service Professionals have the right to decline providing Services if you have not provided a safe and appropriate work environment, or if you engage with them in a discourteous, disrespectful, abusive, or otherwise inappropriate manner.
                </p>
                <p>
                  Tractor Seva reserves the right to restrict your access to Services at our sole discretion if you behave in a manner deemed discourteous, disrespectful, abusive, inappropriate, or unlawful towards any Service Professional.
                </p>
                <p>
                  You acknowledge your responsibility for refraining from discriminating against Service Professionals and for providing them with a safe, clean, and appropriate location to perform their Services. Additionally, you agree to disclose any information that may affect a Service Professional's ability to provide the Services or impact their health, safety, or well-being, to both Tractor Seva and the Service Professional.
                </p>
                <p>
                  In the event that a Service Professional conducts themselves in a discourteous, disrespectful, abusive, inappropriate, or unlawful manner, you are required to promptly report such an incident to customercare@tractorseva.com within 48 (forty-eight) hours of the occurrence.
                </p>
              </div>
            </section>

            {/* Section: Support */}
            <section id="support" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 5. Support
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva provides a call center support service for addressing malfunctions, queries, or concerns related to the use of the Tractor Seva platform. Users can reach the call center via telephone during regular business hours, from 9 am to 5 pm, India time.
                </p>
                <p>
                  For each call, the call center generates a ticket and assigns it appropriately. When feasible, the call center will offer telephone support to resolve issues independently.
                </p>
              </div>
            </section>

            {/* Section: Service fee */}
            <section id="fee" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 6. Service Fee
              </h2>
              <div className="space-y-4">
                <p>
                  The fees for all services offered by Tractor Seva are detailed under the Services tab on our platform. Users are responsible for all subscription fees or other charges associated with their use of Tractor Seva' services. Payments must be made using the payment methods accepted by Tractor Seva. Please note that Tractor Seva retains the exclusive right to adjust the prices of its services and products.
                </p>
                <p>
                  Additionally, it's important to clarify that Tractor Seva is not accountable for any extra charges that a Workshop may impose for services booked online by Users. Any supplementary expenses incurred in this manner are the sole responsibility of the User and should be settled directly with the Workshop.
                </p>
                <p>
                  For any additional work performed directly by a Workshop, beyond what is included in the User's package purchased through the Tractor Seva portal, payment must be made directly to the Workshop. Tractor Seva disclaims any responsibility for the quality of service and products used by the Workshop for such additional work.
                </p>
              </div>
            </section>

            {/* Section: Payment term's */}
            <section id="payment" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 7. Payment Terms
              </h2>
              <div className="space-y-4">
                <p>
                  <strong>Taxes:</strong> All Charges and Fees are inclusive of applicable taxes.
                </p>
                <p>
                  Tractor Seva reserves the right to reasonably amend the Charges and Fees at any time at its sole discretion. A change in Fees shall not impact any bookings that have been confirmed before the publication of the revised Fees on the Platform.
                </p>
                <p>
                  Charges and Fees that you pay are final and non-refundable, unless otherwise determined by Tractor Seva or required by the applicable laws. Under certain laws, you may be entitled to a refund or other remedies for a failure in the provision of the Services.
                </p>
                <p>
                  You acknowledge and agree that Charges and Fees applicable in certain geographical areas may increase substantially during times of high demand. Tractor Seva will use reasonable efforts to inform you of the Charges and Fees that may apply. However, by using the Services, you will be responsible for the Charges and Fees incurred under your Account regardless of your awareness of such Charges or Fees.
                </p>
                <p>
                  <strong>Payment Processors:</strong> We may use a third-party payment processor ('Payment Processor') to bill you through your selected mode of payment. The processing of payments will be subject to the terms and policies of such Payment Processor in addition to these Terms. We shall not be liable for any error of the Payment Processor. In the event of any unsuccessful payment, the money debited shall be credited in accordance with the terms of the Payment Processor.
                </p>
              </div>
            </section>

            {/* Section: Representation, Warranty, Liability */}
            <section id="liability" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 8. Representation, Warranty and Liability
              </h2>
              <div className="space-y-4">
                <p>
                  Tractor Seva offers its services on an 'as-is' basis and does not warrant that Tractor Seva will meet Users' requirements or that it will be continuously available and error-free. Tractor Seva assumes no responsibility for warranty or maintenance of the Tractor Seva Service. Furthermore, Tractor Seva does not guarantee uninterrupted access to and usage of Tractor Seva, as interruptions can occur due to maintenance, development, updates, upgrades, malfunctions, or other factors beyond Tractor Seva' control.
                </p>
                <p>
                  The use of Tractor Seva is solely at the User's risk. Tractor Seva does not make any representations or warranties regarding the adequacy of Workshop facilities, the authenticity and quality of spare parts used by Workshops, the quality of service provided by Workshops, the expertise of Workshop employees, or the reasonableness of Workshop prices. Users are expected to conduct their own due diligence and assessments before entrusting their vehicles to a Workshop.
                </p>
                <p>
                  Tractor Seva does not guarantee that the services listed on Tractor Seva will always be available at Workshops or that there will be no delays in service.
                </p>
                <p>
                  Tractor Seva bears no responsibility for any consequences resulting from interruptions in mobile data connectivity.
                </p>
                <p>
                  Any disputes that may arise between a User and a Workshop must be resolved solely between the User and the Workshop, and Tractor Seva shall not be involved in such disputes.
                </p>
                <p>
                  Tractor Seva neither endorses nor vouches for any representations made by Workshops. Tractor Seva' role is limited to providing listings of Workshops in the User's vicinity or at the User's specified location. Users acknowledge that they have chosen to avail themselves of Workshop services at their own discretion.
                </p>
                <p>
                  Tractor Seva assumes no liability in respect of User's use of this Tractor Seva or experience at the Workshop or consequences thereof nor any obligation to pay or be liable to settle any costs, fee, compensation, damages that the User may claim against the Workshop. Tractor Seva only facilitates listing of Workshops through this Tractor Seva and User chooses the Workshop at its sole discretion and on its own responsibility.
                </p>
                <p>
                  Tractor Seva assumes no liability for third-party ratings of Workshops. Tractor Seva has no influence or control over third-party ratings and reviews about Workshops. Relying on these ratings and reviews is solely at the discretion and risk of the User.
                </p>
                <p>
                  Users have no claims or actions against Tractor Seva for any grievances, disputes, losses, or damages they may incur due to their use of the Tractor Seva Website or App or their interactions with Workshops.
                </p>
                <p>
                  Users represent and warrant that all data and details provided herein are true, correct, and will remain so at all times.
                </p>
                <p>
                  Users represent and warrant that their vehicle is used for its intended purpose, is duly insured as required by law, and is otherwise fit for use. The vehicle should be operated by a qualified individual with a valid driver' license.
                </p>
                <p>
                  Tractor Seva merely provides a platform to connect Users with Workshops and facilitate vehicle maintenance and improvement solutions. Therefore, Tractor Seva is not liable to Users for any acts or omissions, negligence or misconduct of Workshops, or for the non-availability or maintenance of service facilities by Workshops, or for any failures on the part of Workshops to properly provide requested services or for any other actions or omissions by third parties beyond Tractor Seva' control.
                </p>
                <p>
                  To the fullest extent permitted by law, Tractor Seva shall not be liable for any direct, indirect, incidental, special, consequential, or other damages, including, without limitation, damages for loss of profits, data corruption, failure to transmit or receive data, delays, accidents, injuries, business interruption, or any other commercial damages or losses, arising from or related to your use or inability to use Tractor Seva and its Services, regardless of the theory of liability (contract, tort, or otherwise), even if Tractor Seva has been advised of the possibility of such damages.
                </p>
                <p>
                  These limitations of liability also apply in cases of faults committed by individuals engaged by Tractor Seva in performing its obligations and to the personal liability of Tractor Seva' employees, representatives, and corporate bodies.
                </p>
              </div>
            </section>

            {/* Section: Other terms */}
            <section id="other-terms" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
                <CheckCircle size={22} className="text-[#172263] shrink-0" /> 9. Other Terms
              </h2>
              <div className="space-y-4">
                <p>
                  In the event that a User books any services from Tractor Seva, this Service Agreement must be read in conjunction with the <Link to="/terms-and-condition" className="text-[#172263] font-semibold hover:underline">Terms and Condition</Link>, <Link to="/privacy-policy" className="text-[#172263] font-semibold hover:underline">Privacy Policy</Link>, and <Link to="/cancellation-policy" className="text-[#172263] font-semibold hover:underline">Cancellation and Rescheduling Policy</Link> of Tractor Seva, which shall be considered fully binding. Users are strongly advised to carefully review all these policies before engaging in any service contract.
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

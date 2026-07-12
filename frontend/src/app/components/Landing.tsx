

import { useState, useEffect, Suspense, memo, useRef, useMemo } from "react";

import { Link, useNavigate } from "react-router-dom";
import tractorSevaLogo from "@/assets/tractor-seva-logo.png";

import { motion, useInView } from "motion/react";

import {

  Search,

  MapPin,

  Users,

  User,

  Tractor,

  MessageSquare,

  BarChart3,

  Filter,

  CheckCircle,

  ArrowRight,

  Star,

  Wheat,

  Globe,

  ChevronDown,

} from "lucide-react";

import { useTranslation } from "react-i18next";

import CountUp from "@/components/ui/CountUp";

import {

  Navbar,

  WheatWatermark,

  SkeletonCard,
  ProfileCard,
  DirectorySkeletonCard,
  AuthChooserDialog,
  getFirstImage,
  DynamicText,
} from "./shared";

import { Canvas } from "@react-three/fiber";

import { TractorModel } from "@/components/ui/Tractor3D";

import { CinematicFooter } from "@/components/motion-footer";

import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

import districtsData from "./districts.json";

import { cn } from "@/lib/utils";



const INDIAN_STATES = districtsData.states.map((s: any) => s.state);











function BlogCard3D({

  id,

  title,

  category,

  shortDescription,

  date,

  image_url,

}: {

  id: string | number;

  title: string;

  category: string;

  shortDescription: string;

  date: string;

  image_url?: string;

}) {

  const { t } = useTranslation(["pages"]);



  const finalImageUrl = image_url || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";



  return (

    <CardContainer className="inter-var w-full h-full py-0" containerClassName="w-full h-full py-0">

      <CardBody className="bg-white relative group/card border-[#E2E8F0] w-full h-full rounded-2xl border flex flex-col hover:shadow-[0_8px_32px_rgba(232,114,12,0.15)] shadow-[0_2px_16px_rgba(232,114,12,0.08)] transition-all duration-300">

        <Link to={`/blogs/${id}`} className="block h-full flex flex-col w-full">

          <CardItem translateZ="50" className="w-full h-48 overflow-hidden rounded-t-2xl shrink-0 bg-gray-200">

            <img

              src={finalImageUrl}

              alt={title}

              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"

              onError={(e) => {

                const target = e.currentTarget;

                const fallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";

                if (target.src !== fallback) {

                  target.src = fallback;

                }

              }}

            />

          </CardItem>

          <div className="p-5 flex-1 flex flex-col w-full">

            <CardItem translateZ="40" className="flex items-center gap-2 mb-3">

              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full">

                <DynamicText>{category}</DynamicText>

              </span>

              <span className="text-xs text-[#57585A]">{date}</span>

            </CardItem>

            <CardItem

              translateZ="60"

              className="text-[#1A1A1A] text-base mb-2 line-clamp-2"

              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}

            >

              <DynamicText>{title}</DynamicText>

            </CardItem>

            <CardItem

              as="p"

              translateZ="50"

              className="text-[#57585A] text-sm line-clamp-2 mb-4 flex-1 w-full"

            >

              <DynamicText>{shortDescription}</DynamicText>

            </CardItem>

            <CardItem

              translateZ="30"

              className="text-[#172263] text-sm font-medium group-hover/card:underline mt-auto"

            >

              {t("blogs.readMore", { ns: "pages" })} →

            </CardItem>

          </div>

        </Link>

      </CardBody>

    </CardContainer>

  );

}



const Tractor3DCanvas = memo(function Tractor3DCanvas() {

  return (

    <Canvas 
      camera={{ position: [0, 0, 5], fov: 53 }}
      gl={{ 
        precision: "mediump", 
        powerPreference: "high-performance"
      }}
    >

      <Suspense fallback={null}>

        <TractorModel />

      </Suspense>

    </Canvas>

  );

});



function VideoBackground({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {

  const ref = useRef<HTMLVideoElement>(null);



  useEffect(() => {

    if (ref.current) {

      ref.current.defaultMuted = true;

      ref.current.muted = true;

      ref.current.playsInline = true;

      const playPromise = ref.current.play();

      if (playPromise !== undefined) {

        playPromise.catch(() => {

          // Silent catch for autoplay constraints

        });

      }

    }

  }, [src]);



  return (

    <video

      ref={ref}

      src={src}

      autoPlay

      loop

      muted

      playsInline

      className={`w-full h-full object-cover opacity-30 group-hover:opacity-55 transition-opacity duration-700 ease-out scale-115 ${className || ''}`}

      style={style}

    />

  );

}


function ServicingEnquirySection() {
  const { t } = useTranslation(["pages", "common"]);
  const [bgImage, setBgImage] = useState('/enquiry_background/background.png');

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.enquiry_background) {
          setBgImage(data.enquiry_background);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <section
      className="relative py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center overflow-hidden flex items-center justify-center min-h-[450px] rounded-3xl my-6 max-w-[1440px] mx-auto text-left"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-slate-950/57 z-0" />
 
      <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* Left Side Details */}
        <div className="lg:col-span-7 text-white space-y-4 text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight font-sora" style={{ fontFamily: "'Sora', sans-serif" }}>
            {t("landing.service.title", { ns: "pages", defaultValue: "Professional Harvester Servicing & Support" })}
          </h2>

          <div className="space-y-3 pt-0 max-w-md">
            <div className="flex gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold shrink-0">
                1
              </span>
              <div>
                <h4 className="font-bold text-white text-base">{t("landing.service.fieldAssistance", { ns: "pages", defaultValue: "On-Field Assistance" })}</h4>
                <p className="text-sm text-slate-300">{t("landing.service.fieldAssistanceDesc", { ns: "pages", defaultValue: "Mechanics available to travel directly to your farm." })}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold shrink-0">
                2
              </span>
              <div>
                <h4 className="font-bold text-white text-base">{t("landing.service.spareParts", { ns: "pages", defaultValue: "Genuine Spare Parts" })}</h4>
                <p className="text-sm text-slate-300">{t("landing.service.sparePartsDesc", { ns: "pages", defaultValue: "Access high-quality parts from certified brands." })}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold shrink-0">
                3
              </span>
              <div>
                <h4 className="font-bold text-white text-base">{t("landing.service.engineers", { ns: "pages", defaultValue: "Experienced Engineers" })}</h4>
                <p className="text-sm text-slate-300">{t("landing.service.engineersDesc", { ns: "pages", defaultValue: "Specialists in John Deere, Claas, Mahindra, and other top machinery." })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side CTA Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-white rounded-[1.5rem] shadow-2xl p-6 max-w-sm w-full flex flex-col items-center justify-center text-center gap-4 border border-slate-100 min-h-[320px]">
            <img src={tractorSevaLogo} alt="Tractor Seva Logo" className="h-10 w-auto object-contain" />
            <h3 className="text-2xl font-bold text-[#1A1A1A] font-sora leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {t("landing.service.requestTitle", { ns: "pages", defaultValue: "Request Machine Service" })}
            </h3>
            <a
              href="https://tractorseva.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#172263] hover:bg-[#11194A] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all w-full cursor-pointer uppercase tracking-wider mt-2"
            >
              {t("landing.service.bookButton", { ns: "pages", defaultValue: "Book Service Now" })} <ArrowRight size={16} />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}


function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

export function Landing() {

  const { t } = useTranslation(["pages", "common", "dashboard"]);

  const [isMobilePWA, setIsMobilePWA] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    setWebglSupported(hasWebGL());
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          new URLSearchParams(window.location.search).get('utm_source') === 'pwa' ||
                          (window.navigator as any).standalone === true;
      setIsMobilePWA(isStandalone && window.innerWidth < 1024);
    };
    checkPWA();
    window.addEventListener('resize', checkPWA);
    return () => window.removeEventListener('resize', checkPWA);
  }, []);

  const [operators, setOperators] = useState<any[]>([]);

  const [harvesters, setHarvesters] = useState<any[]>([]);

  const [blogs, setBlogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const [customFaqs, setCustomFaqs] = useState<any[]>([]);

  const [showAllFaqs, setShowAllFaqs] = useState(false);



  // Shuffle default FAQs once on component mount or when translation function updates

  const defaultFaqs = useMemo(() => {

    const list = [

      {

        q: t("landing.faq.q1.question", { ns: "pages", defaultValue: "What is Tractor Seva?" }),

        a: t("landing.faq.q1.answer", { ns: "pages", defaultValue: "Tractor Seva is a digital platform connecting Indian farmers with harvester owners and tractor operators to easily rent agricultural machinery and hire skilled help." })

      },

      {

        q: t("landing.faq.q2.question", { ns: "pages", defaultValue: "How do I book a harvester or hire an operator?" }),

        a: t("landing.faq.q2.answer", { ns: "pages", defaultValue: "You can browse our verified directory of machines and operators, filter by your state or district, and contact the listings directly via our integrated real-time chat or WhatsApp." })

      },

      {

        q: t("landing.faq.q3.question", { ns: "pages", defaultValue: "Is it free to list my machine or register as an operator?" }),

        a: t("landing.faq.q3.answer", { ns: "pages", defaultValue: "Yes! Registering your profile as a tractor operator or listing your harvester is completely free. We do not charge any registration fees or listing fees." })

      },

      {

        q: t("landing.faq.q4.question", { ns: "pages", defaultValue: "How does the service requests portal work?" }),

        a: t("landing.faq.q4.answer", { ns: "pages", defaultValue: "If you are a farmer looking for specific machinery or help, you can post a Service Request. Operators and machine owners can browse these requests and contact you directly to offer their services." })

      },

      {

        q: t("landing.faq.q5.question", { ns: "pages", defaultValue: "How are operators and machines verified?" }),

        a: t("landing.faq.q5.answer", { ns: "pages", defaultValue: "We encourage community trust through our Rating & Review system. Users can rate operators and machines based on their direct experience. Always inspect machinery and discuss terms before finalizing payments." })

      },

      {

        q: t("landing.faq.q6.question", { ns: "pages", defaultValue: "Can I use Tractor Seva in my local language?" }),

        a: t("landing.faq.q6.answer", { ns: "pages", defaultValue: "Absolutely! Tractor Seva has complete multilingual localization support. You can switch between English, Marathi, and other regional languages using the language toggle in the navigation bar." })

      },

      {

        q: t("landing.faq.q7.question", { ns: "pages", defaultValue: "Can I book a harvester for a single day, or is there a minimum booking period?" }),

        a: t("landing.faq.q7.answer", { ns: "pages", defaultValue: "Tractor Seva does not enforce a minimum booking period. You can search for and request bookings for any duration. However, individual harvester owners may set their own minimum service periods (e.g., 2-3 days) during peak harvest seasons to cover transportation and setup costs. We recommend discussing this directly with the owner." })

      },

      {

        q: t("landing.faq.q8.question", { ns: "pages", defaultValue: "Are there any service charges or commission fees taken by Tractor Seva?" }),

        a: t("landing.faq.q8.answer", { ns: "pages", defaultValue: "No, Tractor Seva is a completely free, peer-to-peer platform. We do not charge any booking fees, service fees, or commission cuts from farmers, harvester owners, or operators. All financial transactions and rate negotiations happen directly between you and the service provider." })

      }

    ];

    return [...list].sort(() => Math.random() - 0.5).map(item => ({ ...item, isDynamic: false }));

  }, [t]);



  // Combine custom FAQs (recent first) and default static FAQs

  const allFaqs = useMemo(() => {

    const customList = customFaqs.map((cf: any) => ({

      q: cf.question,

      a: cf.answer,

      isDynamic: true

    }));

    return [...customList, ...defaultFaqs];

  }, [customFaqs, defaultFaqs]);



  // Dialog State

  const [chooserOpen, setChooserOpen] = useState(false);

  const [chooserMode, setChooserMode] = useState<"login" | "register">("login");



  const navigate = useNavigate();



  const hero3DRef = useRef<HTMLDivElement>(null);

  const isHero3DInView = useInView(hero3DRef, { once: false, margin: "-50px" });



  // Directory state
  const [topHarvesters, setTopHarvesters] = useState<any[]>([]);
  const [topOperators, setTopOperators] = useState<any[]>([]);
  const [dirLoading, setDirLoading] = useState(true);



  // Current user id for own-listing detection

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {

    const token = localStorage.getItem("tractorsewa_token");

    if (token) {

      fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })

        .then(res => res.ok ? res.json() : null)

        .then(data => { if (data) setCurrentUserId(data.id); })

        .catch(() => { });

    }

  }, []);
  // Fetch top rated harvesters and operators (max 4 of each, sorted by highest rating)
  useEffect(() => {
    const fetchTopRated = async () => {
      setDirLoading(true);
      try {
        const token = localStorage.getItem("tractorsewa_token");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Fetch 4 harvesters sorted by ratingHighest
        const harvRes = await fetch(`/api/harvesters?limit=4&sortBy=ratingHighest`, { headers });
        let fetchedHarvesters: any[] = [];
        if (harvRes.ok) {
          const data = await harvRes.json();
          fetchedHarvesters = data.map((item: any) => ({
            ...item,
            id: item.id,
            name: item.machineName,
            subtitle: item.ownerName,
            image: getFirstImage(item.imagePath),
            ownerImage: item.ownerProfilePic,
            type: "harvester",
            ownerId: item.userId,
          }));
        }

        // Fetch 4 operators sorted by ratingHighest
        const opRes = await fetch(`/api/operators?limit=4&sortBy=ratingHighest`, { headers });
        let fetchedOperators: any[] = [];
        if (opRes.ok) {
          const data = await opRes.json();
          fetchedOperators = data.map((item: any) => ({
            ...item,
            id: item.id,
            name: item.name,
            subtitle: item.name,
            image: item.image_path,
            ownerImage: item.image_path,
            type: "operator",
            ownerId: item.user_id,
          }));
        }

        // Consistent client sorting fallback (avgRating DESC -> ratingCount DESC -> id DESC)
        const clientSort = (list: any[]) => {
          return [...list].sort((a, b) => {
            const ratingDiff = parseFloat(b.avgRating || "0") - parseFloat(a.avgRating || "0");
            if (ratingDiff !== 0) return ratingDiff;
            const countDiff = parseInt(b.ratingCount || "0") - parseInt(a.ratingCount || "0");
            if (countDiff !== 0) return countDiff;
            return String(b.id).localeCompare(String(a.id));
          });
        };

        setTopHarvesters(clientSort(fetchedHarvesters).slice(0, 4));
        setTopOperators(clientSort(fetchedOperators).slice(0, 4));
      } catch (err) {
        console.error("Error loading top rated profiles:", err);
      } finally {
        setDirLoading(false);
      }
    };

    fetchTopRated();
  }, []);



  useEffect(() => {

    const fetchData = async () => {

      try {

        const opsRes = await fetch('/api/operators?limit=4');

        if (opsRes.ok) {

          const opsData = await opsRes.json();

          setOperators(opsData);

        }



        const harvsRes = await fetch('/api/harvesters?limit=4');

        if (harvsRes.ok) {

          const harvsData = await harvsRes.json();

          setHarvesters(harvsData);

        }



        const blogsRes = await fetch('/api/blogs?limit=3');

        if (blogsRes.ok) {

          const blogsData = await blogsRes.json();

          setBlogs(blogsData);

        }



        const faqsRes = await fetch('/api/faqs/active', { cache: 'no-store' });

        if (faqsRes.ok) {

          const faqsData = await faqsRes.json();

          setCustomFaqs(faqsData);

        }

      } catch {

        /* network error – server likely unreachable */

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, []);



  useEffect(() => {

    if (window.location.hash) {

      const id = window.location.hash.substring(1);

      setTimeout(() => {

        const element = document.getElementById(id);

        if (element) {

          element.scrollIntoView({ behavior: "smooth" });

        }

      }, 150);

    }

  }, []);





  const [activePersona, setActivePersona] = useState<'farmer' | 'operator'>('farmer');

  const [, setExpandedStep] = useState<number | null>(null);







  const personaSteps = {

    farmer: [

      {

        num: "01", icon: <Users size={22} />, title: t("landing.persona.farmer.s1.title"),

        desc: t("landing.persona.farmer.s1.desc"),

        detail: t("landing.persona.farmer.s1.detail"),

        color: "from-blue-600 to-blue-800",

        videoUrl: "/videos/farmer_registration.mp4",

      },

      {

        num: "02", icon: <MapPin size={22} />, title: t("landing.persona.farmer.s2.title"),

        desc: t("landing.persona.farmer.s2.desc"),

        detail: t("landing.persona.farmer.s2.detail"),

        color: "from-amber-500 to-orange-600",

        videoUrl: "/videos/post_requirement.mp4",

      },

      {

        num: "03", icon: <Search size={22} />, title: t("landing.persona.farmer.s3.title"),

        desc: t("landing.persona.farmer.s3.desc"),

        detail: t("landing.persona.farmer.s3.detail"),

        color: "from-green-500 to-green-700",

        videoUrl: "/videos/browse_matches.mp4",

      },

      {

        num: "04", icon: <Wheat size={22} />, title: t("landing.persona.farmer.s4.title"),

        desc: t("landing.persona.farmer.s4.desc"),

        detail: t("landing.persona.farmer.s4.detail"),

        color: "from-[#172263] to-[#0f174d]",

        videoUrl: "/videos/connect_harvested.mp4",

      },

    ],

    operator: [

      {

        num: "01", icon: <Users size={22} />, title: t("landing.persona.operator.s1.title"),

        desc: t("landing.persona.operator.s1.desc"),

        detail: t("landing.persona.operator.s1.detail"),

        color: "from-blue-600 to-blue-800",

        videoUrl: "/videos/farmer_registration.mp4",

      },

      {

        num: "02", icon: <Star size={22} />, title: t("landing.persona.operator.s2.title"),

        desc: t("landing.persona.operator.s2.desc"),

        detail: t("landing.persona.operator.s2.detail"),

        color: "from-amber-500 to-orange-600",

        videoUrl: "/videos/post_requirement.mp4",

      },

      {

        num: "03", icon: <BarChart3 size={22} />, title: t("landing.persona.operator.s3.title"),

        desc: t("landing.persona.operator.s3.desc"),

        detail: t("landing.persona.operator.s3.detail"),

        color: "from-green-500 to-green-700",

        videoUrl: "/videos/browse_matches.mp4",

      },

      {

        num: "04", icon: <Wheat size={22} />, title: t("landing.persona.operator.s4.title"),

        desc: t("landing.persona.operator.s4.desc"),

        detail: t("landing.persona.operator.s4.detail"),

        color: "from-[#172263] to-[#0f174d]",

        videoUrl: "/videos/connect_harvested.mp4",

      },

    ],

  };



  const features = [

    {

      icon: Search,

      title: t("landing.featureList.f1.title", { defaultValue: "Operator Search" }),

      desc: t("landing.featureList.f1.desc", { defaultValue: "Find verified operators by location, experience & machine type." }),

      videoUrl: "/videos/operator_search.mp4",

      colSpan: "md:col-span-4",

    },

    {

      icon: Tractor,

      title: t("landing.featureList.f2.title", { defaultValue: "Harvester Directory" }),

      desc: t("landing.featureList.f2.desc", { defaultValue: "Browse machines from all major brands across India." }),

      videoUrl: "/videos/harvester_directory.mp4",

      colSpan: "md:col-span-8",

    },

    {

      icon: MessageSquare,

      title: t("landing.featureList.f3.title", { defaultValue: "Direct Messaging" }),

      desc: t("landing.featureList.f3.desc", { defaultValue: "Connect directly without middlemen or brokers." }),

      videoUrl: "/videos/direct_messaging.mp4",

      colSpan: "md:col-span-6",

    },

    {

      icon: CheckCircle,

      title: t("landing.featureList.f4.title", { defaultValue: "Availability Tracking" }),

      desc: t("landing.featureList.f4.desc", { defaultValue: "Real-time availability status for every operator." }),

      videoUrl: "/videos/availability_tracking.mp4",

      colSpan: "md:col-span-6",

    },

    {

      icon: Filter,

      title: t("landing.featureList.f5.title", { defaultValue: "Requirements Board" }),

      desc: t("landing.featureList.f5.desc", { defaultValue: "Post your seasonal requirements and get applications." }),

      videoUrl: "/videos/requirements_board.mp4",

      colSpan: "md:col-span-8",

    },

    {

      icon: MapPin,

      title: t("landing.featureList.f6.title", { defaultValue: "Location Filters" }),

      desc: t("landing.featureList.f6.desc", { defaultValue: "Pinpoint operators in your district, state or region." }),

      videoUrl: "/videos/location_filters.mp4",

      colSpan: "md:col-span-4",

    },

  ];



  return (

    <div className="min-h-screen bg-[#ffffff]">

      <main className="relative z-10 bg-[#ffffff] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-b-3xl">

        <Navbar variant="public" />



        {/* ---- HERO & STATS WRAPPER ---- */}

        <div className="flex flex-col min-h-[calc(100vh-64px)]">

          {/* ---- HERO ---- */}

          <section className="relative flex-1 overflow-hidden pt-4 pb-12 md:pt-6 md:pb-16 flex items-center">

            {/* Background Image with elegant overlay */}

            <div

              className="absolute inset-0 z-0 bg-[url('/landing-bg.jpg')] bg-cover bg-center bg-no-repeat"

            />

            {/* Soft responsive gradient overlay to blend and keep text legible */}

            <div

              className="absolute inset-0 z-0 bg-gradient-to-b md:bg-gradient-to-r from-white/88 via-white/70 to-white/55 md:to-transparent"

            />



            {!isMobilePWA && webglSupported && (
              <div ref={hero3DRef} className="absolute inset-y-0 right-0 md:translate-x-12 w-full md:w-1/2 z-0 opacity-80">
                {isHero3DInView ? <Tractor3DCanvas /> : <div className="w-full h-full bg-transparent" />}
              </div>
            )}



            <WheatWatermark className="right-10 top-10 z-0" />

            <WheatWatermark className="left-5 bottom-10 z-0" />



            <div className="relative z-10 w-full mx-auto px-4 sm:px-6 grid md:grid-cols-5 gap-12 items-center pointer-events-none -mt-10">

              {/* Left */}

              <motion.div

                className="md:col-span-3 pointer-events-auto"

                initial={{ opacity: 0, y: 30 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ duration: 0.7 }}

              >

                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100/40 text-[#172263] border border-blue-200/40 rounded-full text-xs font-semibold tracking-wide mb-6">
                  {t("landing.agriNetworkBadge", { ns: "pages", defaultValue: "India's Multi-Brand Harvesting Hub for Farm Machinery" })}
                </span>

                <h1
                  className="text-5xl md:text-[56px] leading-[1.1] text-slate-900 font-extrabold tracking-tight mb-4"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {t("landing.title", { ns: "pages" })}
                </h1>

                <p className="text-[#57585A] text-lg font-normal mb-8 max-w-xl">
                  {t("landing.subtitle", { ns: "pages" })}
                </p>

                {/* Buttons Container */}
                <div className="flex flex-col gap-3 mb-8">

                  {/* Row 1: Dashboard + Harvester */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-6 py-3.5 bg-[#172263] text-white rounded-2xl hover:bg-[#11194A] hover:shadow-lg transition-all duration-200 cursor-pointer text-sm font-semibold"
                    >
                      {t("landing.goToDashboard", { ns: "pages", defaultValue: "Go to Dashboard" })} <ArrowRight size={16} />
                    </Link>
                    {localStorage.getItem("tractorsewa_token") ? (
                      <Link
                        to="/harvesters"
                        className="flex items-center gap-2 px-6 py-3.5 border border-[#172263] text-[#172263] bg-white hover:bg-slate-50 transition-all rounded-2xl text-sm font-semibold"
                      >
                        <Tractor size={16} className="text-[#172263]" /> {t("landing.imHarvester", { ns: "pages", defaultValue: "I'm a Harvester" })}
                      </Link>
                    ) : (
                      <Link
                        to="/harvesters"
                        onClick={() => { localStorage.setItem("tractorsewa_preview_mode", "true"); }}
                        className="flex items-center gap-2 px-6 py-3.5 border border-[#172263] text-[#172263] bg-white hover:bg-slate-50 transition-all rounded-2xl text-sm font-semibold"
                      >
                        <Tractor size={16} className="text-[#172263]" /> {t("landing.imHarvester", { ns: "pages", defaultValue: "I'm a Harvester" })}
                      </Link>
                    )}
                  </div>

                  {/* Row 2: Operator + Submit Enquiry */}
                  <div className="flex flex-wrap items-center gap-4">
                    {localStorage.getItem("tractorsewa_token") ? (
                      <Link
                        to="/operators"
                        className="flex items-center gap-2 px-6 py-3.5 border border-[#172263] text-[#172263] bg-white hover:bg-slate-50 transition-all rounded-2xl text-sm font-semibold"
                      >
                        <User size={16} className="text-[#172263]" /> {t("landing.imOperator", { ns: "pages", defaultValue: "I'm an Operator" })}
                      </Link>
                    ) : (
                      <Link
                        to="/operators"
                        onClick={() => { localStorage.setItem("tractorsewa_preview_mode", "true"); }}
                        className="flex items-center gap-2 px-6 py-3.5 border border-[#172263] text-[#172263] bg-white hover:bg-slate-50 transition-all rounded-2xl text-sm font-semibold"
                      >
                        <User size={16} className="text-[#172263]" /> {t("landing.imOperator", { ns: "pages", defaultValue: "I'm an Operator" })}
                      </Link>
                    )}
                    <Link
                      to="/enquiry"
                      className="flex items-center gap-2 px-6 py-3.5 bg-[#172263] text-white rounded-2xl hover:bg-[#11194A] hover:shadow-lg transition-all duration-200 cursor-pointer text-sm font-semibold"
                    >
                      {t("landing.submitEnquiry", { ns: "pages", defaultValue: "Submit Enquiry" })} <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                {/* Row 3 - Checkmarks list below enquiry button */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#57585A] mt-8">
                  {[
                    t("landing.freeToJoin", { ns: "pages", defaultValue: "Free to Join" }),
                    t("landing.verifiedProfiles", { ns: "pages", defaultValue: "Verified Profiles" }),
                    t("landing.cities", { ns: "pages", defaultValue: "50+ Cities" })
                  ].map((badge) => (
                    <span key={badge} className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full border border-green-200 bg-green-50 text-green-600">
                        <svg className="w-3 h-3 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="font-medium text-[#57585A]">{badge}</span>
                    </span>
                  ))}
                </div>

              </motion.div>

              {/* Right Floating Stats (Over the 3D Tractor) */}
              <div className="md:col-span-2 relative h-[400px] w-full pointer-events-none hidden md:block">
                {/* Top Right Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute top-10 right-0 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl px-5 py-3 border border-slate-100/80 flex items-center gap-3"
                >
                  <div className="bg-green-50 p-2.5 rounded-full flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">{t("landing.activeOperators", { ns: "pages", defaultValue: "500+ Operators" })}</p>
                    <p className="text-[#57585A] text-xs">{t("landing.onlineNow", { ns: "pages", defaultValue: "Online Now" })}</p>
                  </div>
                </motion.div>

                {/* Bottom Left Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="absolute bottom-20 -left-32 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl px-5 py-3 border border-slate-100/80 flex items-center gap-3"
                >
                  <div className="bg-blue-50 p-2.5 rounded-full flex items-center justify-center">
                    <Star size={18} className="text-blue-500 fill-blue-500/10" />
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">{t("landing.topRated", { ns: "pages", defaultValue: "Top Rated" })}</p>
                    <p className="text-[#57585A] text-xs">{t("landing.verifiedProfiles", { ns: "pages", defaultValue: "Verified Profiles" })}</p>
                  </div>
                </motion.div>

                {/* Bottom Right Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  className="absolute bottom-5 right-10 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl px-5 py-3 border border-slate-100/80 flex items-center gap-3"
                >
                  <div className="bg-orange-50 p-2.5 rounded-full flex items-center justify-center">
                    <Wheat size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">{t("landing.multipleCrops", { ns: "pages", defaultValue: "Multiple Crops" })}</p>
                    <p className="text-[#57585A] text-xs">{t("landing.wheatRice", { ns: "pages", defaultValue: "Wheat, Rice & more" })}</p>
                  </div>
                </motion.div>
              </div>

            </div>

          </section>



          {/* ---- STATS BAR ---- */}

          <section className="bg-[#172263] py-3 shrink-0">

            <div className="w-full mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

              {[

                { num: 500, label: t("landing.stats.operatorsRegistered", { ns: "pages", defaultValue: "Operators Registered" }) },

                { num: 200, label: t("landing.stats.harvestersListed", { ns: "pages", defaultValue: "Harvesters Listed" }) },

                { num: 50, label: t("landing.stats.citiesCovered", { ns: "pages", defaultValue: "Cities Covered" }) },

                { num: 1000, label: t("landing.stats.connectionsMade", { ns: "pages", defaultValue: "Connections Made" }) },

              ].map((s) => (

                <motion.div

                  key={s.label}

                  initial={{ opacity: 0, y: 20 }}

                  whileInView={{ opacity: 1, y: 0 }}

                  viewport={{ once: false, amount: 0.5 }}

                  transition={{ duration: 0.5 }}

                >

                  <div className="text-white text-4xl mb-1 flex items-center justify-center gap-0" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>

                    <CountUp from={0} to={s.num} duration={2} />+

                  </div>

                  <p className="text-blue-100 text-sm uppercase tracking-widest">{s.label}</p>

                </motion.div>

              ))}

            </div>

          </section>

        </div>



        <section id="directory" className="pt-16 pb-10 bg-gradient-to-b from-slate-50 to-white border-t border-b border-slate-100">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6">

            {/* Section Header */}
            <div className="text-center mb-8">
              <h2
                className="text-4xl text-[#1A1A1A] mb-4"
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
              >
                {t("landing.directory.title", { ns: "pages", defaultValue: "Find Harvesters & Operators Near You" })}
              </h2>
              <p className="text-[#57585A] max-w-xl mx-auto text-base">
                {t("landing.directory.subtitle", { ns: "pages", defaultValue: "Direct connect with verified equipment owners and professionals without middlemen." })}
              </p>
            </div>

            <div className="space-y-10">
              {/* Harvesters Sub-section */}
              <div>
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-2.5">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800 font-sora flex items-center gap-2.5" style={{ fontFamily: "'Sora', sans-serif" }}>
                    <span className="text-[#172263]"><Tractor size={22} className="inline-block" /></span> {t("landing.directory.topHarvesters", { ns: "pages", defaultValue: "Top Rated Harvesters" })}
                  </h3>
                </div>

                {dirLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                    {Array(4).fill(0).map((_, i) => (
                      <DirectorySkeletonCard key={i} />
                    ))}
                  </div>
                ) : topHarvesters.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100 max-w-md mx-auto px-6">
                    <p className="text-slate-500 text-sm font-medium">No harvesters found.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                      {topHarvesters.map((item) => (
                        <ProfileCard key={item.id} item={item} currentUserId={currentUserId} t={t} />
                      ))}
                    </div>

                    <div className="text-center mt-6">
                      <Link
                        to="/harvesters"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 hover:border-[#172263] hover:text-[#172263] rounded-xl text-sm font-bold transition-all shadow-xs hover:shadow-sm"
                      >
                        {t("landing.directory.exploreMore", { ns: "pages", defaultValue: "View All Harvesters" })} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Operators Sub-section */}
              <div>
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-2.5">
                  <h3 className="text-xl md:text-2xl font-bold text-[#1A1A1A] font-sora flex items-center gap-2.5" style={{ fontFamily: "'Sora', sans-serif" }}>
                    <span className="text-[#15803D]"><Users size={22} className="inline-block" /></span> {t("landing.directory.topOperators", { ns: "pages", defaultValue: "Top Rated Operators" })}
                  </h3>
                </div>

                {dirLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                    {Array(4).fill(0).map((_, i) => (
                      <DirectorySkeletonCard key={i} />
                    ))}
                  </div>
                ) : topOperators.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100 max-w-md mx-auto px-6">
                    <p className="text-slate-500 text-sm font-medium">No operators found.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                      {topOperators.map((item) => (
                        <ProfileCard key={item.id} item={item} currentUserId={currentUserId} t={t} />
                      ))}
                    </div>

                    <div className="text-center mt-6">
                      <Link
                        to="/operators"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 hover:border-[#172263] hover:text-[#172263] rounded-xl text-sm font-bold transition-all shadow-xs hover:shadow-sm"
                      >
                        {t("landing.directory.exploreMore", { ns: "pages", defaultValue: "View All Operators" })} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---- SERVICING ENQUIRY SECTION ---- */}
        <ServicingEnquirySection />

        {!isMobilePWA && (
          <section id="features" className="py-20 bg-gradient-to-br from-[#F4F6FA] to-[#F4F6FA]">

            <div className="w-full mx-auto px-4 sm:px-6">

              <div className="text-center mb-14">

                <h2

                  className="text-4xl text-[#1A1A1A] mb-3"

                  style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}

                >

                  {t("landing.features", { ns: "pages" })}

                </h2>

                <p className="text-[#57585A] max-w-xl mx-auto">

                  {t("landing.featuresSub", { ns: "pages", defaultValue: "Built for the realities of Indian agricultural workflow — field-tested, farmer-approved." })}

                </p>

              </div>

              <div className="grid gap-6 grid-cols-1 md:grid-cols-12 max-w-6xl mx-auto">

                {features.map((feature, index) => {

                  const Icon = feature.icon;

                  return (

                    <motion.div

                      key={index}

                      initial={{ opacity: 0, y: 24 }}

                      whileInView={{ opacity: 1, y: 0 }}

                      whileHover={{ y: -6, scale: 1.01 }}

                      viewport={{ once: true, amount: 0.1 }}

                      transition={{ type: "spring", stiffness: 180, damping: 18, delay: index * 0.05 }}

                      className={cn(

                        "group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 backdrop-blur-md p-8 shadow-[0_18px_50px_rgba(15,23,42,0.02)] transition-all duration-300 hover:shadow-[0_22px_60px_rgba(23,34,99,0.06)] hover:border-[#172263]/20 flex flex-col justify-between min-h-[240px]",

                        feature.colSpan

                      )}

                    >

                      {/* Background Video */}

                      <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem] pointer-events-none bg-slate-50">

                        <VideoBackground src={feature.videoUrl} />

                        {/* Gradient Overlay for Text Readability */}

                        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent z-10" />

                      </div>

                      {/* Content */}

                      <div className="relative z-20 flex flex-col h-full justify-between">

                        <div>

                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100/90 text-slate-900 shadow-xs group-hover:bg-[#172263] group-hover:text-white transition-all duration-300">

                            <Icon size={24} className="transition-transform duration-300 group-hover:scale-105" />

                          </div>

                          <h3 className="mt-6 text-xl font-bold text-slate-950 font-sora group-hover:text-[#172263] transition-colors duration-300" style={{ fontFamily: "'Sora', sans-serif" }}>

                            {feature.title}

                          </h3>

                          <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-xl">{feature.desc}</p>

                        </div>

                      </div>

                    </motion.div>

                  );

                })}

              </div>

            </div>

          </section>
        )}



        {!isMobilePWA && (
          <section id="how-it-works" className="py-20 w-full mx-auto px-4 sm:px-6 min-h-[calc(100vh-64px)] flex flex-col justify-center">

            {/* Header */}

            <div className="text-center mb-10">

              <h2 className="text-4xl text-[#1A1A1A] mb-3" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}>

                {t("landing.howItWorks", { ns: "pages", defaultValue: "How It Works" })}

              </h2>

              <p className="text-[#57585A] max-w-xl mx-auto mb-8">

                {t("landing.howItWorksSub", { ns: "pages", defaultValue: "A tailored journey for every person on the platform. Choose your role below." })}

              </p>



              {/* Persona Toggle */}

              <div className="inline-flex items-center bg-[#F4F6FA] border border-[#E2E8F0] rounded-2xl p-1.5 gap-1">

                {([

                  ['farmer', t("landing.persona.farmerTab", { ns: "pages", defaultValue: "🌾 I am a Farmer" })],

                  ['operator', t("landing.persona.operatorTab", { ns: "pages", defaultValue: "🚜 I am an Operator" })]

                ] as const).map(([key, label]) => (

                  <button

                    key={key}

                    onClick={() => { setActivePersona(key); setExpandedStep(null); }}

                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activePersona === key

                      ? 'bg-[#172263] text-white shadow-md scale-[1.02]'

                      : 'text-[#57585A] hover:text-[#172263] hover:bg-white'

                      }`}

                  >

                    {label}

                  </button>

                ))}

              </div>

            </div>



            {/* Steps Grid */}

            <motion.div

              key={activePersona}

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.4 }}

              className="grid md:grid-cols-4 gap-5 relative"

            >

              {personaSteps[activePersona].map((step, i) => (

                <motion.div

                  key={i}

                  initial={{ opacity: 0, y: 30 }}

                  animate={{ opacity: 1, y: 0 }}

                  transition={{ duration: 0.4, delay: i * 0.1 }}

                  className="relative z-10 group h-full"

                >

                  <div className="w-full h-full flex flex-col text-left rounded-2xl border border-[#E2E8F0] bg-white group-hover:border-[#172263]/50 group-hover:shadow-[0_8px_32px_rgba(23,34,99,0.13)] transition-all duration-300 overflow-hidden relative">

                    {/* Background Video */}

                    <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl pointer-events-none bg-slate-50">

                      <VideoBackground

                        src={step.videoUrl}

                        className={

                          activePersona === 'farmer' && step.num === '04'

                            ? 'absolute max-w-none'

                            : step.num === '04'

                              ? 'scale-[2] origin-center object-center'

                              : ''

                        }

                        style={

                          activePersona === 'farmer' && step.num === '04'

                            ? {

                              width: '200%',

                              height: '200%',

                              left: '-50%',

                              top: '-50%',

                              transform: 'none'

                            }

                            : undefined

                        }

                      />

                      {/* Semi-translucent White Overlay for Text Readability */}

                      <div className="absolute inset-0 bg-white/48 group-hover:bg-white/50 transition-colors duration-30 z-10" />

                    </div>



                    {/* Always-visible top content */}

                    <div className="p-5 flex-1 flex flex-col relative z-20">

                      <div className="flex justify-center mb-4">

                        <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 shrink-0`}>

                          <span className="text-white/70 text-[10px] font-bold mb-0.5">{step.num}</span>

                          <span className="text-white">{step.icon}</span>

                        </div>

                      </div>

                      <h3 className="text-[#1A1A1A] text-base text-center mb-1.5 group-hover:text-[#172263] transition-colors duration-300 shrink-0" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>

                        {step.title}

                      </h3>

                      <p className="text-[#57585A] text-sm leading-relaxed text-center flex-1">{step.desc}</p>



                      {/* Hover hint */}

                      <div className="flex items-center justify-center gap-1 mt-auto pt-3 text-xs font-semibold text-zinc-300 group-hover:opacity-0 transition-opacity duration-200 shrink-0">

                        {t("landing.hoverToLearnMore", { ns: "pages", defaultValue: "Hover to learn more ↓" })}

                      </div>

                    </div>



                    {/* Hover-reveal detail panel */}

                    <div className="max-h-0 group-hover:max-h-48 overflow-hidden transition-all duration-500 ease-in-out shrink-0 relative z-20">

                      <div className={`bg-gradient-to-br ${step.color} mx-3 mb-3 rounded-xl p-4`}>

                        <p className="text-white text-sm leading-relaxed">{step.detail}</p>

                      </div>

                    </div>

                  </div>

                </motion.div>

              ))}

            </motion.div>



            {/* CTA below steps */}

            <motion.div

              className="text-center mt-12"

              initial={{ opacity: 0 }}

              whileInView={{ opacity: 1 }}

              viewport={{ once: true }}

              transition={{ delay: 0.5 }}

            >

              <p className="text-sm text-zinc-500 mb-4">{t("landing.readyToGetStarted", { ns: "pages", defaultValue: "Ready to get started?" })}</p>

              <button

                onClick={() => { setChooserMode("register"); setChooserOpen(true); }}

                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#172263] text-white rounded-xl font-semibold hover:bg-[#11194A] transition-all shadow-[0_4px_14px_rgba(23,34,99,0.3)] hover:shadow-[0_6px_20px_rgba(23,34,99,0.4)] hover:-translate-y-0.5"

              >

                {t("landing.joinFree", { ns: "pages", defaultValue: "Join Free — It Takes 2 Minutes" })} <ArrowRight size={16} />

              </button>

            </motion.div>

          </section>
        )}









        {/* ---- BLOGS ---- */}

        <section className="py-20 w-full mx-auto px-4 sm:px-6">

          <div className="flex items-center justify-between mb-8">

            <h2

              className="text-3xl text-[#1A1A1A]"

              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}

            >

              {t("blogs.title", { ns: "pages" })}

            </h2>

            <Link to="/blogs" className="text-[#172263] text-sm font-medium hover:underline flex items-center gap-1">

              {t("buttons.viewAll", { ns: "common", defaultValue: "View All" })} <ArrowRight size={15} />

            </Link>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {loading

              ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)

              : blogs.slice(0, 3).map((b) => <BlogCard3D key={b.id} {...b} />)}

          </div>

          {blogs.length >= 3 && (

            <div className="text-center mt-10">

              <Link

                to="/blogs"

                className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:border-[#172263] hover:text-[#172263] transition-all shadow-sm hover:shadow cursor-pointer"

              >

                {t("landing.directory.exploreMore", { ns: "pages", defaultValue: "Explore More" })}

              </Link>

            </div>

          )}

        </section>



        {/* ---- FAQ SECTION ---- */}

        <section id="faq" className="pt-16 pb-12 scroll-mt-20 w-full mx-auto px-4 sm:px-6 bg-slate-50/50 border-t border-slate-100/80">

          <div className="w-full max-w-4xl mx-auto">

            <div className="text-center mb-8">

              <h2

                className="text-4xl text-[#1A1A1A] mb-3"

                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}

              >

                {t("landing.faq.title", { ns: "pages", defaultValue: "Frequently Asked Questions" })}

              </h2>

              <p className="text-[#57585A] max-w-xl mx-auto text-base">

                {t("landing.faq.subtitle", { ns: "pages", defaultValue: "Have questions? We have answers to help you get the most out of Tractor Seva." })}

              </p>

            </div>



            <div className="space-y-3">

              {(showAllFaqs ? allFaqs : allFaqs.slice(0, 6)).map((faq, idx) => {

                const isOpen = activeFaqIndex === idx;

                return (

                  <div

                    key={idx}

                    onMouseEnter={() => setActiveFaqIndex(idx)}

                    onMouseLeave={() => setActiveFaqIndex(null)}

                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden transform ${isOpen

                        ? 'border-[#172263]/30 shadow-[0_12px_32px_rgba(23,34,99,0.08)] -translate-y-0.5'

                        : 'border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#172263]/20'

                      }`}

                  >

                    <button

                      onClick={() => setActiveFaqIndex(isOpen ? null : idx)}

                      className={`flex items-center justify-between w-full py-4 px-5 font-semibold text-left cursor-pointer transition-colors duration-300 ${isOpen ? 'text-[#172263]' : 'text-slate-800 hover:text-[#172263]'

                        }`}

                      style={{ fontFamily: "'Sora', sans-serif" }}

                    >

                      <span>
                        {faq.isDynamic ? <DynamicText>{faq.q}</DynamicText> : faq.q}
                      </span>

                      <span className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180 text-[#172263]' : ''}`}>

                        <ChevronDown size={20} />

                      </span>

                    </button>



                    <div

                      className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-48 border-t border-slate-100 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'

                        }`}

                    >

                      <div className="p-5 text-sm text-[#57585A] leading-relaxed bg-slate-50/50">

                        {faq.isDynamic ? <DynamicText>{faq.a}</DynamicText> : faq.a}

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>



            {allFaqs.length > 6 && (

              <div className="text-center mt-4">

                <button

                  onClick={() => setShowAllFaqs(!showAllFaqs)}

                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#172263] hover:text-[#11194A] rounded-xl text-sm font-semibold transition-all cursor-pointer border border-[#E2E8F0] shadow-sm hover:border-[#172263]/20"

                >

                  {showAllFaqs ? (

                    <>{t("landing.faq.showLess", { ns: "pages", defaultValue: "Show Less" })} <ChevronDown className="rotate-180 transition-transform duration-300" size={16} /></>

                  ) : (

                    <>{t("landing.faq.viewMore", { ns: "pages", defaultValue: "View More Questions" })} ({allFaqs.length - 6}) <ChevronDown className="transition-transform duration-300" size={16} /></>

                  )}

                </button>

              </div>

            )}



            {/* Ask a Question CTA */}

            <div className="text-center mt-6">

              <Link

                to="/ask-question"

                className="inline-flex items-center gap-2 px-8 py-3 bg-[#172263] text-white rounded-xl font-semibold hover:bg-[#11194A] transition-all shadow-[0_4px_14px_rgba(23,34,99,0.2)] hover:-translate-y-0.5 cursor-pointer"

              >

                {t("landing.faq.askButton", { ns: "pages", defaultValue: "Ask a Question" })} <ArrowRight size={16} />

              </Link>

            </div>

          </div>

        </section>



      </main>



      {/* ---- FOOTER ---- */}

      <div id="contact">

        <CinematicFooter />

      </div>



      {/* Auth Chooser Dialog */}

      <AuthChooserDialog

        isOpen={chooserOpen}

        onClose={() => setChooserOpen(false)}

        initialMode={chooserMode}

      />

    </div>

  );

}


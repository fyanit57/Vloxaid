import React, { useState, useEffect, FormEvent } from "react";
import { useApp } from "./context/AppContext";
import { TEMPLATES, CATEGORIES, Template } from "./data/templates";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import AdminFeaturedModal from "./components/AdminFeaturedModal";
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  X, 
  Heart, 
  Layers, 
  Chrome, 
  Check, 
  Send, 
  Zap, 
  Monitor, 
  Menu,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  ExternalLink,
  Info,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeroSlide {
  id: number;
  image: string;
  ownerName: string;
  bizName: string;
  metricTitle: string;
  metricValue: string;
  badgeEmoji: string;
  revenue: string;
  revenueLabel: string;
  desc: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&h=875&q=80",
    ownerName: "Sarah Siregar",
    bizName: "Svara Tech Agency",
    metricTitle: "Store Growth",
    metricValue: "+24% Growth",
    badgeEmoji: "💹",
    revenue: "Rp12.450.000",
    revenueLabel: "Today's Revenue",
    desc: "Digital Agency & Tech Consultant",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&h=875&q=80",
    ownerName: "Budi Santoso",
    bizName: "Kopi Seduh Nusantara",
    metricTitle: "Monthly Orders",
    metricValue: "180+ Cup / Hari",
    badgeEmoji: "☕",
    revenue: "Rp4.820.000",
    revenueLabel: "Est. Daily Income",
    desc: "Cafe & Coffee Roastery",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&h=875&q=80",
    ownerName: "Amira Prasetyo",
    bizName: "Pesona Batik Studio",
    metricTitle: "Global Export",
    metricValue: "Export Ready",
    badgeEmoji: "📦",
    revenue: "Rp32.500.000",
    revenueLabel: "Weekly Turnover",
    desc: "Creative Boutique & Traditional Apparel",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?auto=format&fit=crop&w=700&h=875&q=80",
    ownerName: "Aris Munandar",
    bizName: "Dapur Rasa Selera",
    metricTitle: "Rating Kepuasan",
    metricValue: "4.9 ★ (2.5k Review)",
    badgeEmoji: "🍰",
    revenue: "Rp18.900.000",
    revenueLabel: "Weekend Sales",
    desc: "Premium Culinary & Artisan Catering",
  }
];

export default function App() {
  const { 
    user, 
    favorites, 
    toggleFavorite, 
    requestDomain, 
    isFirebaseActive,
    domainRequests,
    featuredTemplateIds,
    updateFeaturedTemplates,
    isAdmin,
    customTemplates,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
    importAllBaselineTemplates,
    quotaExceeded,
    quotaErrorMessage
  } = useApp();

  // Dialog / Modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [activeCategory, setActiveCategory] = useState("featured");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [domainAlert, setDomainAlert] = useState<string | null>(null);
  const [demoTemplate, setDemoTemplate] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Image Carousel Slide State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Chatbot Assistant state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Halo! Saya Asisten Virtual Vloxa. Ada yang bisa saya bantu terkait pembuatan website UMKM atau pencarian domain Anda hari ini?" }
  ]);

  // Handle Domain Search submission
  const handleDomainSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    if (!user) {
      setAuthTab("login");
      setIsAuthOpen(true);
      return;
    }

    try {
      let suffix = ".com";
      if (!domainInput.includes(".")) {
        suffix = ".com";
      }
      const rawDomain = domainInput.trim().toLowerCase();
      const domainName = rawDomain.includes(".") ? rawDomain : `${rawDomain}${suffix}`;

      await requestDomain(domainName);
      setDomainAlert(`Domain "${domainName}" berhasil disimpan di watchlist Anda! Admin Vloxa akan segera meninjau ketersediaannya.`);
      setDomainInput("");
      
      // Auto-scroll to dashboard
      const dashElement = document.getElementById("vloxa-dashboard");
      if (dashElement) {
        dashElement.scrollIntoView({ behavior: "smooth" });
      }

      setTimeout(() => setDomainAlert(null), 8000);
    } catch (err) {
      console.error(err);
      setDomainAlert("Terjadi kesalahan saat memeriksa domain. Coba kembali.");
    }
  };

  // Safe Interactive Choose template handler
  const handleChooseTemplate = (templateId: string) => {
    if (!user) {
      setAuthTab("register");
      setIsAuthOpen(true);
      return;
    }
    // Toggle favorite or auto-assign to user's virtual workspace
    toggleFavorite(templateId);
    
    // Smooth scroll to dashboard
    const dashElement = document.getElementById("vloxa-dashboard");
    if (dashElement) {
      dashElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Bot response logic
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const updated = [...chatMessages, { sender: "user" as const, text: userMsg }];
    setChatMessages(updated);
    setChatInput("");

    setTimeout(() => {
      let response = "Pertanyaan menarik! Tim spesialis Vloxa siap membantu Anda secara langsung. Saat ini Anda berada dalam antrean konsultasi gratis.";
      const queryLower = userMsg.toLowerCase();
      
      if (queryLower.includes("harga") || queryLower.includes("biaya") || queryLower.includes("bayar")) {
        response = "Sangat bersahabat! Paket website instan Vloxa dimulai hanya dengan Rp100rb per bulan, sudah mencakup hosting berkelas, kapasitas bandwidth unmetered, dan SSL gratis.";
      } else if (queryLower.includes("domain") || queryLower.includes("alamat")) {
        response = "Anda bisa memasukkan domain pilihan Anda di pencarian domain halaman utama kami. Sistem kami mendukung domain lokal (.id, .co.id) serta domain global (.com, .net, .xyz).";
      } else if (queryLower.includes("cara") || queryLower.includes("bikin") || queryLower.includes("buat")) {
        response = "Sangat praktis! Cukup daftarkan akun Anda secara aman, pilih salah satu ratusan template siap pakai kami di bawah, dan isi profil bisnis Anda di dashboard. Kami akan meluncurkannya saat itu juga.";
      } else if (queryLower.includes("fitur") || queryLower.includes("kelebihan")) {
        response = "Vloxa menawarkan server berkemampuan uptime 99.9%, integrasi database real-time Firebase, responsif ponsel cerdas, SEO dioptimalkan, serta dasbor instan yang ramah pemula.";
      }

      setChatMessages(prev => [...prev, { sender: "bot" as const, text: response }]);
    }, 700);
  };

  // Merge static baseline and loaded custom templates (deduplicate by id, prioritize custom edits)
  const customIds = new Set(customTemplates.map(t => t.id));
  const allTemplates = [
    ...customTemplates,
    ...TEMPLATES.filter(t => !customIds.has(t.id))
  ];

  // Filter templates: make custom templates from Firebase database part of the default "Template Pilihan" showcase
  const filteredTemplates = activeCategory === "featured" 
    ? [
        ...customTemplates,
        ...featuredTemplateIds
          .filter(id => !customIds.has(id))
          .map(id => allTemplates.find(t => t.id === id))
          .filter((t): t is Template => !!t)
      ]
    : allTemplates.filter(t => t.category === activeCategory);

  const currentDemoTemplate = allTemplates.find(t => t.title === demoTemplate);

  return (
    <div className="min-h-screen bg-neutral-50/30 flex flex-col antialiased">
      
      {/* Top Banner Accent */}
      <div className="bg-neutral-950 py-2 px-4 overflow-hidden relative border-b border-neutral-800">
        <div className="animate-marquee whitespace-nowrap text-xs font-bold text-white flex items-center gap-8 py-0.5">
          <span className="inline-flex items-center gap-1.5 uppercase font-extrabold tracking-wider shrink-0">
            <Zap className="h-3.5 w-3.5 fill-[#dbef1a] text-[#dbef1a]" />
            DISKON HINGGA 50% untuk paket tahunan — Kembangkan UMKM Digital Anda
          </span>
          <span className="text-neutral-500 block shrink-0">|</span>
          <span className="inline-flex items-center gap-1 shrink-0">
            Dapatkan Free Domain <span className="text-[#dbef1a] font-extrabold">.my.id / .web.id</span> dan Cloud Hosting Indonesia Premium Hari Ini!
          </span>
          <span className="text-neutral-500 shrink-0">|</span>
          {/* Duplicates to repeat for continuous scroll flow without blank spaces */}
          <span className="inline-flex items-center gap-1.5 uppercase font-extrabold tracking-wider shrink-0">
            <Zap className="h-3.5 w-3.5 fill-[#dbef1a] text-[#dbef1a] animate-pulse" />
            DISKON HINGGA 50% untuk paket tahunan — Kembangkan UMKM Digital Anda
          </span>
          <span className="text-neutral-500 shrink-0">|</span>
          <span className="inline-flex items-center gap-1 shrink-0">
            Dapatkan Free Domain <span className="text-[#dbef1a] font-extrabold">.my.id / .web.id</span> dan Cloud Hosting Indonesia Premium Hari Ini!
          </span>
          <span className="text-neutral-500 shrink-0">|</span>
        </div>
      </div>

      {/* Main Glass Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Vloxa */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <svg viewBox="0 0 100 100" className="h-9 w-9" fill="none">
              <path 
                d="M 26,12 L 50,36 L 74,12" 
                stroke="#dbef1a" 
                strokeWidth="14" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d="M 26,88 L 50,64 L 74,88" 
                stroke="#dbef1a" 
                strokeWidth="14" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d="M 12,26 L 36,50 L 12,74" 
                stroke="#dbef1a" 
                strokeWidth="14" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d="M 88,26 L 64,50 L 88,74" 
                stroke="#dbef1a" 
                strokeWidth="14" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <span className="font-display text-2xl font-black tracking-tight text-neutral-900">
              Vloxa
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-600">
            <a href="#hero" className="hover:text-neutral-900 transition-colors">Home</a>
            <a href="#templates-section" className="hover:text-[#dbef1a] md:hover:text-neutral-900 transition-colors">Template</a>
            <a href="#paket-website" className="hover:text-neutral-900 transition-colors">Paket Website</a>
            <a href="#about-section" className="hover:text-neutral-900 transition-colors">About</a>
            <a href="#footer" className="hover:text-neutral-900 transition-colors" onClick={() => setIsChatOpen(true)}>Kontak</a>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <a 
                href="#vloxa-dashboard"
                className="text-sm font-bold text-neutral-700 hover:text-neutral-950 transition-colors px-3 py-1.5"
              >
                Dashboard
              </a>
            ) : (
              <button 
                onClick={() => { setAuthTab("login"); setIsAuthOpen(true); }}
                className="text-sm font-bold text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer px-3 py-1.5"
              >
                Login
              </button>
            )}

            <button 
              onClick={() => { 
                if (user) {
                  const dash = document.getElementById("vloxa-dashboard");
                  if (dash) dash.scrollIntoView({ behavior: "smooth" });
                } else {
                  setAuthTab("register"); 
                  setIsAuthOpen(true); 
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#dbef1a] px-5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-[#cbdc10] transition-colors shadow-2xs cursor-pointer"
            >
              Get Started
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Action */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-neutral-700 hover:text-neutral-900 p-1.5 rounded-lg cursor-pointer"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden mt-4 bg-white rounded-xl border border-neutral-100"
            >
              <div className="p-4 space-y-4 flex flex-col text-sm font-semibold text-neutral-600">
                <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Home</a>
                <a href="#templates-section" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Template</a>
                <a href="#paket-website" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Paket Website</a>
                <a href="#about-section" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">About</a>
                <a href="#footer" onClick={() => { setMobileMenuOpen(false); setIsChatOpen(true); }} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Kontak</a>
                <div className="border-t pt-4 flex gap-3">
                  {user ? (
                    <a
                      href="#vloxa-dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center flex-1 py-2.5 rounded-xl border border-neutral-200 font-bold text-neutral-700 text-xs"
                    >
                      Dashboard
                    </a>
                  ) : (
                    <button
                      onClick={() => { setMobileMenuOpen(false); setAuthTab("login"); setIsAuthOpen(true); }}
                      className="flex-1 py-1 px-3 rounded-xl border border-neutral-200 font-bold text-neutral-700 text-xs cursor-pointer"
                    >
                      Login
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (user) {
                        const d = document.getElementById("vloxa-dashboard");
                        if (d) d.scrollIntoView({ behavior: "smooth" });
                      } else {
                        setAuthTab("register");
                        setIsAuthOpen(true);
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#dbef1a] text-center font-bold text-neutral-900 text-xs cursor-pointer"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Body */}
      <main className="flex-1">

        {/* Firebase Firestore Quota Limit Exceeded Banner */}
        {quotaExceeded && (
          <div id="firestore-quota-alert" className="max-w-7xl mx-auto mt-6 px-6">
            <div className="bg-[#fff9e6] border border-[#ffe082] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between text-neutral-800">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-[#ffe082]/20 border border-[#ffe082]/80 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-[#b78103] text-base leading-tight">
                    Firestore Database Read Quota Exceeded (Free Tier Spark Plan)
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-semibold">
                    Aplikasi saat ini telah mendeteksi batas kuota baca harian Firebase Anda yang terlampaui. Google Firebase membatasi pembacaan harian untuk Spark Plan sebesar 50.000 dokumen.
                  </p>
                  
                  <div className="bg-white/60 rounded-xl p-4 border border-amber-200/50 space-y-1.5 text-xs text-neutral-600 font-semibold leading-relaxed">
                    <p className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cbdc10]" />
                      Kuota harian Anda akan kembali di-reset secara otomatis pada <strong className="text-neutral-800">hari esok</strong>.
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cbdc10]" />
                      Informasi penggunaan kuota selengkapnya dapat Anda saksikan di tabel <strong className="text-neutral-800">Spark Plan (Enterprise edition)</strong> di <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noopener noreferrer" className="text-[#a47200] underline inline-flex items-center gap-0.5 hover:text-neutral-900 transition-colors">Firebase Pricing <ExternalLink className="h-3 w-3" /></a>.
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#cbdc10]" />
                      Untuk melanjutkan pengembangan atau pengujian tanpa batasan, silakan buka <a href="https://console.firebase.google.com/project/gen-lang-client-0485248882/firestore/databases/ai-studio-da1e2927-a704-46ab-9073-897d46ac2f0e/data?openUpgradeDialog=true" target="_blank" rel="noopener noreferrer" className="text-[#a47200] underline inline-flex items-center gap-0.5 hover:text-neutral-900 transition-colors">Upgrades Dashboard Project Anda <ExternalLink className="h-3 w-3" /></a>.
                    </p>
                  </div>
                  
                  <p className="text-xs text-neutral-500 font-medium italic">
                    💡 <strong>Sistem Berhasil Me-rescue Sesi Anda:</strong> Vloxa secara cerdas mengalihkan penyimpanan data Anda ke <strong>Sesi Offline Terlokalisasi (Browser Local Cache)</strong> secara real-time. Anda masih sangat aman untuk melakukan eksplorasi portofolio, memodifikasi profil UMKM, dan memantau draf watchlist domain Anda saat ini!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Landing Section */}
        <section id="hero" className="relative py-12 md:py-24 px-6 overflow-hidden bg-grid-dots">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Hero text & controls (Left column) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Pillar Badge */}
              <div className="inline-flex items-center gap-2 bg-neutral-900/5 hover:bg-neutral-900/10 border border-neutral-900/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-neutral-800 transition-colors">
                <span className="h-2 w-2 rounded-full bg-[#dbef1a]" />
                DIGITAL SOLUTIONS FOR UMKM
              </div>

              {/* Catchy Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.12]">
                Website Siap Jualan Mulai{" "}
                <span className="relative inline-block z-10 font-bold text-neutral-900 px-1">
                  Rp350 Ribu
                  <span className="absolute left-0 right-0 bottom-1 h-3 bg-[#dbef1a] -z-10 transform -rotate-1 skew-x-3 rounded-xs" />
                </span>
              </h1>

              {/* Subheading text */}
              <p className="text-base sm:text-lg text-neutral-600 font-medium max-w-xl leading-relaxed">
                Pilih template profesional, tampil lebih terpercaya, dan mulai dapatkan pelanggan secara online.
              </p>

              {/* Interactive CTA Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("templates-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center justify-between gap-1.5 px-3 py-3 bg-neutral-950 text-white rounded-2xl text-[11px] sm:text-xs font-black shadow-xs hover:bg-[#cbdc10] hover:text-neutral-950 transition-all cursor-pointer group"
                >
                  <span>Lihat Template</span>
                  <span className="bg-[#dbef1a] group-hover:bg-neutral-950 group-hover:text-[#dbef1a] rounded-full h-4.5 w-4.5 flex items-center justify-center text-neutral-900 transition-colors shrink-0">
                    <CheckSquare className="h-2.5 w-2.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("templates-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center justify-between gap-1.5 px-3 py-3 bg-white border border-neutral-250 text-neutral-900 rounded-2xl text-[11px] sm:text-xs font-black hover:border-neutral-400 transition-all cursor-pointer group"
                >
                  <span>Pilih Desain</span>
                  <span className="bg-neutral-100 rounded-full h-4.5 w-4.5 flex items-center justify-center text-neutral-500 transition-colors shrink-0">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setChatInput("Saya ingin konsultasi gratis mengenai pembuatan website bisnis siap jualan di Vloxa.");
                    const el = document.getElementById("vloxa-dashboard") || document.getElementById("hero");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center justify-between gap-1.5 px-3 py-3 bg-[#dbef1a] text-neutral-950 rounded-2xl text-[11px] sm:text-xs font-black hover:bg-[#cbdc10] transition-colors cursor-pointer group"
                >
                  <span>Konsultasi Gratis</span>
                  <span className="bg-neutral-950 rounded-full h-4.5 w-4.5 flex items-center justify-center text-white transition-colors shrink-0">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("paket-website");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center justify-between gap-1.5 px-3 py-3 bg-white border border-neutral-250 text-neutral-900 rounded-2xl text-[11px] sm:text-xs font-black hover:border-neutral-400 transition-all cursor-pointer group"
                >
                  <span>Mulai Sekarang</span>
                  <span className="bg-neutral-900 text-white rounded-full h-4.5 w-4.5 flex items-center justify-center transition-colors shrink-0">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Search Domain Input bar */}
              <form onSubmit={handleDomainSearch} className="max-w-xl">
                <div className="relative flex items-center p-1.5 rounded-2xl bg-white border border-neutral-200 shadow-lg focus-within:ring-2 focus-within:ring-[#dbef1a] hover:border-neutral-300 transition-all gap-2">
                  <div className="flex items-center pl-3 text-neutral-400 shrink-0">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Cari domain impian Anda... cth: kopimakmur"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none text-neutral-900 py-2.5 font-medium"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#dbef1a] px-6 py-2.5 text-xs sm:text-sm font-extrabold text-neutral-900 hover:bg-[#cbdc10] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    Cari Domain
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 px-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-[10px] font-black text-emerald-800 border border-emerald-200 shrink-0 select-none">
                    PROMO GRATIS
                  </span>
                  <span className="text-xs text-neutral-500 font-semibold leading-relaxed">
                    Dapatkan domain gratis <span className="text-neutral-900 font-extrabold underline decoration-[#dbef1a] decoration-2 underline-offset-2">.my.id</span> atau <span className="text-neutral-900 font-extrabold underline decoration-[#dbef1a] decoration-2 underline-offset-2">.web.id</span> khusus untuk seluruh pendaftaran paket website!
                  </span>
                </div>
              </form>

              {/* Notification of search */}
              <AnimatePresence>
                {domainAlert && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-start gap-2.5"
                  >
                    <CheckSquare className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <p className="font-semibold leading-relaxed">{domainAlert}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live Statistics Counters */}
              <div className="flex items-center gap-10 border-t border-neutral-200 pt-8 max-w-lg">
                <div>
                  <h4 className="font-display text-2xl font-black text-neutral-900">15k+</h4>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-0.5">UMKM Aktif</p>
                </div>
                <div className="h-8 w-px bg-neutral-200" />
                <div>
                  <h4 className="font-display text-2xl font-black text-neutral-900">99.9%</h4>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-0.5">Uptime Server</p>
                </div>
              </div>

            </div>

            {/* Immersive graphic section (Right column with 4 rotating slides) */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex flex-col items-center">
              
              {/* Main Carousel viewport */}
              <div 
                className="relative rounded-3xl overflow-hidden aspect-[4/5] w-full max-w-md shadow-2xl group border border-neutral-100 bg-neutral-100/40"
                id="hero-slideshow-container"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img 
                      src={HERO_SLIDES[currentSlide].image} 
                      alt={HERO_SLIDES[currentSlide].ownerName} 
                      referrerPolicy="no-referrer"
                      className="object-cover w-full h-full transform group-hover:scale-102 transition-transform duration-700 select-none"
                    />

                    {/* Gradient bottom scrim to make labels easily readable */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                    {/* Quick Info text overlaid near the bottom above dots */}
                    <div className="absolute bottom-16 left-6 right-6 text-white space-y-1 z-20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-[#dbef1a] text-neutral-900 font-extrabold rounded-md uppercase tracking-wider">
                          VLOXA USER
                        </span>
                        <span className="text-[11px] text-neutral-200 font-bold tracking-wide">
                          {HERO_SLIDES[currentSlide].desc}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-black text-white leading-tight">
                        {HERO_SLIDES[currentSlide].ownerName}
                      </h3>
                      <p className="text-xs text-[#dbef1a] font-bold">
                        Owner, {HERO_SLIDES[currentSlide].bizName}
                      </p>
                    </div>

                    {/* OVERLAY BADGE 1: Dynamically changes per business (Store Analytics) */}
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.4 }}
                      className="absolute top-6 left-6 rounded-xl bg-white/95 backdrop-blur-md p-4 shadow-xl border border-neutral-100/80 max-w-[210px] space-y-1 z-20 pointer-events-none select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 rounded-full bg-[#dbef1a] text-neutral-900 items-center justify-center font-display font-extrabold text-[10px]">
                          {HERO_SLIDES[currentSlide].badgeEmoji}
                        </span>
                        <span className="font-display font-extrabold text-sm text-neutral-900">
                          {HERO_SLIDES[currentSlide].metricValue}
                        </span>
                      </div>
                      <div className="h-1 bg-neutral-200 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="h-full bg-[#dbef1a] rounded-full transition-all duration-1000" 
                          style={{ width: currentSlide === 0 ? "75%" : currentSlide === 1 ? "85%" : currentSlide === 2 ? "90%" : "95%" }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 block mt-1 pt-1 border-t border-neutral-100">
                        {HERO_SLIDES[currentSlide].metricTitle}
                      </span>
                    </motion.div>

                    {/* OVERLAY BADGE 2: Dynamically changes per business (Verified Sales/Revenue) */}
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      className="absolute bottom-6 right-6 rounded-xl bg-white/95 backdrop-blur-md p-4 shadow-xl border border-neutral-100/80 max-w-[240px] space-y-1 z-20 pointer-events-none select-none hidden sm:block"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                        <span className="flex h-4 w-4 bg-emerald-100 rounded-full items-center justify-center text-emerald-700 text-[10px]">✓</span>
                        Layanan Aktif
                      </div>
                      <h4 className="font-display font-black text-neutral-900 text-lg">
                        {HERO_SLIDES[currentSlide].revenue}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                        {HERO_SLIDES[currentSlide].revenueLabel}
                      </p>
                    </motion.div>

                  </motion.div>
                </AnimatePresence>

                {/* Left Navigation Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/70 hover:bg-white text-neutral-800 border border-neutral-200 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer active:scale-95"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3]" />
                </button>

                {/* Right Navigation Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/70 hover:bg-white text-neutral-800 border border-neutral-200 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all z-30 cursor-pointer active:scale-95"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="h-4 w-4 stroke-[3]" />
                </button>

                {/* Active progress-line at bottom of slides to tick status visually */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-neutral-200/50 z-30">
                  <motion.div 
                    key={`bar-${currentSlide}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.5, ease: "linear" }}
                    className="h-full bg-[#dbef1a]"
                  />
                </div>

              </div>

              {/* Slider Dots indicators below the card */}
              <div className="flex items-center gap-2 mt-4 z-20">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === idx 
                        ? "w-6 bg-[#dbef1a]" 
                        : "w-2 bg-neutral-300 hover:bg-neutral-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

            </div>

          </div>
        </section>

        {/* Authenticated Workspace Section */}
        {user && (
          <section className="bg-neutral-50/50 py-12 px-6 border-t border-b border-neutral-100">
            <div className="max-w-7xl mx-auto">
              <Dashboard />
            </div>
          </section>
        )}

        {/* Section 2: Fitur Template List aligned with image2.png */}
        <section id="templates-section" className="py-20 px-6 bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto space-y-14">
            
            {/* Headers titles */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                  Fitur Template
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                  Ratusan <span className="font-medium text-neutral-900 underline decoration-[#dbef1a] decoration-4 underline-offset-6">desain siap pakai</span> untuk semua jenis bisnis.
                </h2>
              </div>
              <p className="text-sm font-semibold text-neutral-500 max-w-md leading-relaxed">
                Pilih template yang sesuai dengan jenis bisnis & kebutuhanmu — mudah dikustomisasi, hasil profesional.
              </p>
            </div>

            {/* Filtering category bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-4 relative">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-full border transition-all cursor-pointer ${
                    activeCategory === cat.value
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              {isAdmin && (
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="sm:ml-auto px-4 py-2.5 text-xs font-extrabold rounded-full bg-neutral-950 text-[#dbef1a] border border-neutral-800 hover:bg-black transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-[#dbef1a]/20"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dbef1a] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dbef1a]"></span>
                  </span>
                  Kelola Template Pilihan (Admin Only)
                </button>
              )}
            </div>



            {/* Template Card grid representation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredTemplates.map((t) => {
                const isFavorited = favorites.some(fav => fav.templateId === t.id);
                return (
                  <div 
                    key={t.id} 
                    className="group flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-neutral-300 transition-all"
                  >
                    {/* Template Image Section */}
                    <a 
                      href={t.demoUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        setDemoTemplate(t.title);
                      }}
                      className="relative block aspect-video overflow-hidden bg-neutral-100 border-b border-neutral-100 cursor-pointer group/img"
                    >
                      <img 
                        src={t.image} 
                        alt={t.title} 
                        referrerPolicy="no-referrer"
                        className="object-cover object-top w-full h-full transition-[all,object-position] duration-[3500ms,3500ms] ease-in-out group-hover/img:scale-105 group-hover:object-bottom" 
                      />
                      
                      {/* Interactive hover overlay */}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold text-neutral-800 shadow-md flex items-center gap-1.5 transform translate-y-1 group-hover/img:translate-y-0 transition-all duration-300">
                          Pratinjau Demo <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                      
                      {/* Favorite Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (!user) {
                            setAuthTab("login");
                            setIsAuthOpen(true);
                          } else {
                            toggleFavorite(t.id);
                          }
                        }}
                        className="absolute top-3.5 right-3.5 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-neutral-500 hover:text-red-500 hover:scale-105 transition-all shadow-md border border-neutral-150 cursor-pointer"
                        title={isFavorited ? "Hapus dari Favorit" : "Simpan ke Favorit"}
                      >
                        <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-neutral-500"}`} />
                      </button>
                    </a>

                    {/* Content metadata */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-mono bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded font-extrabold tracing-wider">
                          {t.categoryLabel}
                        </span>
                        <h3 className="font-display font-extrabold text-neutral-900 text-base mt-2.5 leading-snug group-hover:text-neutral-800">
                          {t.title}
                        </h3>
                      </div>

                      {/* Controls aligned with design in image2.png */}
                      <div className="grid grid-cols-2 gap-3.5 pt-2">
                        <a
                          href={t.demoUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            setDemoTemplate(t.title);
                          }}
                          className="w-full rounded-xl border border-neutral-200 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Lihat Demo
                          <ExternalLink className="h-3 w-3 inline-block" />
                        </a>
                        <button
                          onClick={() => handleChooseTemplate(t.id)}
                          className="w-full rounded-xl bg-[#dbef1a] text-neutral-950 py-2.5 text-xs font-extrabold hover:bg-[#cbdc10] transition-colors shadow-2xs cursor-pointer"
                        >
                          Pilih
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Demo All Button */}
            <div className="text-center pt-8">
              <button 
                onClick={() => setDemoTemplate("Koleksi Seluruh Demo")}
                className="inline-flex items-center gap-2.5 rounded-full border-2 border-neutral-900 px-8 py-3 text-sm font-extrabold text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all cursor-pointer"
              >
                Lihat Semua Demo
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

          </div>
        </section>

        {/* 03. PAKET LAYANAN WEBSITE Section */}
        <section id="paket-website" className="py-20 px-6 bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto">
            
            {/* Header following the image layout but adjusted to Vloxa theme */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-neutral-900/5 border border-neutral-900/10 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-neutral-800 transition-colors">
                  <span className="h-2 w-2 rounded-full bg-[#dbef1a]" />
                  03 . PILIHAN PAKET WEBSITE
                </div>
                <h2 className="font-display text-4xl sm:text-5xl font-black text-neutral-900 leading-tight">
                  Harga{" "}
                  <span className="relative inline-block px-1">
                    <span className="italic relative z-10 text-neutral-900">pas di kantong</span>
                    <span className="absolute inset-x-0 bottom-1 sm:bottom-2 h-3 sm:h-4 bg-[#dbef1a] -z-10 transform -rotate-1 skew-x-3 rounded-xs" />
                  </span>
                  , website kelas profesional.
                </h2>
              </div>
              <p className="text-sm sm:text-base font-semibold text-neutral-500 max-w-sm lg:max-w-md leading-relaxed">
                Pilih paket pembuatan website terbaik yang sesuai dengan skala bisnis Anda. Transparan, premium, tanpa biaya tersembunyi.
              </p>
            </div>

            {/* Pricing Cards - 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
              
              {/* Card 1: Starter */}
              <div className="flex flex-col bg-white border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-xs hover:border-neutral-300 transition-all relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400">UMKM / PROMOSI</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black text-neutral-900 bg-neutral-100 uppercase border border-neutral-250">Starter</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2.5xl sm:text-3xl font-black text-neutral-900">Rp350.000</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-semibold">
                    Investasi satu kali
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-neutral-900 text-base">
                    Paket Starter
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed min-h-[48px]">
                    Cocok untuk UMKM, personal branding, dan promosi produk/jasa.
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-neutral-100 flex-1">
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Template Premium Siap Pakai</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>1 Halaman Landing Page</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Mobile Friendly</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Tombol Chat WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Integrasi Media Sosial</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Integrasi Google Maps</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Form Kontak</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Maksimal 20 Foto</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Maksimal 5 Section</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>1x Revisi Minor</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Estimasi Pengerjaan 1–3 Hari</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("templates-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full flex items-center justify-between rounded-2xl bg-neutral-900 text-white py-3 px-4 font-bold text-xs hover:bg-neutral-950 transition-colors cursor-pointer group mt-auto"
                >
                  <span>Pilih Paket</span>
                  <span className="bg-[#dbef1a] rounded-full h-5.5 w-5.5 flex items-center justify-center text-neutral-900 transition-transform group-hover:translate-x-0.5 shrink-0">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Card 2: Business */}
              <div className="flex flex-col bg-white border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-xs hover:border-neutral-300 transition-all relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400">ONLINE TRANSAKSI</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black text-neutral-900 bg-[#dbef1a] uppercase border border-[#cbdc10] shadow-2xs">Best Seller</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2.5xl sm:text-3xl font-black text-neutral-900">Rp1.500.000</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-semibold">
                    Investasi satu kali
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-neutral-900 text-base flex items-center gap-1.5">
                    Paket Business ⭐ Paling Populer
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed min-h-[48px]">
                    Cocok untuk bisnis yang ingin menerima pesanan online.
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-neutral-100 flex-1">
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold mb-2 bg-[#dbef1a]/10 p-2 rounded-xl text-[11px] border border-[#dbef1a]/20">
                    <span>✨ Semua Fitur Paket Starter</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Hingga 5 Halaman</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Katalog Produk</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Keranjang Belanja</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Checkout Online</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Pembayaran QRIS Manual</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Form Kontak</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Dashboard Admin</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Kelola Produk Sendiri</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Kelola Harga Sendiri</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Maksimal 50 Foto</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Maksimal 30 Produk</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>SEO Dasar</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>2x Revisi Minor</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Estimasi Pengerjaan 3–5 Hari</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("templates-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full flex items-center justify-between rounded-2xl bg-neutral-900 text-white py-3 px-4 font-bold text-xs hover:bg-neutral-950 transition-colors cursor-pointer group mt-auto"
                >
                  <span>Pilih Paket</span>
                  <span className="bg-[#dbef1a] rounded-full h-5.5 w-5.5 flex items-center justify-center text-neutral-900 transition-transform group-hover:translate-x-0.5 shrink-0">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Card 3: Pro Store (Featured / Pop out) */}
              <div className="flex flex-col bg-neutral-950 border-2 border-[#dbef1a] rounded-3xl p-6 space-y-6 shadow-lg relative transform lg:-translate-y-2 z-10 text-white">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#dbef1a] text-neutral-950 font-black text-[9px] uppercase px-4 py-1.5 rounded-full tracking-wider border border-[#cbdc10] shadow-sm">
                  REKOMENDASI TOKO ONLINE
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#dbef1a]">PRO DIGITAL</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black text-neutral-950 bg-[#dbef1a] uppercase">Pro Store</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2.5xl sm:text-3xl font-black text-white">Rp2.500.000</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-semibold">
                    Investasi satu kali
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-[#dbef1a] text-base flex items-center gap-1.5">
                    Paket Pro Store 🚀
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed min-h-[48px]">
                    Cocok untuk toko online yang siap berkembang.
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-neutral-800 flex-1">
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold mb-2 bg-[#dbef1a]/15 p-2 rounded-xl text-[11px] border border-[#dbef1a]/30">
                    <span className="text-[#dbef1a]">✨ Semua Fitur Paket Business</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Hingga 10 Halaman</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Checkout Online</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Pembayaran QRIS Manual</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Variasi Produk</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Voucher Diskon</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Dashboard Admin Lengkap</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Kelola Produk & Harga Sendiri</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Form Kontak</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Optimasi Kecepatan Website</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Maksimal 150 Foto</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Maksimal 100 Produk</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>SEO Dasar</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>3x Revisi Minor</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-300 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-[#dbef1a] stroke-[4.5]" />
                    </div>
                    <span>Estimasi Pengerjaan 5–7 Hari</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("templates-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full flex items-center justify-between rounded-2xl bg-[#dbef1a] text-neutral-950 py-3.5 px-4 font-black text-xs hover:bg-[#cbdc10] transition-colors cursor-pointer group mt-auto"
                >
                  <span>Pilih Paket Pro</span>
                  <span className="bg-neutral-950 rounded-full h-5.5 w-5.5 flex items-center justify-center text-white transition-transform group-hover:translate-x-0.5 shrink-0">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Card 4: Custom */}
              <div className="flex flex-col bg-white border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-xs hover:border-neutral-300 transition-all relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400">ENTERPRISE / RETAIL</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black text-neutral-900 bg-[#dbef1a]/20 uppercase border border-[#dbef1a]/30">Custom</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2.5xl sm:text-3xl font-black text-neutral-900">Mulai Rp5.000.000</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-semibold">
                    Sesuai kesepakatan scope
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-neutral-900 text-base flex items-center gap-1.5">
                    Paket Custom 💎
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed min-h-[48px]">
                    Untuk bisnis dengan kebutuhan khusus dan skala besar.
                  </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-neutral-100 flex-1">
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Desain 100% Custom</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Tampilan Sesuai Brand</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Jumlah Halaman Fleksibel</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Checkout Online</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Payment Gateway</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>QRIS Otomatis</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Virtual Account</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>E-Wallet</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Kartu Kredit/Debit</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Sistem Membership</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Sistem Booking</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Integrasi API</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Dashboard Custom</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Jumlah Produk & Foto Menyesuaikan Kebutuhan</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Revisi Sesuai Scope Proyek</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-700 font-semibold">
                    <div className="h-4.5 w-4.5 rounded-full bg-[#dbef1a]/25 flex items-center justify-center shrink-0 border border-[#dbef1a]/40 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-neutral-900 stroke-[4.5]" />
                    </div>
                    <span>Estimasi Pengerjaan Menyesuaikan Kebutuhan</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setChatInput("Saya ingin berkonsultasi mengenai pembuatan website dengan Paket Custom di Vloxa.");
                    const el = document.getElementById("vloxa-dashboard") || document.getElementById("hero");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full flex items-center justify-between rounded-2xl bg-neutral-900 text-white py-3 px-4 font-bold text-xs hover:bg-neutral-950 transition-colors cursor-pointer group mt-auto"
                >
                  <span>Konsultasi WhatsApp</span>
                  <span className="bg-[#dbef1a] rounded-full h-5.5 w-5.5 flex items-center justify-center text-neutral-900 transition-transform group-hover:translate-x-0.5 shrink-0">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
              </div>

            </div>



          </div>
        </section>

        {/* Section About */}
        <section id="about-section" className="py-24 px-6 bg-neutral-50 border-t border-b border-neutral-100 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            
            {/* Header Badge & Title */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 bg-[#dbef1a] px-3.5 py-1.5 rounded-full inline-block">
                Tentang Kami
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-neutral-950">
                Solusi Website Profesional &amp; Praktis
              </h2>
            </div>

            {/* Paragraph body */}
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed max-w-2xl mx-auto font-medium">
              Kami menyediakan jasa pembuatan website profesional untuk UMKM, toko online, dan bisnis lokal. Dengan template premium dan proses yang praktis, bisnis Anda dapat memiliki website yang siap digunakan dalam waktu singkat.
            </p>

            {/* Key benefits list with Check mark badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 max-w-3xl mx-auto text-left">
              {[
                { 
                  title: "Desain Profesional", 
                  desc: "Tampilan modern, elegan, dan dirancang khusus agar bisnis Anda tampil tepercaya." 
                },
                { 
                  title: "Proses Cepat & Mudah", 
                  desc: "Tidak perlu ribet coding. Pilih template, selesaikan pembayaran, dan biarkan kami mengerjakan sisanya." 
                },
                { 
                  title: "Support Setelah Selesai", 
                  desc: "Layanan purnajual prima siap membantu mengawal keberlanjutan operasional website Anda." 
                }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-neutral-100/85 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#dbef1a]/25 border border-[#dbef1a]/50 flex items-center justify-center text-neutral-950 shrink-0">
                    <Check className="h-4.5 w-4.5 stroke-[3.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-905 text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </main>

      {/* Website Mock Up / Iframe Preview Overlay */}
      <AnimatePresence>
        {demoTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setDemoTemplate(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl z-10 border border-neutral-200"
            >
              {/* Browser bar layout element */}
              <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="h-3.5 w-3.5 rounded-full bg-red-400 block cursor-pointer shrink-0" onClick={() => setDemoTemplate(null)} />
                  <span className="h-3.5 w-3.5 rounded-full bg-yellow-400 block shrink-0" />
                  <span className="h-3.5 w-3.5 rounded-full bg-green-400 block shrink-0" />
                  <span className="text-xs font-mono ml-3 text-neutral-500 bg-white border px-3 py-1 rounded-md flex items-center gap-1.5 truncate max-w-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    {currentDemoTemplate ? currentDemoTemplate.demoUrl : "https://vloxa.com/demo/preview-mode"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {currentDemoTemplate && (
                    <a 
                      href={currentDemoTemplate.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 bg-white border border-neutral-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Buka di Tab Baru
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button 
                    onClick={() => setDemoTemplate(null)}
                    className="text-neutral-400 hover:text-neutral-600 font-bold text-xs p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* iframe / simulated preview */}
              {currentDemoTemplate ? (
                <div className="w-full h-[65vh] bg-neutral-105 relative">
                  <iframe 
                    src={currentDemoTemplate.demoUrl} 
                    title={currentDemoTemplate.title}
                    className="w-full h-full border-0"
                    referrerPolicy="no-referrer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                  <div className="text-center py-10 space-y-3">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">Live Demonstration</span>
                    <h3 className="text-2xl font-bold font-display text-neutral-900">{demoTemplate}</h3>
                    <p className="text-sm text-neutral-500 max-w-lg mx-auto">Kami sedang mensimulasikan lingkungan tampilan kustom. Semua interaksi, formulir transaksi dan antarmuka berjalan optimal, responsif serta ramah sentuhan.</p>
                  </div>

                  <div className="border border-neutral-100 rounded-xl p-6 bg-neutral-50 space-y-4">
                    <div className="h-3 bg-neutral-200 rounded-full w-24" />
                    <div className="h-8 bg-neutral-300 rounded-full w-3/4" />
                    <div className="h-4 bg-neutral-200 rounded-full w-full" />
                    <div className="h-4 bg-neutral-200 rounded-full w-5/6" />
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="h-24 bg-neutral-300 rounded-xl" />
                      <div className="h-24 bg-neutral-300 rounded-xl" />
                      <div className="h-24 bg-neutral-300 rounded-xl" />
                    </div>
                  </div>

                  <div className="text-center">
                    <button 
                      onClick={() => setDemoTemplate(null)}
                      className="rounded-xl bg-neutral-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-neutral-800"
                    >
                      Tutup Simulasi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Customer Support Action & Interactive Chat */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        
        {/* Support Chat box */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-neutral-100 w-80 md:w-96 overflow-hidden flex flex-col"
            >
              {/* Box header with lime accent */}
              <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#dbef1a] animate-pulse" />
                  <span className="font-display font-semibold text-sm">Konsultasi Bisnis Vloxa</span>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat history list */}
              <div className="p-4 h-64 overflow-y-auto space-y-3 text-xs flex flex-col">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[80%] rounded-xl p-3 leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-[#dbef1a]/20 text-neutral-900 border border-[#dbef1a]/40 self-end" 
                        : "bg-neutral-100 text-neutral-800 self-start"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Input action bar */}
              <form onSubmit={handleSendChat} className="border-t p-3 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ketik pesan konsultasi..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#dbef1a]"
                />
                <button 
                  type="submit"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white p-2 rounded-lg shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating lime action bubble aligned with image.png */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="h-14 w-14 rounded-full bg-[#dbef1a] flex items-center justify-center text-neutral-950 hover:bg-[#cbdc10] hover:scale-105 transition-all shadow-xl cursor-pointer"
          title="Konsultasi Bisnis"
        >
          {isChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </button>

      </div>

      {/* Styled Footer */}
      <footer id="footer" className="bg-white border-t border-neutral-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 100 100" className="h-8 w-8" fill="none">
                <path 
                  d="M 26,12 L 50,36 L 74,12" 
                  stroke="#dbef1a" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M 26,88 L 50,64 L 74,88" 
                  stroke="#dbef1a" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M 12,26 L 36,50 L 12,74" 
                  stroke="#dbef1a" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M 88,26 L 64,50 L 88,74" 
                  stroke="#dbef1a" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
              <span className="font-display text-2.5xl font-black tracking-tight text-neutral-900">
                Vloxa
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
              © 2026 Vloxa Digital Solutions. Empowering Indonesian MSMEs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-500 font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-neutral-950 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-950 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-950 transition-colors">Service Status</a>
            <a href="#" className="hover:text-neutral-950 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

      {/* Pop up Authentication Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialTab={authTab}
      />

      {/* Admin Featured Manual Selection Modal */}
      <AdminFeaturedModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        featuredTemplateIds={featuredTemplateIds}
        onSave={updateFeaturedTemplates}
        customTemplates={customTemplates}
        onAddCustomTemplate={addCustomTemplate}
        onUpdateCustomTemplate={updateCustomTemplate}
        onDeleteCustomTemplate={deleteCustomTemplate}
        onImportAllBaselineTemplates={importAllBaselineTemplates}
      />

    </div>
  );
}

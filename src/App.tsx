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
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
    importAllBaselineTemplates
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

  // Filter templates
  const filteredTemplates = activeCategory === "featured" 
    ? featuredTemplateIds
        .map(id => allTemplates.find(t => t.id === id))
        .filter((t): t is Template => !!t)
    : allTemplates.filter(t => t.category === activeCategory);

  const currentDemoTemplate = allTemplates.find(t => t.title === demoTemplate);

  return (
    <div className="min-h-screen bg-neutral-50/30 flex flex-col antialiased">
      
      {/* Top Banner Accent */}
      <div className="bg-[#dbef1a] py-2.5 px-4 overflow-hidden relative border-b border-neutral-200">
        <div className="animate-marquee whitespace-nowrap text-center text-xs font-bold text-neutral-900 flex justify-center items-center gap-6">
          <span className="inline-flex items-center gap-1.5 uppercase font-extrabold tracking-wider">
            <Zap className="h-3.5 w-3.5 fill-neutral-950 text-neutral-950" />
            DISKON HINGGA 50% untuk paket tahunan — Kembangkan UMKM Digital Anda
          </span>
          <span className="hidden md:inline text-neutral-600 block">|</span>
          <span className="hidden md:inline-flex items-center gap-1">
            Dapatkan Free Domain .com dan Cloud Hosting Indonesia Premium Hari Ini!
          </span>
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
            <a href="#hero" className="hover:text-neutral-900 transition-colors">Hosting</a>
            <a href="#templates-section" className="hover:text-neutral-900 transition-colors">Domains</a>
            <a href="#templates-section" className="hover:text-neutral-900 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">Pricing</a>
            <a href="#footer" className="hover:text-neutral-900 transition-colors">About</a>
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
                <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Hosting</a>
                <a href="#templates-section" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Domains</a>
                <a href="#templates-section" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Solutions</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">Pricing</a>
                <a href="#footer" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:bg-neutral-50 px-3 rounded-lg">About</a>
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
                Toko online UMKM siap berjualan, mulai{" "}
                <span className="relative inline-block z-10 font-bold text-neutral-900 px-1">
                  Rp100rb/bulan
                  <span className="absolute left-0 right-0 bottom-1 h-3 bg-[#dbef1a] -z-10 transform -rotate-1 skew-x-3 rounded-xs" />
                </span>
                .
              </h1>

              {/* Subheading text */}
              <p className="text-base sm:text-lg text-neutral-600 font-medium max-w-xl leading-relaxed">
                Vloxa menghadirkan infrastruktur digital premium untuk pengusaha Indonesia. Cepat, aman, dan dirancang untuk skala bisnis Anda.
              </p>

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

            {/* Immersive graphic section (Right column) */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
              
              {/* Solid graphic mask with young businesswoman */}
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] w-full max-w-md shadow-2xl group border border-neutral-100">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80" 
                  alt="Vloxa Customer Success" 
                  referrerPolicy="no-referrer"
                  className="object-cover w-full h-full transform group-hover:scale-102 transition-transform duration-700"
                />

                {/* Overlaid Data badges aligning with image.png */}
                <div className="absolute top-6 left-6 rounded-xl bg-white/90 backdrop-blur-md p-4 shadow-xl border border-neutral-100 max-w-[210px] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 rounded-full bg-[#dbef1a] text-neutral-900 items-center justify-center font-display font-extrabold text-[10px]">💹</span>
                    <span className="font-display font-extrabold text-sm text-neutral-900">+24% Growth</span>
                  </div>
                  <div className="h-1 bg-neutral-200 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-[#dbef1a] w-3/4 rounded-full" />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-1 pt-1 border-t border-neutral-100">Store Analytics</span>
                </div>

                <div className="absolute bottom-6 right-6 rounded-xl bg-white/95 backdrop-blur-md p-4 shadow-xl border border-neutral-100 max-w-[240px] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                    <span className="flex h-4 w-4 bg-emerald-100 rounded-full items-center justify-center text-emerald-700 text-[10px]">✓</span>
                    Payment Verified
                  </div>
                  <h4 className="font-display font-black text-neutral-900 text-lg">Rp12.450.000</h4>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Today's Revenue</p>
                </div>
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
                    <div className="relative aspect-video overflow-hidden bg-neutral-100 border-b border-neutral-100">
                      <img 
                        src={t.image} 
                        alt={t.title} 
                        referrerPolicy="no-referrer"
                        className="object-cover object-top w-full h-full transition-[object-position] duration-[3500ms] ease-in-out group-hover:object-bottom cursor-pointer" 
                      />
                      
                      {/* Favorite Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
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
                    </div>

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
                        <button
                          onClick={() => setDemoTemplate(t.title)}
                          className="w-full rounded-xl border border-neutral-200 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Lihat Demo
                          <ExternalLink className="h-3 w-3 inline-block" />
                        </button>
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

        {/* Pricing/Benefits Section */}
        <section id="pricing" className="py-20 px-6 bg-neutral-50 bg-grid-dots border-t border-neutral-100">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            
            <div className="space-y-4">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-neutral-900">Satu Paket Lengkap, Tiada Biaya Tersembunyi.</h2>
              <p className="text-neutral-600 max-w-xl mx-auto text-sm font-medium">Bantu digitalisasikan UMKM Anda saat ini dengan fitur-fitur tangguh kami.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3 shadow-2xs">
                <div className="h-10 w-10 bg-[#dbef1a]/20 text-neutral-900 rounded-xl flex items-center justify-center font-bold">✓</div>
                <h4 className="font-bold text-neutral-900">Domain .com / .id Gratis</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Berikan kredibilitas penuh ke pelanggan dengan alamat domain resmi gratis setahun.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3 shadow-2xs">
                <div className="h-10 w-10 bg-[#dbef1a]/20 text-neutral-900 rounded-xl flex items-center justify-center font-bold">✓</div>
                <h4 className="font-bold text-neutral-900">Hosting Bandwidth Unmetered</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Kecepatan server kencang bertenaga Cloud, website lancar diakses ribuan orang sekaligus.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3 shadow-2xs">
                <div className="h-10 w-10 bg-[#dbef1a]/20 text-neutral-900 rounded-xl flex items-center justify-center font-bold">✓</div>
                <h4 className="font-bold text-neutral-900">Asisten Bisnis AI</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Dapatkan strategi bisnis, penulisan nama produk dan promosi terotomasi.</p>
              </div>
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

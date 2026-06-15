import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { TEMPLATES } from "../data/templates";
import { 
  Laptop, 
  Palette, 
  Settings, 
  Heart, 
  Globe, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  ExternalLink 
} from "lucide-react";

export default function Dashboard() {
  const { 
    user, 
    userProfile, 
    favorites, 
    domainRequests, 
    updateUserProfile, 
    toggleFavorite, 
    deleteDomainRequest, 
    logoutUser,
    isFirebaseActive,
    customTemplates,
    isAdmin,
    isRealAdmin,
    isAdminPreviewActive,
    setIsAdminPreviewActive,
    activateAdminWithCode,
    deactivateAdmin
  } = useApp();

  const [bizType, setBizType] = useState(userProfile?.bizType || "UMKM");
  const [websiteTitle, setWebsiteTitle] = useState(userProfile?.websiteTitle || "");
  const [themeColor, setThemeColor] = useState(userProfile?.themeColor || "#dbef1a");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // States for Special Admin backdoor activation (Opsi 2)
  const [adminCode, setAdminCode] = useState("");
  const [adminMessage, setAdminMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Supported for full offline guest dashboard usage when logged out

  const handleActivateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode.trim()) return;
    setIsActivating(true);
    setAdminMessage(null);
    try {
      const success = await activateAdminWithCode(adminCode);
      if (success) {
        setAdminMessage({ type: "success", text: "Akses Super Admin Berhasil Diaktifkan! Selamat bersenang-senang mengelola website." });
        setAdminCode("");
      } else {
        setAdminMessage({ type: "error", text: "Kode akses salah! Coba 'VLOXA-SUPER-ADMIN' atau 'ADMIN123'." });
      }
    } catch (err) {
      setAdminMessage({ type: "error", text: "Gagal memproses kode sandi." });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await updateUserProfile({
        bizType,
        websiteTitle,
        themeColor
      });
      setMessage("Profil website Anda berhasil disimpan secara real-time!");
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setMessage("Gagal menyimpan profil, silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Merge static baseline and loaded custom templates (deduplicate by id, prioritize custom edits)
  const customIds = new Set(customTemplates.map(t => t.id));
  const allTemplates = [
    ...customTemplates,
    ...TEMPLATES.filter(t => !customIds.has(t.id))
  ];

  // Find user's actual favorite templates metadata
  const userFavoritesMeta = allTemplates.filter(t => 
    favorites.some(f => f.templateId === t.id)
  );

  return (
    <div id="vloxa-dashboard" className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 shadow-xs">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-100 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-display text-2xl font-bold text-neutral-900">Dashboard Real-Time</h2>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Sesi aktif sebagai <span className="font-semibold text-neutral-800">{user?.displayName || "Tamu Vloxa"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Penyimpanan Lokal Aktif (Offline)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile and Website Configuration Form */}
        <div className="lg:col-span-1 border border-neutral-100 rounded-2xl p-6 bg-neutral-50/50">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-neutral-700" />
            <h3 className="font-display font-bold text-neutral-900 text-lg">Konfigurasi Website</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Pilar Kategori Bisnis</label>
              <select
                value={bizType}
                onChange={(e) => setBizType(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#dbef1a]"
              >
                <option value="UMKM">UMKM Umum</option>
                <option value="F&B">F&B / Kuliner</option>
                <option value="Fashion">Fashion & Aksesoris</option>
                <option value="Properti">Properti & Desain</option>
                <option value="Inovasi">Inovasi & Teknologi</option>
                <option value="Kesehatan">Kesehatan & Kecantikan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Judul Website Anda</label>
              <input
                type="text"
                required
                placeholder="cth: Kedai Kopi Makmur"
                value={websiteTitle}
                onChange={(e) => setWebsiteTitle(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#dbef1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Warna Aksen Website</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-10 w-12 rounded cursor-pointer border border-neutral-200 bg-transparent p-0"
                />
                <span className="font-mono text-sm text-neutral-600">{themeColor}</span>
              </div>
            </div>

            {message && (
              <div className="text-xs bg-neutral-100 text-neutral-800 p-3 rounded-lg border border-neutral-200 font-medium">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
          
          {/* Admin Preview Mode (Simulasi Logout Admin) */}
          {isRealAdmin && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Simulasi Mode UI</h4>
              </div>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                <div className="text-xs text-amber-800">
                  <p className="font-extrabold uppercase tracking-wide text-[10px]">Simulasi Tampilan Logout Admin</p>
                  <p className="font-medium text-[11px] mt-0.5 leading-normal">
                    {isAdminPreviewActive 
                      ? "Anda saat ini menyamar sebagai pengguna biasa (Non-Admin). Tombol dan fitur admin disembunyikan agar Anda dapat melihat tampilan website apa adanya." 
                      : "Gunakan fitur ini untuk menyamar sebagai pengguna biasa tanpa harus logout akun Google Anda."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminPreviewActive(!isAdminPreviewActive)}
                  className={`w-full text-center py-2 px-3 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-3xs ${
                    isAdminPreviewActive 
                      ? "bg-amber-600 hover:bg-amber-700 text-white" 
                      : "bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200"
                  }`}
                >
                  {isAdminPreviewActive ? "Matikan Preview (Kembali Jadi Admin)" : "Aktifkan Preview (Sembunyikan Akses Admin)"}
                </button>
              </div>
            </div>
          )}

          {/* Admin Backdoor Code Section (Opsi 2) */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Akses Khusus Admin</h4>
            </div>

            {isAdmin ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-emerald-800">
                    <p className="font-extrabold uppercase tracking-wide text-[10px]">Akses Admin Aktif</p>
                    <p className="font-medium text-[11px] mt-0.5 leading-normal">
                      Anda sekarang dapat menambah, mengedit, menghapus, & mengatur template bawaan secara bebas di website ini.
                    </p>
                  </div>
                </div>
                {userProfile?.role === "admin" && (
                  <button
                    onClick={deactivateAdmin}
                    className="w-full text-center py-1.5 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-3xs"
                  >
                    Nonaktifkan Akses Admin
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleActivateAdmin} className="space-y-3">
                <p className="text-[11px] text-neutral-500 leading-normal font-medium">
                  Masukkan kode rahasia admin untuk mengarahkan Anda ke Dashboard Admin khusus kelola katalog template bawaan. (Gunakan <span className="font-bold text-neutral-850 bg-neutral-100 px-1 py-0.5 rounded font-mono">VLOXA-SUPER-ADMIN</span>)
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Kode Rahasia Admin..."
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#dbef1a] font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isActivating}
                    className="rounded-xl bg-neutral-900 hover:bg-black px-4 py-2 text-xs font-semibold text-[#dbef1a] hover:text-white cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isActivating ? "Memproses..." : "Aktifkan"}
                  </button>
                </div>
                {adminMessage && (
                  <p className={`text-[10px] font-bold mt-1 ${adminMessage.type === "success" ? "text-emerald-600 animate-fadeIn" : "text-rose-500"}`}>
                    {adminMessage.text}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Real-time Website Mock Card Preview */}
          <div className="mt-8 border border-neutral-200 rounded-xl bg-white overflow-hidden p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <span className="text-[10px] font-mono text-neutral-400">PREVIEW SITUS SAYA</span>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <div 
                className="h-8 rounded-lg flex items-center px-3 font-display font-extrabold text-xs text-neutral-900 justify-between transition-colors"
                style={{ backgroundColor: themeColor + "20", borderLeft: `3px solid ${themeColor}` }}
              >
                <span>{websiteTitle || "Toko Contoh Anda"}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: themeColor, color: '#000' }}>{bizType}</span>
              </div>
              <div className="h-12 border border-dashed rounded-lg flex flex-col items-center justify-center text-[10px] text-neutral-400">
                <Laptop className="h-4 w-4 mb-0.5" />
                Template Aktif disesuaikan
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Database Collections: Domains and Favorites */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Domains Collection Section */}
          <div className="border border-neutral-100 rounded-2xl p-6 bg-white shadow-3xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-neutral-700" />
                <h3 className="font-display font-bold text-neutral-900 text-lg">Domain Impian Anda ({domainRequests.length})</h3>
              </div>
              <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-500 font-bold uppercase tracking-wider">real-time sync</span>
            </div>

            {domainRequests.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                <Globe className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">Belum ada domain yang dicari/diregistrasi.</p>
                <p className="text-xs text-neutral-400 mt-1">Gunakan kotak pencarian di atas untuk menyimpan domain impian Anda!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-600">
                  <thead className="bg-neutral-50 text-neutral-700 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Domain</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Tanggal Cari</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {domainRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-neutral-900">{req.domainName}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Dalam Review
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }) : "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deleteDomainRequest(req.id)}
                            className="text-neutral-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus domain"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Favorites Collection Section */}
          <div className="border border-neutral-100 rounded-2xl p-6 bg-white shadow-3xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                <h3 className="font-display font-bold text-neutral-900 text-lg">Pilihan Template Favorit ({userFavoritesMeta.length})</h3>
              </div>
            </div>

            {userFavoritesMeta.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                <Heart className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-500">Belum ada template favorit.</p>
                <p className="text-xs text-neutral-400 mt-1">Ketuk ikon hati pada daftar desain template di bawah untuk menambahkannya!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userFavoritesMeta.map((t) => (
                  <div key={t.id} className="flex border border-neutral-100 rounded-xl overflow-hidden hover:border-neutral-200 transition-all p-2.5 items-center gap-3.5 bg-neutral-50/20 shadow-2xs">
                    <img 
                      src={t.image} 
                      alt={t.title} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded-lg shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400">{t.categoryLabel}</span>
                      <h4 className="font-semibold text-neutral-900 text-xs truncate leading-snug">{t.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => toggleFavorite(t.id)}
                          className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          Batal Favorit
                        </button>
                        <span className="text-neutral-300">|</span>
                        <a 
                          href={t.demoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-0.5 font-medium"
                        >
                          Lihat Demo <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

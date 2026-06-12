import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { X, Lock, Mail, User, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}

export default function AuthModal({ isOpen, onClose, initialTab = "login" }: AuthModalProps) {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, isSupabaseActive } = useApp();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "login") {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) {
          throw new Error("Nama lengkap harus diisi");
        }
        await registerWithEmail(name, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("Email atau password salah");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email sudah terdaftar sebelumnya");
      } else if (err.code === "auth/weak-password") {
        setError("Password terlalu lemah (minimal 6 karakter)");
      } else {
        setError(err.message || "Terjadi kesalahan, silakan coba lagi");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Gagal masuk dengan Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-neutral-100 z-10"
      >
        {/* Decorative Top Accent */}
        <div className="h-2 bg-[#dbef1a]" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <div className="mb-6 text-center">
            <h3 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
              {tab === "login" ? "Selamat Datang Kembali" : "Gabung ke Vloxa"}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              {tab === "login" 
                ? "Masuk untuk mengelola website UMKM instan Anda" 
                : "Mulai perjalanan digital Anda hari ini"
              }
            </p>
          </div>

          {/* Fallback Notice */}
          {!isSupabaseActive && (
            <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">Mode Simulasi Aktif:</span> Supabase belum dihubungkan sepenuhnya. Anda dapat masuk dengan akun dummy/simulasi secara instan tanpa internet!
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Auth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.17-3.17C17.47 1.59 14.9 1 12 1 7.24 1 3.25 3.75 1.41 7.78l3.78 2.93C6.1 7.42 8.84 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.78 2.93c2.21-2.03 3.49-5.02 3.49-8.66z"
              />
              <path
                fill="#FBBC05"
                d="M5.19 14.85c-.24-.72-.38-1.49-.38-2.35s.14-1.63.38-2.35L1.41 7.22C.51 9.02 0 11.02 0 13s.51 3.98 1.41 5.78l3.78-2.93z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.78-2.93c-1.12.75-2.54 1.2-4.15 1.2-3.16 0-5.9-2.38-6.81-5.67L1.41 15.62C3.25 19.65 7.24 23 12 23z"
              />
            </svg>
            Masuk dengan Google
          </button>

          <div className="my-5 flex items-center justify-between">
            <span className="w-1/5 border-b border-neutral-200" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">atau email</span>
            <span className="w-1/5 border-b border-neutral-200" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute top-3.5 left-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder="Budi Setiawan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#dbef1a] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute top-3.5 left-3 h-4 w-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#dbef1a] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute top-3.5 left-3 h-4 w-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#dbef1a] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
            >
              {loading 
                ? "Memproses..." 
                : tab === "login" ? "Masuk ke Dashboard" : "Register Akun Baru"
              }
            </button>
          </form>

          {/* Tab Switcher */}
          <div className="mt-6 text-center text-sm text-neutral-500">
            {tab === "login" ? (
              <p>
                Belum punya akun?{" "}
                <button 
                  onClick={() => setTab("register")}
                  className="font-semibold text-neutral-900 hover:underline hover:text-[#b4cb0e] cursor-pointer"
                >
                  Daftar Sekarang
                </button>
              </p>
            ) : (
              <p>
                Sudah memiliki akun?{" "}
                <button 
                  onClick={() => setTab("login")}
                  className="font-semibold text-neutral-900 hover:underline hover:text-[#b4cb0e] cursor-pointer"
                >
                  Masuk Sekarang
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

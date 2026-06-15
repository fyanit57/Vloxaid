import React, { useState, useRef, useEffect } from "react";
import { TEMPLATES, Template } from "../data/templates";
import { 
  Search, 
  X, 
  Check, 
  Sparkles, 
  Lock, 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Globe, 
  ExternalLink,
  GripVertical,
  Move,
  Pencil,
  Download
} from "lucide-react";

interface AdminFeaturedModalProps {
  isOpen: boolean;
  onClose: () => void;
  featuredTemplateIds: string[];
  onSave: (ids: string[]) => Promise<void>;
  customTemplates: Template[];
  onAddCustomTemplate: (template: Omit<Template, "id" | "createdAt">) => Promise<void>;
  onUpdateCustomTemplate: (id: string, template: Omit<Template, "id" | "createdAt">) => Promise<void>;
  onDeleteCustomTemplate: (id: string) => Promise<void>;
  onImportAllBaselineTemplates: () => Promise<void>;
}

export default function AdminFeaturedModal({
  isOpen,
  onClose,
  featuredTemplateIds,
  onSave,
  customTemplates,
  onAddCustomTemplate,
  onUpdateCustomTemplate,
  onDeleteCustomTemplate,
  onImportAllBaselineTemplates,
}: AdminFeaturedModalProps) {
  const [activeTab, setActiveTab] = useState<"curate" | "add-manage">("curate");
  const [selectedIds, setSelectedIds] = useState<string[]>(featuredTemplateIds);

  // Sync selectedIds with saved featuredTemplateIds whenever the modal opens or the saved IDs change
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(featuredTemplateIds);
    }
  }, [isOpen, featuredTemplateIds]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // States for search and filter in custom templates catalog (Right column)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogSelectedCategory, setCatalogSelectedCategory] = useState("all");

  // Drag and Drop curating order state
  const [curateView, setCurateView] = useState<"select" | "reorder">("select");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Form states for adding custom template
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("F&B");
  const [newDemoUrl, setNewDemoUrl] = useState("https://template.vloxa.id/");
  const [imageSource, setImageSource] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingCount = TEMPLATES.filter(base => !customTemplates.some(t => t.id === base.id)).length;

  // Edit states for existing templates
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditClick = (t: Template) => {
    setEditingId(t.id);
    setNewTitle(t.title);
    setNewCategory(t.category);
    setNewDemoUrl(t.demoUrl);
    setFormMessage(null);

    if (t.image.startsWith("data:")) {
      setImageSource("upload");
      setImagePreview(t.image);
      setImageFile(null);
      setImageUrl("");
    } else {
      setImageSource("url");
      setImageUrl(t.image);
      setImagePreview(null);
      setImageFile(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewTitle("");
    setNewDemoUrl("https://template.vloxa.id/");
    setImageUrl("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80");
    setImageFile(null);
    setImagePreview(null);
    setFormMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCustomDelete = async (id: string) => {
    if (editingId === id) {
      handleCancelEdit();
    }
    await onDeleteCustomTemplate(id);
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleImportBaseline = async () => {
    setIsImporting(true);
    setFormMessage(null);
    try {
      await onImportAllBaselineTemplates();
      setFormMessage({ type: "success", text: "Berhasil mengimpor semua template bawaan sistem ke Custom Template!" });
    } catch (err) {
      console.error(err);
      setFormMessage({ type: "error", text: "Gagal mengimpor template bawaan." });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Drag / Drop events
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  // Drag and drop sorting handlers for selected template positions
  const handleDragStartItem = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDropItem = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (draggedIndex === targetIndex) return;

    const reorderedIds = [...selectedIds];
    const [removed] = reorderedIds.splice(draggedIndex, 1);
    reorderedIds.splice(targetIndex, 0, removed);

    setSelectedIds(reorderedIds);
    setDraggedIndex(null);
  };

  const handleDragEndItem = () => {
    setDraggedIndex(null);
  };

  // Toggle selection for featured templates
  const handleToggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Merge static templates and custom user-provided templates (deduplicate by id, prioritize custom templates)
  const customIds = new Set(customTemplates.map(t => t.id));
  const allTemplates = [
    ...customTemplates,
    ...TEMPLATES.filter(t => !customIds.has(t.id))
  ].map(t => ({
    ...t,
    image: t.image || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    demoUrl: t.demoUrl.startsWith("https://vloxa.id")
      ? t.demoUrl.replace("https://vloxa.id", "https://template.vloxa.id")
      : t.demoUrl
  }));

  // Filter templates inside selection modal
  const filteredTemplates = allTemplates.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter custom templates in the right column catalog
  const filteredCatalogTemplates = customTemplates.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                          t.categoryLabel.toLowerCase().includes(catalogSearchQuery.toLowerCase());
    const matchesCategory = catalogSelectedCategory === "all" || t.category === catalogSelectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    { value: "Fashion", label: "Fashion" },
    { value: "F&B", label: "Food & Drink" },
    { value: "Event", label: "Event" },
    { value: "Bisnis", label: "Bisnis" },
    { value: "Sport & Health", label: "Sport & Health" },
    { value: "Layanan", label: "Layanan" },
    { value: "Arts", label: "Arts" },
    { value: "Otomotif", label: "Otomotif" },
    { value: "Edukasi", label: "Edukasi" },
    { value: "Travel", label: "Travel" }
  ];

  const getCategoryLabel = (catValue: string): string => {
    const found = categoriesList.find(c => c.value === catValue);
    return found ? found.label : catValue;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await onSave(selectedIds);
      setMessage("Template Pilihan berhasil disimpan secara real-time!");
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1550);
    } catch (e) {
      setMessage("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAllInFiltered = () => {
    const currentFilteredIds = filteredTemplates.map((t) => t.id);
    setSelectedIds((prev) => {
      const otherSelected = prev.filter((id) => !currentFilteredIds.includes(id));
      const allFilteredSelected = Array.from(new Set([...otherSelected, ...currentFilteredIds]));
      return allFilteredSelected;
    });
  };

  const handleClearAllInFiltered = () => {
    const currentFilteredIds = filteredTemplates.map((t) => t.id);
    setSelectedIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
  };

  // Image compressor client-side using standard Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          // Target max width 600px for card optimization
          const maxWidth = 600;
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress quality to 75% JPEG
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle Drag / Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Submit adding or editing dynamic custom template
  const handleAddTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDemoUrl.trim()) {
      setFormMessage({ type: "error", text: "Mohon lengkapi seluruh kolom wajib/bintang (*)!" });
      return;
    }

    let finalImage = "";
    setIsUploading(true);
    setFormMessage(null);

    try {
      if (imageSource === "upload") {
        if (!imageFile && !imagePreview) {
          setFormMessage({ type: "error", text: "Silakan unggah berkas gambar terlebih dahulu." });
          setIsUploading(false);
          return;
        }
        if (imageFile) {
          finalImage = await compressImage(imageFile);
        } else {
          finalImage = imagePreview || "";
        }
      } else {
        if (!imageUrl.trim()) {
          setFormMessage({ type: "error", text: "Silakan isi tautan URL gambar terlebih dahulu." });
          setIsUploading(false);
          return;
        }
        finalImage = imageUrl.trim();
      }

      if (editingId) {
        // Edit mode
        await onUpdateCustomTemplate(editingId, {
          title: newTitle.trim(),
          category: newCategory,
          categoryLabel: getCategoryLabel(newCategory),
          image: finalImage,
          demoUrl: newDemoUrl.trim()
        });
        setFormMessage({ type: "success", text: "Berhasil memperbarui template kustom!" });
        setEditingId(null);
      } else {
        // Create mode
        await onAddCustomTemplate({
          title: newTitle.trim(),
          category: newCategory,
          categoryLabel: getCategoryLabel(newCategory),
          image: finalImage,
          demoUrl: newDemoUrl.trim()
        });
        setFormMessage({ type: "success", text: "Berhasil menambahkan template kustom!" });
      }

      // Reset form variables
      setNewTitle("");
      setNewDemoUrl("https://template.vloxa.id/");
      setImageUrl("https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error(err);
      setFormMessage({ type: "error", text: "Gagal menyimpan template: " + (err.message || err) });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="admin-featured-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative transform overflow-hidden rounded-3xl bg-white border border-neutral-200/80 shadow-2xl transition-all w-full max-w-4xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-150 bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#dbef1a]/20 rounded-xl">
                <Lock className="h-5 w-5 text-[#dbef1a]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Vloxa Admin Panel</h3>
                <p className="text-xs text-neutral-400 font-medium">Manajemen Template & Fitur UMKM Global</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-5 right-5 sm:relative sm:top-0 sm:right-0 rounded-full p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 pt-1">
            <button
              onClick={() => setActiveTab("curate")}
              className={`py-3.5 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
                activeTab === "curate"
                  ? "border-neutral-950 text-neutral-950"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Kurasi Template Pilihan
            </button>
            <button
              onClick={() => setActiveTab("add-manage")}
              className={`py-3.5 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
                activeTab === "add-manage"
                  ? "border-neutral-950 text-neutral-950"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Tambah & Kelola Custom Template
            </button>
          </div>

          {/* TAB 1: CURATE FEATURED TEMPLATES LIST */}
          {activeTab === "curate" && (
            <>
              {/* Steps/Mode Selection Sub-header */}
              <div className="px-6 py-3.5 bg-neutral-900 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">Langkah Pengaturan:</h4>
                  <p className="text-[10px] text-neutral-400 font-medium">1. Hubungkan template, kemudian 2. Tarik di mode "Urutkan (Drag)" untuk mengatur posisinya.</p>
                </div>

                <div className="flex bg-neutral-800 p-1 rounded-xl shadow-inner shrink-0 border border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setCurateView("select")}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      curateView === "select"
                        ? "bg-[#dbef1a] text-neutral-900 shadow-xs"
                        : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    ✓ 1. Pilih Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurateView("reorder")}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      curateView === "reorder"
                        ? "bg-[#dbef1a] text-neutral-900 shadow-xs"
                        : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    <Move className="h-3 w-3 shrink-0" /> 2. Urutkan (Drag)
                  </button>
                </div>
              </div>

              {curateView === "select" ? (
                <>
                  {/* Search, Filter & Quick Options */}
                  <div className="p-6 bg-neutral-50/50 border-b border-neutral-100 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Cari nama template atau kategori..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-450 focus:outline-hidden"
                        />
                      </div>

                      <div className="relative min-w-[160px]">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-neutral-700 focus:border-neutral-400 focus:outline-hidden appearance-none cursor-pointer"
                        >
                          <option value="all">Semua Kategori</option>
                          {categoriesList.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <SlidersHorizontal className="h-4 w-4 text-neutral-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold bg-[#dbef1a] text-neutral-900 px-3 py-1 rounded-full border border-neutral-300 shadow-3xs">
                          {selectedIds.length} Terpilih
                        </span>
                        <span className="text-neutral-500 font-bold">dari {allTemplates.length} total template</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllInFiltered}
                          className="px-3 py-1.5 text-[11px] font-extrabold text-neutral-700 bg-neutral-200/50 hover:bg-neutral-200 rounded-lg transition-all"
                        >
                          Pilih Semua Hasil Cari
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllInFiltered}
                          className="px-3 py-1.5 text-[11px] font-extrabold text-neutral-700 bg-neutral-200/50 hover:bg-neutral-200 rounded-lg transition-all"
                        >
                          Reset Semua Hasil Cari
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Templates Grid */}
                  <div className="p-6 overflow-y-auto flex-1 bg-white">
                    {filteredTemplates.length === 0 ? (
                      <div className="py-12 text-center text-neutral-400 text-sm">
                        Tidak ada template yang cocok dengan pencarian Anda.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredTemplates.map((t) => {
                          const isChecked = selectedIds.includes(t.id);
                          const isCustom = customTemplates.some(ct => ct.id === t.id);
                          return (
                            <div
                              key={t.id}
                              onClick={() => handleToggleTemplate(t.id)}
                              className={`group relative flex flex-col border rounded-2xl p-3.5 cursor-pointer transition-all ${
                                isChecked
                                  ? "border-[#dbef1a] bg-neutral-55/40 shadow-xs ring-2 ring-[#dbef1a]/30"
                                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 border border-neutral-200">
                                    {t.categoryLabel}
                                  </span>
                                  {isCustom && (
                                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 font-extrabold">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                                  isChecked 
                                    ? "bg-neutral-900 border-neutral-900 text-white" 
                                    : "border-neutral-300 bg-white group-hover:border-neutral-400"
                                }`}>
                                  {isChecked && <Check className="h-3 w-3 stroke-[3px]" />}
                                </div>
                              </div>

                              <div className="aspect-video w-full rounded-xl overflow-hidden mb-2 bg-neutral-100 min-h-[96px] relative">
                                {t.image.startsWith("data:") ? (
                                  <img
                                    src={t.image}
                                    alt={t.title}
                                    className="h-full w-full object-cover object-top"
                                  />
                                ) : (
                                  <img
                                    src={t.image}
                                    alt={t.title}
                                    referrerPolicy="no-referrer"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                )}
                              </div>

                              <h4 className="text-xs font-extrabold text-neutral-800 line-clamp-1">{t.title}</h4>
                              <p className="text-[9px] text-neutral-400 font-medium font-mono mt-0.5">ID: {t.id}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Reorder drag-and-drop view */
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                  {selectedIds.length === 0 ? (
                    <div className="py-12 text-center text-neutral-450 font-bold text-sm">
                      Belum ada template pilihan yang dipilih. Silakan pilih template di tab "Pilih Template" terlebih dahulu.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-2xl text-xs text-amber-850 flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold">Cara Mengurutkan Tampilan:</p>
                          <p className="text-neutral-600 mt-0.5">Tarik (Drag) salah satu baris/kartu di bawah menggunakan tombol gagang ⠿ atau keseluruhan kartu, lalu jatuhkan (Drop) di posisi baru untuk mengatur urutan penayangan di Halaman Utama.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {selectedIds
                          .map(id => allTemplates.find(t => t.id === id))
                          .filter((t): t is Template => !!t)
                          .map((t, index) => {
                            const isDraggingThis = index === draggedIndex;
                            const isCustom = customTemplates.some(ct => ct.id === t.id);
                            return (
                              <div
                                key={t.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStartItem(e, index)}
                                onDragOver={(e) => handleDragOverItem(e, index)}
                                onDrop={(e) => handleDropItem(e, index)}
                                onDragEnd={handleDragEndItem}
                                className={`flex items-center gap-3 p-3.5 bg-white border rounded-2xl transition-all shadow-3xs cursor-grab active:cursor-grabbing ${
                                  isDraggingThis 
                                    ? "opacity-40 scale-95 border-dashed border-neutral-400 bg-neutral-50" 
                                    : "border-neutral-200 hover:border-neutral-350 hover:shadow-xs"
                                }`}
                              >
                                {/* Position badge & drag handle */}
                                <div className="flex flex-col items-center gap-2 shrink-0 select-none">
                                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-neutral-900 text-white font-extrabold text-[10px] shadow-3xs">
                                    #{index + 1}
                                  </span>
                                  <div className="text-neutral-450 hover:text-neutral-750 p-0.5">
                                    <GripVertical className="h-4.5 w-4.5" />
                                  </div>
                                </div>

                                {/* Thumbnail */}
                                <div className="h-14 w-20 bg-neutral-50 rounded-xl overflow-hidden border border-neutral-150 shrink-0 relative">
                                  {t.image.startsWith("data:") ? (
                                    <img
                                      src={t.image}
                                      alt={t.title}
                                      className="h-full w-full object-cover object-top"
                                    />
                                  ) : (
                                    <img
                                      src={t.image}
                                      alt={t.title}
                                      referrerPolicy="no-referrer"
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>

                                {/* Meta */}
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-extrabold text-neutral-800 truncate" title={t.title}>
                                    {t.title}
                                  </h5>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[9px] font-extrabold uppercase bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-150">
                                      {t.categoryLabel}
                                    </span>
                                    {isCustom && (
                                      <span className="text-[9px] font-extrabold uppercase font-mono px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                                        Cust
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Save Footer */}
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  {message && (
                    <div className="text-xs font-semibold text-neutral-800 animate-pulse bg-[#dbef1a]/20 px-3 py-1.5 rounded-xl border border-[#dbef1a]">
                      ✨ {message}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-extrabold text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-xs font-extrabold text-neutral-950 bg-[#dbef1a] border border-[#dbef1a] hover:bg-[#cbdc10] rounded-xl transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Pilihan"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ADD & MANAGE DYNAMIC CUSTOM TEMPLATES */}
          {activeTab === "add-manage" && (
            <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Form to add (Left column) */}
              <form onSubmit={handleAddTemplateSubmit} className="lg:col-span-5 bg-white p-5 border border-neutral-250/75 rounded-2xl space-y-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900 border-b border-[#dbef1a]/20 pb-2 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      {editingId ? <Pencil className="h-4 w-4 text-neutral-950" /> : <Plus className="h-4 w-4 text-neutral-950" />}
                      {editingId ? "Edit Template Kustom" : "Tambah Template Baru"}
                    </span>
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-[10px] text-neutral-500 hover:text-neutral-800 underline font-extrabold cursor-pointer"
                      >
                        Batal Edit
                      </button>
                    )}
                  </h4>

                  <div className="space-y-3 pt-3">
                    {/* Judul */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wide mb-1">
                        Nama / Judul Template <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="cth: Kopi Nusantara, Elixir Fashion"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:outline-hidden"
                      />
                    </div>

                    {/* Kategori */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wide mb-1">
                        Kategori Bisnis <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-800 focus:border-neutral-400 focus:outline-hidden cursor-pointer"
                      >
                        {categoriesList.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label} ({cat.value})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Link Demo */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wide mb-1">
                        Link Demo Website <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                        <input
                          type="url"
                          required
                          placeholder="https://template.vloxa.id/demo/..."
                          value={newDemoUrl}
                          onChange={(e) => setNewDemoUrl(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Image Source Toggle */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wide mb-1.5">
                        Sumber Gambar <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => { setImageSource("upload"); setImageUrl(""); }}
                          className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                            imageSource === "upload" ? "bg-white text-neutral-900 shadow-3xs" : "text-neutral-500 hover:text-neutral-950"
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImageSource("url"); setImageFile(null); setImagePreview(null); }}
                          className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                            imageSource === "url" ? "bg-white text-neutral-900 shadow-3xs" : "text-neutral-505 hover:text-neutral-950"
                          }`}
                        >
                          Tautan Link URL
                        </button>
                      </div>
                    </div>

                    {/* Image Source: Upload */}
                    {imageSource === "upload" && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                            dragActive ? "border-neutral-950 bg-neutral-50/50" : "border-neutral-200 bg-white hover:border-neutral-300"
                          }`}
                        >
                          {imagePreview ? (
                            <div className="space-y-2 relative">
                              <img
                                src={imagePreview}
                                alt="Pratinjau"
                                className="max-h-24 mx-auto rounded-lg object-cover shadow-3xs"
                              />
                              <p className="text-[9px] font-mono text-neutral-500 truncate">{imageFile?.name}</p>
                              <span className="text-[10px] font-bold text-neutral-900 underline hover:text-neutral-700">Ganti Gambar</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 py-2 text-neutral-500">
                              <Upload className="h-5 w-5 mx-auto text-neutral-400" />
                              <p className="text-xs font-semibold text-neutral-700">Tarik atau Klik untuk Upload</p>
                              <p className="text-[9px] text-neutral-400">Dimensi dioptimalkan ke 600px secara otomatis</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Image Source: URL */}
                    {imageSource === "url" && (
                      <div>
                        <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wide mb-1">
                          External Image Link URL
                        </label>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
                  {formMessage && (
                    <div className={`p-2.5 rounded-xl border text-[11px] font-semibold leading-relaxed ${
                      formMessage.type === "success" 
                        ? "bg-emerald-55/60 border-emerald-250 text-emerald-800" 
                        : "bg-red-55/60 border-red-250 text-red-805"
                    }`}>
                      {formMessage.type === "success" ? "✓ " : "✗ "} {formMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                      editingId 
                        ? "bg-neutral-800 hover:bg-neutral-900 text-white" 
                        : "bg-neutral-900 hover:bg-black text-[#dbef1a]"
                    }`}
                  >
                    {isUploading ? "Mengunggah..." : editingId ? "Simpan Perubahan" : "Tambah Template"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-full py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-extrabold text-[11px] transition-colors cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>

              {/* Dynamic list / delete controls (Right column) */}
              <div className="lg:col-span-7 bg-white p-5 border border-neutral-250/75 rounded-2xl shadow-3xs flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-1.5">
                    <SlidersHorizontal className="h-4 w-4" />
                    Katalog Custom Template ({customTemplates.length})
                  </h4>

                  {/* LIVE SEARCH & CATEGORY FILTER */}
                  <div className="mt-3.5 flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-450" />
                      <input
                        type="text"
                        placeholder="Cari nama template atau kategori..."
                        value={catalogSearchQuery}
                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-9 pr-8 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-hidden"
                      />
                      {catalogSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearchQuery("")}
                          className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="relative min-w-[140px]">
                      <select
                        value={catalogSelectedCategory}
                        onChange={(e) => setCatalogSelectedCategory(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 pr-8 text-xs text-neutral-700 focus:border-neutral-400 focus:bg-white focus:outline-hidden appearance-none cursor-pointer font-bold"
                      >
                        <option value="all">Semua Kategori</option>
                        {categoriesList.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                        <SlidersHorizontal className="h-3 w-3 text-neutral-450" />
                      </div>
                    </div>
                  </div>

                  {remainingCount > 0 && (
                    <div className="mb-4 bg-amber-50/75 border border-amber-200/70 p-3.5 rounded-xl flex items-start gap-3 mt-3 shadow-3xs animate-fadeIn text-xs">
                      <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-extrabold text-amber-900 uppercase tracking-wide text-[10.5px]">
                          Impor Template Bawaan Sistem ({remainingCount} Item Tersisa)
                        </h5>
                        <p className="text-[10px] text-amber-800/90 mt-1 leading-relaxed font-semibold">
                          Salin semua template bawaan sistem ke basis data Custom Template sehingga Anda dapat mengedit judul, kategori, tautan demo, gambar, atau menghapusnya secara bebas.
                        </p>
                        <button
                          type="button"
                          onClick={handleImportBaseline}
                          disabled={isImporting}
                          className="mt-2.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-[#dbef1a] font-extrabold text-[10px] rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-3xs disabled:opacity-50"
                        >
                          <Download className="h-3 w-3 text-[#dbef1a]" />
                          {isImporting ? "Mengimpor Template..." : "Impor Semua ke Custom Template"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-neutral-100 overflow-y-auto max-h-[42vh] pr-1 mt-3 space-y-0 text-xs text-neutral-700">
                    {customTemplates.length === 0 ? (
                      <div className="py-12 text-center text-neutral-450 font-bold">
                        Belum ada template kustom yang ditambahkan.
                      </div>
                    ) : filteredCatalogTemplates.length === 0 ? (
                      <div className="py-12 text-center text-neutral-450 font-semibold italic">
                        Tidak ada template kustom yang cocok dengan pencarian Anda.
                      </div>
                    ) : (
                      filteredCatalogTemplates.map((t) => (
                        <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail */}
                            <div className="h-11 w-16 bg-neutral-50 rounded-lg overflow-hidden border border-neutral-205 shrink-0">
                              <img
                                src={t.image}
                                alt={t.title}
                                className="h-full w-full object-cover object-top"
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-neutral-800 truncate">{t.title}</h5>
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                                <span className="bg-neutral-105 px-1.5 py-0.5 rounded border border-neutral-200">{t.categoryLabel}</span>
                                <span>• ID: {t.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditClick(t)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                editingId === t.id
                                  ? "bg-neutral-100 border-[#dbef1a] text-neutral-950 font-extrabold"
                                  : "text-neutral-450 hover:text-neutral-850 hover:bg-neutral-50 border-transparent hover:border-neutral-205"
                              }`}
                              title="Edit Template"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <a 
                              href={t.demoUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="p-1.5 rounded-lg text-neutral-450 hover:text-neutral-800 hover:bg-neutral-50 border border-transparent hover:border-neutral-205 transition-all text-[11px]"
                              title="Buka Demo"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCustomDelete(t.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-105 transition-all cursor-pointer border border-transparent"
                              title="Hapus Template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-extrabold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl transition-all cursor-pointer"
                  >
                    Tutup Panel
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  supabase, 
  isSupabasePlaceholderConfig, 
  toCamelCase, 
  toSnakeCase, 
  handleSupabaseError, 
  SupabaseOperationType 
} from "../supabase";
import { Template, TEMPLATES } from "../data/templates";

// Define compatible user type to avoid breaking other consumer components
export interface CompatibleUser {
  uid: string;
  email: string;
  displayName: string | null;
  emailVerified?: boolean;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  bizType: string;
  websiteTitle: string;
  themeColor: string;
  createdAt: string;
  updatedAt: string;
  role?: string; // Optional field for RBAC ("admin" | "member")
}

export interface UserFavorite {
  id: string;
  userId: string;
  templateId: string;
  createdAt: string;
}

export interface DomainRequest {
  id: string;
  userId: string;
  domainName: string;
  status: "checked" | "requested" | "registered";
  createdAt: string;
}

interface AppContextType {
  user: CompatibleUser | null;
  userProfile: UserProfile | null;
  favorites: UserFavorite[];
  domainRequests: DomainRequest[];
  isLoading: boolean;
  isFirebaseActive: boolean; // Kept as isFirebaseActive for compatibility with views
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  toggleFavorite: (templateId: string) => Promise<void>;
  requestDomain: (domain: string) => Promise<void>;
  deleteDomainRequest: (requestId: string) => Promise<void>;
  resetToDefaultProfile: () => Promise<void>;
  featuredTemplateIds: string[];
  updateFeaturedTemplates: (ids: string[]) => Promise<void>;
  isAdmin: boolean;
  customTemplates: Template[];
  addCustomTemplate: (template: Omit<Template, "id">) => Promise<void>;
  updateCustomTemplate: (id: string, template: Omit<Template, "id" | "createdAt">) => Promise<void>;
  deleteCustomTemplate: (id: string) => Promise<void>;
  importAllBaselineTemplates: () => Promise<void>;
  activateAdminWithCode: (code: string) => Promise<boolean>;
  deactivateAdmin: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CompatibleUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [domainRequests, setDomainRequests] = useState<DomainRequest[]>([]);
  const [featuredTemplateIds, setFeaturedTemplateIds] = useState<string[]>(["fb-2", "fs-1", "ev-1", "bs-1", "sh-1"]);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(!isSupabasePlaceholderConfig && !!supabase);

  const isAdmin = user ? (user.email === "fyanit57@gmail.com" || userProfile?.role === "admin") : false;

  // Fallback storage functions for Placeholder/Offline mode
  const getLocalData = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const setLocalData = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  };

  // Synchronize authentication state
  useEffect(() => {
    if (!isFirebaseActive || !supabase) {
      // Offline fallback mode initialization
      const cachedUid = localStorage.getItem("vloxa_fallback_uid");
      if (cachedUid) {
        const dummyUser: CompatibleUser = {
          uid: cachedUid,
          displayName: localStorage.getItem("vloxa_fallback_name") || "Tamu Vloxa",
          email: localStorage.getItem("vloxa_fallback_email") || "guest@vloxa.com",
          emailVerified: true,
        };
        setUser(dummyUser);
        
        // Load offline data
        setUserProfile(getLocalData<UserProfile>(`vloxa_profile_${cachedUid}`, {
          userId: cachedUid,
          name: dummyUser.displayName || "",
          email: dummyUser.email || "",
          bizType: "UMKM",
          websiteTitle: "Toko Online Saya",
          themeColor: "#dbef1a",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: (dummyUser.email === "fyanit57@gmail.com") ? "admin" : "member"
        }));
        setFavorites(getLocalData<UserFavorite[]>(`vloxa_favorites_${cachedUid}`, []));
        setDomainRequests(getLocalData<DomainRequest[]>(`vloxa_domains_${cachedUid}`, []));
      }
      setIsLoading(false);
      return;
    }

    let profileSubscription: any = null;
    let favoritesSubscription: any = null;
    let domainsSubscription: any = null;

    const loadUserData = async (currentUser: any) => {
      setIsLoading(true);
      try {
        const mappedUser: CompatibleUser = {
          uid: currentUser.id,
          email: currentUser.email || "",
          displayName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.displayName || currentUser.email?.split("@")[0] || "User",
          emailVerified: !!currentUser.email_confirmed_at,
        };
        setUser(mappedUser);

        // 1. Fetch profile
        const { data: profileData, error: profileErr } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (profileErr) {
          console.error("Profile load warning:", profileErr.message);
        }

        if (profileData) {
          setUserProfile(toCamelCase(profileData) as UserProfile);
        } else {
          // Auto create profile first setup
          const newProfile: UserProfile = {
            userId: currentUser.id,
            name: mappedUser.displayName || "Pengusaha UMKM",
            email: mappedUser.email || "",
            bizType: "UMKM",
            websiteTitle: "Toko Online Saya",
            themeColor: "#dbef1a",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: (mappedUser.email === "fyanit57@gmail.com") ? "admin" : "member"
          };

          const { error: insertErr } = await supabase
            .from("user_profiles")
            .upsert(toSnakeCase(newProfile));

          if (insertErr) {
            console.error("Profile insert failed:", insertErr.message);
          } else {
            setUserProfile(newProfile);
          }
        }

        // 2. Load favorites
        const { data: favsData, error: favsErr } = await supabase
          .from("user_favorites")
          .select("*")
          .eq("user_id", currentUser.id);

        if (favsErr) {
          console.error("Favorites load warning:", favsErr.message);
        } else if (favsData) {
          setFavorites(favsData.map(f => toCamelCase(f)) as UserFavorite[]);
        }

        // 3. Load domain requests
        const { data: domainsData, error: domainsErr } = await supabase
          .from("domain_requests")
          .select("*")
          .eq("user_id", currentUser.id);

        if (domainsErr) {
          console.error("Domains load warning:", domainsErr.message);
        } else if (domainsData) {
          setDomainRequests(domainsData.map(d => toCamelCase(d)) as DomainRequest[]);
        }

        // Setup realtime observers
        profileSubscription = supabase
          .channel(`profile-${currentUser.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "user_profiles", filter: `user_id=eq.${currentUser.id}` },
            (payload: any) => {
              if (payload.eventType === "DELETE") {
                setUserProfile(null);
              } else if (payload.new) {
                setUserProfile(toCamelCase(payload.new) as UserProfile);
              }
            }
          )
          .subscribe();

        favoritesSubscription = supabase
          .channel(`favorites-${currentUser.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "user_favorites", filter: `user_id=eq.${currentUser.id}` },
            async () => {
              const { data } = await supabase
                .from("user_favorites")
                .select("*")
                .eq("user_id", currentUser.id);
              if (data) {
                setFavorites(data.map(f => toCamelCase(f)) as UserFavorite[]);
              }
            }
          )
          .subscribe();

        domainsSubscription = supabase
          .channel(`domains-${currentUser.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "domain_requests", filter: `user_id=eq.${currentUser.id}` },
            async () => {
              const { data } = await supabase
                .from("domain_requests")
                .select("*")
                .eq("user_id", currentUser.id);
              if (data) {
                setDomainRequests(data.map(d => toCamelCase(d)) as DomainRequest[]);
              }
            }
          )
          .subscribe();

      } catch (error) {
        console.error("Error loading user profile or data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Perform initial checks
    supabase.auth.getUser().then(({ data: { user: initialUser } }) => {
      if (initialUser) {
        loadUserData(initialUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setFavorites([]);
        setDomainRequests([]);
        setIsLoading(false);
      }
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserProfile(null);
        setFavorites([]);
        setDomainRequests([]);
        setIsLoading(false);

        // Remove active channels
        if (profileSubscription) {
          supabase.removeChannel(profileSubscription);
          profileSubscription = null;
        }
        if (favoritesSubscription) {
          supabase.removeChannel(favoritesSubscription);
          favoritesSubscription = null;
        }
        if (domainsSubscription) {
          supabase.removeChannel(domainsSubscription);
          domainsSubscription = null;
        }
      }
    });

    return () => {
      authSub.unsubscribe();
      if (profileSubscription) supabase.removeChannel(profileSubscription);
      if (favoritesSubscription) supabase.removeChannel(favoritesSubscription);
      if (domainsSubscription) supabase.removeChannel(domainsSubscription);
    };
  }, [isFirebaseActive]);

  // Google Login implementation
  const loginWithGoogle = async () => {
    if (!isFirebaseActive || !supabase) {
      // Simulate Google login offline
      const mockUid = "gg-" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("vloxa_fallback_uid", mockUid);
      localStorage.setItem("vloxa_fallback_name", "Google User");
      localStorage.setItem("vloxa_fallback_email", "google.user@gmail.com");
      
      const simulatedUser: CompatibleUser = {
        uid: mockUid,
        displayName: "Google User",
        email: "google.user@gmail.com",
        emailVerified: true,
      };
      
      setUser(simulatedUser);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Supabase Login Gagal:", err);
      throw err;
    }
  };

  // Email and Password Login
  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseActive || !supabase) {
      const mockUid = "em-" + btoa(email).substring(0, 10);
      localStorage.setItem("vloxa_fallback_uid", mockUid);
      localStorage.setItem("vloxa_fallback_name", email.split("@")[0]);
      localStorage.setItem("vloxa_fallback_email", email);
      
      const simulatedUser: CompatibleUser = {
        uid: mockUid,
        displayName: email.split("@")[0],
        email: email,
        emailVerified: true,
      };
      
      setUser(simulatedUser);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Login email gagal:", err);
      throw err;
    }
  };

  // Register user manual
  const registerWithEmail = async (name: string, email: string, pass: string) => {
    if (!isFirebaseActive || !supabase) {
      const mockUid = "em-" + btoa(email).substring(0, 10);
      localStorage.setItem("vloxa_fallback_uid", mockUid);
      localStorage.setItem("vloxa_fallback_name", name);
      localStorage.setItem("vloxa_fallback_email", email);
      
      const simulatedUser: CompatibleUser = {
        uid: mockUid,
        displayName: name,
        email: email,
        emailVerified: true,
      };
      
      setUser(simulatedUser);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
            displayName: name,
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Registrasi gagal:", err);
      throw err;
    }
  };

  // Logout function
  const logoutUser = async () => {
    localStorage.removeItem("vloxa_fallback_uid");
    localStorage.removeItem("vloxa_fallback_name");
    localStorage.removeItem("vloxa_fallback_email");
    setUser(null);
    setUserProfile(null);
    setFavorites([]);
    setDomainRequests([]);

    if (!isFirebaseActive || !supabase) {
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  // Update profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    const updatedProfile = {
      ...userProfile,
      ...updates,
      userId: user.uid,
      updatedAt: new Date().toISOString()
    } as UserProfile;

    setUserProfile(updatedProfile);

    if (!isFirebaseActive || !supabase) {
      setLocalData(`vloxa_profile_${user.uid}`, updatedProfile);
      return;
    }

    try {
      const snakeUpdates = toSnakeCase({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      const { error } = await supabase
        .from("user_profiles")
        .update(snakeUpdates)
        .eq("user_id", user.uid);

      if (error) {
        handleSupabaseError(error, SupabaseOperationType.UPDATE, "user_profiles", user.uid);
      }
    } catch (err) {
      handleSupabaseError(err, SupabaseOperationType.UPDATE, "user_profiles", user.uid);
    }
  };

  // Toggle favoriting / un-favoriting a design template
  const toggleFavorite = async (templateId: string) => {
    if (!user) return;

    const existingFav = favorites.find(f => f.templateId === templateId);

    let newList: UserFavorite[] = [];
    if (existingFav) {
      newList = favorites.filter(f => f.templateId !== templateId);
    } else {
      const newFav: UserFavorite = {
        id: "fav-" + Math.random().toString(36).substring(2, 9),
        userId: user.uid,
        templateId,
        createdAt: new Date().toISOString()
      };
      newList = [...favorites, newFav];
    }
    setFavorites(newList);

    if (!isFirebaseActive || !supabase) {
      setLocalData(`vloxa_favorites_${user.uid}`, newList);
      return;
    }

    if (existingFav) {
      try {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("id", existingFav.id);
        if (error) {
          handleSupabaseError(error, SupabaseOperationType.DELETE, "user_favorites", user.uid);
        }
      } catch (err) {
        handleSupabaseError(err, SupabaseOperationType.DELETE, "user_favorites", user.uid);
      }
    } else {
      const newFavId = `fav-${user.uid}-${templateId}`;
      const newFavorite = {
        id: newFavId,
        userId: user.uid,
        templateId,
        createdAt: new Date().toISOString()
      };
      
      try {
        const { error } = await supabase
          .from("user_favorites")
          .insert(toSnakeCase(newFavorite));
        if (error) {
          handleSupabaseError(error, SupabaseOperationType.CREATE, "user_favorites", user.uid);
        }
      } catch (err) {
        handleSupabaseError(err, SupabaseOperationType.CREATE, "user_favorites", user.uid);
      }
    }
  };

  // Request/search a custom domain
  const requestDomain = async (domain: string) => {
    if (!user) return;

    const cleanedDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!cleanedDomain) return;

    const docId = `domain-${user.uid}-${Date.now()}`;
    const newRequest: DomainRequest = {
      id: docId,
      userId: user.uid,
      domainName: cleanedDomain,
      status: "requested",
      createdAt: new Date().toISOString()
    };

    const newList = [...domainRequests, newRequest];
    setDomainRequests(newList);

    if (!isFirebaseActive || !supabase) {
      setLocalData(`vloxa_domains_${user.uid}`, newList);
      return;
    }

    try {
      const { error } = await supabase
        .from("domain_requests")
        .insert(toSnakeCase(newRequest));
      if (error) {
        handleSupabaseError(error, SupabaseOperationType.CREATE, "domain_requests", user.uid);
      }
    } catch (err) {
      handleSupabaseError(err, SupabaseOperationType.CREATE, "domain_requests", user.uid);
    }
  };

  // Delete a requested domain
  const deleteDomainRequest = async (requestId: string) => {
    if (!user) return;

    const newList = domainRequests.filter(r => r.id !== requestId);
    setDomainRequests(newList);

    if (!isFirebaseActive || !supabase) {
      setLocalData(`vloxa_domains_${user.uid}`, newList);
      return;
    }

    try {
      const { error } = await supabase
        .from("domain_requests")
        .delete()
        .eq("id", requestId);
      if (error) {
        handleSupabaseError(error, SupabaseOperationType.DELETE, "domain_requests", user.uid);
      }
    } catch (err) {
      handleSupabaseError(err, SupabaseOperationType.DELETE, "domain_requests", user.uid);
    }
  };

  // Reset demo user profile
  const resetToDefaultProfile = async () => {
    if (!user) return;
    await updateUserProfile({
      bizType: "UMKM",
      websiteTitle: "Toko Online Saya",
      themeColor: "#dbef1a"
    });
  };

  // Subscribe to Featured Templates (independent of logged-in state)
  useEffect(() => {
    if (!isFirebaseActive || !supabase) {
      const fallback = getLocalData<string[]>("vloxa_featured_templates", ["fb-2", "fs-1", "ev-1", "bs-1", "sh-1"]);
      setFeaturedTemplateIds(fallback);
      return;
    }

    const loadFeaturedObj = async () => {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("*")
          .eq("key", "featured")
          .maybeSingle();

        if (data && data.template_ids) {
          setFeaturedTemplateIds(data.template_ids);
          setLocalData("vloxa_featured_templates", data.template_ids);
        } else {
          const currentFallback = getLocalData<string[]>("vloxa_featured_templates", ["fb-2", "fs-1", "ev-1", "bs-1", "sh-1"]);
          setFeaturedTemplateIds(currentFallback);
        }
      } catch (err) {
        console.warn("Featured layouts load warning:", err);
      }
    };

    loadFeaturedObj();

    // Setup channel subscription
    const configChannel = supabase
      .channel("public:app_config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_config", filter: "key=eq.featured" },
        (payload: any) => {
          if (payload.new && payload.new.template_ids) {
            setFeaturedTemplateIds(payload.new.template_ids);
            setLocalData("vloxa_featured_templates", payload.new.template_ids);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(configChannel);
    };
  }, [isFirebaseActive]);

  // Update Featured Templates (Admin only)
  const updateFeaturedTemplates = async (ids: string[]) => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    setFeaturedTemplateIds(ids);
    setLocalData("vloxa_featured_templates", ids);

    if (!isFirebaseActive || !supabase) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can update featured templates configuration.");
      return;
    }

    try {
      const { error } = await supabase
        .from("app_config")
        .upsert({
          key: "featured",
          template_ids: ids,
          updated_at: new Date().toISOString(),
          updated_by: userEmail
        });
      if (error) {
        handleSupabaseError(error, SupabaseOperationType.WRITE, "app_config", user?.uid);
      }
    } catch (err) {
      handleSupabaseError(err, SupabaseOperationType.WRITE, "app_config", user?.uid);
    }
  };

  // Subscribe to Dynamic Custom Templates (independent of logged-in state)
  useEffect(() => {
    if (!isFirebaseActive || !supabase) {
      const fallback = getLocalData<Template[]>("vloxa_custom_templates", []);
      setCustomTemplates(fallback);
      return;
    }

    const loadCustomTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from("custom_templates")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Custom templates query error:", error.message);
        } else if (data) {
          const list = data.map(item => toCamelCase(item)) as Template[];
          setCustomTemplates(list);
          setLocalData("vloxa_custom_templates", list);
        }
      } catch (err) {
        console.warn("Custom templates fetch error:", err);
      }
    };

    loadCustomTemplates();

    const templateChannel = supabase
      .channel("public:custom_templates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "custom_templates" },
        () => {
          loadCustomTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(templateChannel);
    };
  }, [isFirebaseActive]);

  // Add a new Custom Template (Admin only)
  const addCustomTemplate = async (templateData: Omit<Template, "id">) => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    const id = "custom-" + Math.random().toString(36).substring(2, 11);
    const newTemplate: Template = {
      id,
      ...templateData,
      createdAt: new Date().toISOString()
    };

    const updatedList = [newTemplate, ...customTemplates];
    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !supabase) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can add custom templates.");
      return;
    }

    try {
      const payload = toSnakeCase({
        id,
        title: templateData.title,
        category: templateData.category,
        categoryLabel: templateData.categoryLabel,
        image: templateData.image,
        demoUrl: templateData.demoUrl,
        createdAt: new Date().toISOString()
      });

      const { error } = await supabase
        .from("custom_templates")
        .insert(payload);

      if (error) {
        handleSupabaseError(error, SupabaseOperationType.WRITE, "custom_templates", user?.uid);
      }
    } catch (err) {
      handleSupabaseError(err, SupabaseOperationType.WRITE, "custom_templates", user?.uid);
    }
  };

  // Delete a Custom Template (Admin only)
  const deleteCustomTemplate = async (id: string) => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    const updatedList = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !supabase) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can delete custom templates.");
      return;
    }

    try {
      const { error } = await supabase
        .from("custom_templates")
        .delete()
        .eq("id", id);
      if (error) {
        handleSupabaseError(error, SupabaseOperationType.WRITE, "custom_templates", user?.uid);
      }
    } catch (err) {
      handleSupabaseError(err, SupabaseOperationType.WRITE, "custom_templates", user?.uid);
    }
  };

  // Update an existing Custom Template (Admin only)
  const updateCustomTemplate = async (id: string, templateData: Omit<Template, "id" | "createdAt">) => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    const updatedList = customTemplates.map(t => t.id === id ? { ...t, ...templateData } : t);
    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !supabase) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can edit custom templates.");
      return;
    }

    try {
      const payload = toSnakeCase({
        title: templateData.title,
        category: templateData.category,
        categoryLabel: templateData.categoryLabel,
        image: templateData.image,
        demoUrl: templateData.demoUrl
      });

      const { error } = await supabase
        .from("custom_templates")
        .update(payload)
        .eq("id", id);
      if (error) {
        handleSupabaseError(error, SupabaseOperationType.WRITE, "custom_templates", user?.uid);
      }
    } catch (err) {
      handleSupabaseError(err, SupabaseOperationType.WRITE, "custom_templates", user?.uid);
    }
  };

  // Import all static TEMPLATES into firebase "custom_templates" or localStorage "vloxa_custom_templates"
  const importAllBaselineTemplates = async () => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    const existingIds = new Set(customTemplates.map(t => t.id));
    const toImport = TEMPLATES.filter(t => !existingIds.has(t.id));

    if (toImport.length === 0) {
      return;
    }

    const nowStr = new Date().toISOString();
    const importedTemplates = toImport.map(t => ({
      ...t,
      createdAt: nowStr
    }));

    const updatedList = [...customTemplates, ...importedTemplates];
    updatedList.sort((a, b) => {
      const dateA = a.createdAt || "";
      const dateB = b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !supabase) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can import templates.");
      return;
    }

    try {
      const rows = toImport.map(t => toSnakeCase({
        id: t.id,
        title: t.title,
        category: t.category,
        categoryLabel: t.categoryLabel,
        image: t.image,
        demoUrl: t.demoUrl,
        createdAt: nowStr
      }));

      const { error } = await supabase
        .from("custom_templates")
        .insert(rows);

      if (error) {
        console.error("Error committing batch import to Supabase database:", error.message);
      }
    } catch (err) {
      console.error("Error committing batch import of baseline templates:", err);
    }
  };

  // Dynamic role-based admin activation functions (Opsi 2)
  const activateAdminWithCode = async (code: string): Promise<boolean> => {
    const formattedCode = code.trim().toUpperCase();
    if (formattedCode === "VLOXA-SUPER-ADMIN" || formattedCode === "ADMIN123") {
      await updateUserProfile({ role: "admin" });
      return true;
    }
    return false;
  };

  const deactivateAdmin = async (): Promise<void> => {
    await updateUserProfile({ role: "member" });
  };

  return (
    <AppContext.Provider value={{
      user,
      userProfile,
      favorites,
      domainRequests,
      isLoading,
      isFirebaseActive,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logoutUser,
      updateUserProfile,
      toggleFavorite,
      requestDomain,
      deleteDomainRequest,
      resetToDefaultProfile,
      featuredTemplateIds,
      updateFeaturedTemplates,
      isAdmin,
      customTemplates,
      addCustomTemplate,
      updateCustomTemplate,
      deleteCustomTemplate,
      importAllBaselineTemplates,
      activateAdminWithCode,
      deactivateAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

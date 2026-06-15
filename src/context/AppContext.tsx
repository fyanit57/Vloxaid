import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  query,
  where,
  updateDoc,
  Timestamp,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { 
  auth, 
  db, 
  isPlaceholderConfig, 
  handleFirestoreError, 
  OperationType,
  setOnQuotaExceeded
} from "../firebase";
import { Template, TEMPLATES } from "../data/templates";

// Define TypeScript interfaces for our application state
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
  user: User | null;
  userProfile: UserProfile | null;
  favorites: UserFavorite[];
  domainRequests: DomainRequest[];
  isLoading: boolean;
  isFirebaseActive: boolean;
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
  quotaExceeded: boolean;
  quotaErrorMessage: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [domainRequests, setDomainRequests] = useState<DomainRequest[]>([]);
  const [featuredTemplateIds, setFeaturedTemplateIds] = useState<string[]>(["tokora", "fs-2", "ev-2", "ly-1", "tr-2"]);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(!isPlaceholderConfig && !!auth);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState("");

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

  // Set up Firebase Firestore Quota Exceeded listener
  useEffect(() => {
    setOnQuotaExceeded((msg) => {
      console.warn("Firestore Quota Exceeded. Activating graceful offline fallback mode.");
      setQuotaExceeded(true);
      setQuotaErrorMessage(msg);
      setIsFirebaseActive(false); // Instantly de-activates Firebase to prevent crash & switch to local caches
    });
  }, []);

  // Synchronize authentication state
  useEffect(() => {
    if (!isFirebaseActive || !auth || !db) {
      // Offline fallback mode initialization
      const cachedUid = user?.uid || localStorage.getItem("vloxa_fallback_uid") || "guest_vloxa";
      
      // Keep state session intact or set dummy session
      if (user) {
        localStorage.setItem("vloxa_fallback_uid", user.uid);
        localStorage.setItem("vloxa_fallback_name", user.displayName || "Pengusaha UMKM");
        localStorage.setItem("vloxa_fallback_email", user.email || "");
      } else {
        const dummyUser = {
          uid: cachedUid,
          displayName: localStorage.getItem("vloxa_fallback_name") || "Tamu Vloxa",
          email: localStorage.getItem("vloxa_fallback_email") || "guest@vloxa.com",
          emailVerified: true,
        } as unknown as User;
        setUser(dummyUser);
      }
      
      // Load offline data from localStorage cache
      setUserProfile(getLocalData<UserProfile>(`vloxa_profile_${cachedUid}`, {
        userId: cachedUid,
        name: user?.displayName || localStorage.getItem("vloxa_fallback_name") || "Tamu Vloxa",
        email: user?.email || localStorage.getItem("vloxa_fallback_email") || "guest@vloxa.com",
        bizType: "UMKM",
        websiteTitle: "Toko Online Saya",
        themeColor: "#dbef1a",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: "member"
      }));
      setFavorites(getLocalData<UserFavorite[]>(`vloxa_favorites_${cachedUid}`, []));
      setDomainRequests(getLocalData<DomainRequest[]>(`vloxa_domains_${cachedUid}`, []));
      setIsLoading(false);
      return;
    }

    let profileUnsub: (() => void) | null = null;
    let favUnsub: (() => void) | null = null;
    let domainUnsub: (() => void) | null = null;

    const cleanUpSubscribers = () => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }
      if (favUnsub) {
        favUnsub();
        favUnsub = null;
      }
      if (domainUnsub) {
        domainUnsub();
        domainUnsub = null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous listeners BEFORE setting the new user or starting new listeners
      cleanUpSubscribers();
      
      setUser(currentUser);
      
      if (currentUser) {
        setIsLoading(true);
        const profilePath = `user_profiles/${currentUser.uid}`;
        
        // 1. Subscribe to profile modifications real-time
        profileUnsub = onSnapshot(doc(db, "user_profiles", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUserProfile(data);
            setLocalData(`vloxa_profile_${currentUser.uid}`, data);
          } else {
            // First time setup - auto create profile
            const newProfile: UserProfile = {
              userId: currentUser.uid,
              name: currentUser.displayName || "Pengusaha UMKM",
              email: currentUser.email || "",
              bizType: "UMKM",
              websiteTitle: "Toko Online Saya",
              themeColor: "#dbef1a",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              role: (currentUser.email === "fyanit57@gmail.com") ? "admin" : "member"
            };
            
            // Try to set document securely with error handling
            setDoc(doc(db, "user_profiles", currentUser.uid), newProfile)
              .then(() => {
                setUserProfile(newProfile);
                setLocalData(`vloxa_profile_${currentUser.uid}`, newProfile);
              })
              .catch((err) => handleFirestoreError(err, OperationType.WRITE, profilePath));
          }
        }, (err) => {
          if (err?.code !== "permission-denied") {
            handleFirestoreError(err, OperationType.GET, profilePath);
          }
        });

        // 2. Subscribe to favorites real-time
        const favQuery = query(collection(db, "user_favorites"), where("userId", "==", currentUser.uid));
        favUnsub = onSnapshot(favQuery, (snap) => {
          const list: UserFavorite[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as UserFavorite);
          });
          setFavorites(list);
          setLocalData(`vloxa_favorites_${currentUser.uid}`, list);
        }, (err) => {
          if (err?.code !== "permission-denied") {
            handleFirestoreError(err, OperationType.GET, "user_favorites");
          }
        });

        // 3. Subscribe to Real-time Domain Requests
        const domainQuery = query(collection(db, "domain_requests"), where("userId", "==", currentUser.uid));
        domainUnsub = onSnapshot(domainQuery, (snap) => {
          const list: DomainRequest[] = [];
          snap.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as DomainRequest);
          });
          setDomainRequests(list);
          setLocalData(`vloxa_domains_${currentUser.uid}`, list);
          setIsLoading(false);
        }, (err) => {
          if (err?.code !== "permission-denied") {
            handleFirestoreError(err, OperationType.GET, "domain_requests");
          }
        });

      } else {
        setUserProfile(null);
        setFavorites([]);
        setDomainRequests([]);
        setIsLoading(false);
      }
    });

    return () => {
      cleanUpSubscribers();
      unsubscribe();
    };
  }, [isFirebaseActive]);

  // Google Login implementation
  const loginWithGoogle = async () => {
    if (!isFirebaseActive || !auth) {
      // Simulate Google login offline
      const mockUid = "gg-" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("vloxa_fallback_uid", mockUid);
      localStorage.setItem("vloxa_fallback_name", "Google User");
      localStorage.setItem("vloxa_fallback_email", "google.user@gmail.com");
      
      const simulatedUser = {
        uid: mockUid,
        displayName: "Google User",
        email: "google.user@gmail.com",
        emailVerified: true,
      } as unknown as User;
      
      setUser(simulatedUser);
      setIsFirebaseActive(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Firebase Login Gagal:", err);
      throw err;
    }
  };

  // Email and Password Login
  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseActive || !auth) {
      // Offline fallback login success simulator
      const mockUid = "em-" + btoa(email).substring(0, 10);
      localStorage.setItem("vloxa_fallback_uid", mockUid);
      localStorage.setItem("vloxa_fallback_name", email.split("@")[0]);
      localStorage.setItem("vloxa_fallback_email", email);
      
      const simulatedUser = {
        uid: mockUid,
        displayName: email.split("@")[0],
        email: email,
        emailVerified: true,
      } as unknown as User;
      
      setUser(simulatedUser);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Login email gagal:", err);
      throw err;
    }
  };

  // Register user manual
  const registerWithEmail = async (name: string, email: string, pass: string) => {
    if (!isFirebaseActive || !auth) {
      const mockUid = "em-" + btoa(email).substring(0, 10);
      localStorage.setItem("vloxa_fallback_uid", mockUid);
      localStorage.setItem("vloxa_fallback_name", name);
      localStorage.setItem("vloxa_fallback_email", email);
      
      const simulatedUser = {
        uid: mockUid,
        displayName: name,
        email: email,
        emailVerified: true,
      } as unknown as User;
      
      setUser(simulatedUser);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName: name });
      }
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

    if (!isFirebaseActive || !auth) {
      return;
    }

    try {
      await signOut(auth);
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

    if (!isFirebaseActive || !db) {
      setUserProfile(updatedProfile);
      setLocalData(`vloxa_profile_${user.uid}`, updatedProfile);
      return;
    }

    const path = `user_profiles/${user.uid}`;
    try {
      await updateDoc(doc(db, "user_profiles", user.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Toggle favoriting / un-favoriting a design template
  const toggleFavorite = async (templateId: string) => {
    if (!user) return;

    const existingFav = favorites.find(f => f.templateId === templateId);

    if (!isFirebaseActive || !db) {
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
      setLocalData(`vloxa_favorites_${user.uid}`, newList);
      return;
    }

    if (existingFav) {
      const favDocPath = `user_favorites/${existingFav.id}`;
      try {
        await deleteDoc(doc(db, "user_favorites", existingFav.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, favDocPath);
      }
    } else {
      const newFavId = `fav-${user.uid}-${templateId}`;
      const favDocPath = `user_favorites/${newFavId}`;
      const newFavorite = {
        userId: user.uid,
        templateId,
        createdAt: serverTimestamp()
      };
      
      try {
        await setDoc(doc(db, "user_favorites", newFavId), newFavorite);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, favDocPath);
      }
    }
  };

  // Request/search a custom domain
  const requestDomain = async (domain: string) => {
    if (!user) return;

    // Clean domain name
    const cleanedDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!cleanedDomain) return;

    const newRequest: Omit<DomainRequest, "id"> = {
      userId: user.uid,
      domainName: cleanedDomain,
      status: "requested",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseActive || !db) {
      const reqId = "req-" + Math.random().toString(36).substring(2, 9);
      const newRequestWithId: DomainRequest = { id: reqId, ...newRequest };
      const newList = [...domainRequests, newRequestWithId];
      setDomainRequests(newList);
      setLocalData(`vloxa_domains_${user.uid}`, newList);
      return;
    }

    const docId = `domain-${user.uid}-${Date.now()}`;
    const path = `domain_requests/${docId}`;
    try {
      await setDoc(doc(db, "domain_requests", docId), {
        ...newRequest,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Delete a requested domain
  const deleteDomainRequest = async (requestId: string) => {
    if (!user) return;

    if (!isFirebaseActive || !db) {
      const newList = domainRequests.filter(r => r.id !== requestId);
      setDomainRequests(newList);
      setLocalData(`vloxa_domains_${user.uid}`, newList);
      return;
    }

    const path = `domain_requests/${requestId}`;
    try {
      await deleteDoc(doc(db, "domain_requests", requestId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
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
    if (!isFirebaseActive || !db) {
      // Offline fallback load from localStorage if exists
      const fallback = getLocalData<string[]>("vloxa_featured_templates", ["tokora", "fs-2", "ev-2", "ly-1", "tr-2"]);
      setFeaturedTemplateIds(fallback);
      return;
    }

    const unsub = onSnapshot(doc(db, "app_config", "featured"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.templateIds)) {
          setFeaturedTemplateIds(data.templateIds);
          // Persist to local cache as fallback
          setLocalData("vloxa_featured_templates", data.templateIds);
        }
      } else {
        // If it doesn't exist, keep/set fallback
        const currentFallback = getLocalData<string[]>("vloxa_featured_templates", ["tokora", "fs-2", "ev-2", "ly-1", "tr-2"]);
        setFeaturedTemplateIds(currentFallback);
      }
    }, (err) => {
      console.warn("Failed to subscribe to featured templates:", err);
    });

    return () => unsub();
  }, [isFirebaseActive]);

  // Update Featured Templates (Admin only)
  const updateFeaturedTemplates = async (ids: string[]) => {
    // Check if current user is admin
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    // Update local state and storage first (optimistic update)
    setFeaturedTemplateIds(ids);
    setLocalData("vloxa_featured_templates", ids);

    if (!isFirebaseActive || !db) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can update featured templates configuration.");
      return;
    }

    const path = "app_config/featured";
    try {
      await setDoc(doc(db, "app_config", "featured"), {
        templateIds: ids,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Subscribe to Dynamic Custom Templates (independent of logged-in state)
  useEffect(() => {
    if (!isFirebaseActive || !db) {
      // Offline fallback load from localStorage
      const fallback = getLocalData<Template[]>("vloxa_custom_templates", []);
      setCustomTemplates(fallback);
      return;
    }

    const unsub = onSnapshot(collection(db, "custom_templates"), (snapshot) => {
      const list: Template[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Template);
      });
      // Sort newer custom templates first based on id or timestamp
      list.sort((a, b) => {
        const dateA = a.createdAt || "";
        const dateB = b.createdAt || "";
        return dateB.localeCompare(dateA);
      });
      setCustomTemplates(list);
      setLocalData("vloxa_custom_templates", list);
    }, (err) => {
      console.warn("Failed to subscribe to custom templates:", err);
    });

    return () => unsub();
  }, [isFirebaseActive]);

  // Add a new Custom Template (Admin only)
  const addCustomTemplate = async (templateData: Omit<Template, "id">) => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    const id = "custom-" + Math.random().toString(36).substring(2, 11);
    const newTemplate: Template = {
      id,
      ...templateData,
    };

    // Optimistic update
    const updatedList = [newTemplate, ...customTemplates];
    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !db) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can add custom templates.");
      return;
    }

    const path = `custom_templates/${id}`;
    try {
      await setDoc(doc(db, "custom_templates", id), {
        title: templateData.title,
        category: templateData.category,
        categoryLabel: templateData.categoryLabel,
        image: templateData.image,
        demoUrl: templateData.demoUrl,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Delete a Custom Template (Admin only)
  const deleteCustomTemplate = async (id: string) => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    const updatedList = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !db) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can delete custom templates.");
      return;
    }

    const path = `custom_templates/${id}`;
    try {
      await deleteDoc(doc(db, "custom_templates", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Update an existing Custom Template (Admin only)
  const updateCustomTemplate = async (id: string, templateData: Omit<Template, "id" | "createdAt">) => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    // Optimistic update
    const updatedList = customTemplates.map(t => t.id === id ? { ...t, ...templateData } : t);
    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !db) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can edit custom templates.");
      return;
    }

    const path = `custom_templates/${id}`;
    try {
      await updateDoc(doc(db, "custom_templates", id), {
        title: templateData.title,
        category: templateData.category,
        categoryLabel: templateData.categoryLabel,
        image: templateData.image,
        demoUrl: templateData.demoUrl
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Import all static TEMPLATES into firebase "custom_templates" or localStorage "vloxa_custom_templates"
  const importAllBaselineTemplates = async () => {
    const userEmail = user?.email || "";
    const isAdminUser = userEmail === "fyanit57@gmail.com" || userProfile?.role === "admin";

    // Filter which baseline templates are already in customTemplates to avoid duplicating
    const existingIds = new Set(customTemplates.map(t => t.id));
    const toImport = TEMPLATES.filter(t => !existingIds.has(t.id));

    if (toImport.length === 0) {
      return;
    }

    const nowStr = new Date().toISOString();
    
    // Create new list
    const importedTemplates = toImport.map(t => ({
      ...t,
      createdAt: nowStr
    }));

    const updatedList = [...customTemplates, ...importedTemplates];
    
    // Sort so custom templates sorted by createdAt newer first
    updatedList.sort((a, b) => {
      const dateA = a.createdAt || "";
      const dateB = b.createdAt || "";
      return dateB.localeCompare(dateA);
    });

    setCustomTemplates(updatedList);
    setLocalData("vloxa_custom_templates", updatedList);

    if (!isFirebaseActive || !db) {
      return;
    }

    if (!isAdminUser) {
      console.error("Only admin can import templates.");
      return;
    }

    try {
      // Chunk imports in batches of 20 to prevent huge single transactions, though 78 is safe (limit is 500)
      const batchSize = 100;
      for (let i = 0; i < toImport.length; i += batchSize) {
        const chunk = toImport.slice(i, i + batchSize);
        const batch = writeBatch(db);
        chunk.forEach((t) => {
          const docRef = doc(db, "custom_templates", t.id);
          batch.set(docRef, {
            title: t.title,
            category: t.category,
            categoryLabel: t.categoryLabel,
            image: t.image,
            demoUrl: t.demoUrl,
            createdAt: nowStr
          });
        });
        await batch.commit();
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
      deactivateAdmin,
      quotaExceeded,
      quotaErrorMessage
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

import { createClient } from "@supabase/supabase-js";

// Fetch from Vite's public client environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

// Check if we are running in local/fallback storage mode
export const isSupabasePlaceholderConfig = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.trim() === "" || 
  supabaseAnonKey.trim() === "" ||
  supabaseUrl.includes("your_supabase_project_url") ||
  supabaseAnonKey.includes("your_supabase_anon_public_key");

export let supabase: any = null;

try {
  if (!isSupabasePlaceholderConfig) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }
} catch (error) {
  console.warn("Supabase initialization error. App will run in offline fallback mode:", error);
  supabase = null;
}

// Error structuring and diagnostic utilities for Supabase transactions
export enum SupabaseOperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: SupabaseOperationType;
  table: string;
  userId?: string | null;
}

export function handleSupabaseError(error: unknown, operationType: SupabaseOperationType, table: string, userId?: string | null) {
  const errMessage = error instanceof Error ? error.message : (typeof error === "object" && error !== null && "message" in error) ? (error as any).message : String(error);
  const errInfo: SupabaseErrorInfo = {
    error: errMessage,
    userId: userId || null,
    operationType,
    table,
  };
  console.error("Supabase Operation Error details:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test / Ping connection to check if Supabase is alive
export async function testSupabaseConnection(): Promise<boolean> {
  if (isSupabasePlaceholderConfig || !supabase) {
    console.log("Supabase is currently running in fallback local storage mode.");
    return false;
  }
  try {
    // Ping with a dummy read
    const { error } = await supabase.from("user_profiles").select("user_id").limit(1);
    if (error && error.code !== "PGRST116" && error.code !== "PGRST204") {
      // PGRST116 means no row returned, which is fine
      // Let's print details but consider online unless specific connection failures occur
      console.warn("Supabase ping returned error: ", error.message);
    } else {
      console.log("Supabase Connection verified successfully.");
    }
    return true;
  } catch (error) {
    console.error("Supabase connection check failed:", error);
    return false;
  }
}

// Map JavaScript fields to PostgreSQL snake_case columns
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const snake: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const sKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snake[sKey] = val;
  }
  return snake;
}

// Map PostgreSQL snake_case columns back to camelCase JavaScript fields
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const camel: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const cKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""));
    camel[cKey] = val;
  }
  return camel;
}

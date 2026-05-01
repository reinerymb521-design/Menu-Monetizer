import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  /** Comes from `profiles.is_premium` OR `perfiles.es_premium` (whichever exists).
   *  Always reflects the user's current premium status regardless of which table
   *  your Supabase project uses. */
  is_premium: boolean;
  follower_count: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  /** Convenience shortcut — true when the user has premium access.
   *  Derived from `perfiles.es_premium` (primary) with fallback to
   *  `profiles.is_premium` so existing UI keeps working unchanged. */
  isPremium: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isPremium: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Fetch data from `perfiles` (new Spanish table) ──────────────────────────
async function fetchPerfiles(userId: string) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("display_name, avatar_url, es_premium")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    // Table may not yet exist in some environments — log silently.
    console.warn("[auth] perfiles query:", error.message);
  }
  return data ?? null;
}

// ── Fetch data from legacy `profiles` table ──────────────────────────────────
async function fetchProfiles(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_premium, follower_count")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[auth] profiles query:", error.message);
  }
  return data ?? null;
}

// ── Merge both tables into a single ProfileData object ───────────────────────
async function resolveProfile(userId: string): Promise<ProfileData | null> {
  const [perf, prof] = await Promise.all([
    fetchPerfiles(userId),
    fetchProfiles(userId),
  ]);

  if (!perf && !prof) return null;

  // `perfiles.es_premium` takes priority; fall back to `profiles.is_premium`.
  const is_premium =
    perf != null
      ? Boolean(perf.es_premium)
      : Boolean(prof?.is_premium ?? false);

  return {
    display_name: perf?.display_name ?? prof?.display_name ?? null,
    avatar_url: perf?.avatar_url ?? prof?.avatar_url ?? null,
    is_premium,
    follower_count: prof?.follower_count ?? 0,
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const refreshProfile = async (userId: string) => {
    const data = await resolveProfile(userId);
    if (data) setProfile(data);
  };

  useEffect(() => {
    const applySession = (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      userIdRef.current = s?.user?.id ?? null;
      if (s?.user) {
        // Defer so the auth state change handler returns first.
        setTimeout(() => refreshProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s);
    });

    // Hydrate immediately from cached session.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s);
    });

    // Allow PayPal success (and other external events) to trigger a refresh.
    const onRefresh = () => {
      const id = userIdRef.current;
      if (id) refreshProfile(id);
    };
    window.addEventListener("audiverse:profile-refresh", onRefresh);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("audiverse:profile-refresh", onRefresh);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isPremium = profile?.is_premium ?? false;

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isPremium, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

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
  es_premium: boolean;
  es_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isPremium: false,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function emailToName(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.split("@")[0] ?? null;
}

async function fetchPerfil(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("correo_electronico, avatar_url, es_premium, es_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[auth] perfiles query:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    display_name: emailToName((data as any).correo_electronico),
    avatar_url: (data as any).avatar_url ?? null,
    es_premium: Boolean((data as any).es_premium),
    es_admin: Boolean((data as any).es_admin),
  };
}

async function fetchPerfilByEmail(email: string): Promise<{ row: any } | null> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("user_id, correo_electronico, avatar_url, es_premium, es_admin")
    .eq("correo_electronico", email)
    .maybeSingle();
  if (error || !data) return null;
  return { row: data };
}

async function upsertPerfil(user: User): Promise<ProfileData | null> {
  const email = user.email ?? null;

  /* Si la fila ya existe por email pero sin user_id, la vinculamos */
  if (email) {
    const found = await fetchPerfilByEmail(email);
    if (found && !found.row.user_id) {
      await supabase
        .from("perfiles")
        .update({ user_id: user.id, avatar_url: user.user_metadata?.avatar_url ?? null })
        .eq("correo_electronico", email);
      return fetchPerfil(user.id);
    }
    if (found && found.row.user_id === user.id) {
      /* Ya vinculada — devuelve directamente */
      return {
        display_name: emailToName(found.row.correo_electronico),
        avatar_url: found.row.avatar_url ?? null,
        es_premium: Boolean(found.row.es_premium),
        es_admin: Boolean(found.row.es_admin),
      };
    }
  }

  /* Crea fila nueva si no existe */
  const { error } = await supabase.from("perfiles").upsert(
    {
      user_id: user.id,
      correo_electronico: email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      es_premium: false,
      es_admin: false,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (error) console.warn("[auth] perfiles upsert:", error.message);
  return fetchPerfil(user.id);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const refreshProfile = async (u: User) => {
    let data = await fetchPerfil(u.id);
    if (!data) data = await upsertPerfil(u);
    if (data) setProfile(data);
  };

  useEffect(() => {
    const applySession = (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      userIdRef.current = s?.user?.id ?? null;
      if (s?.user) {
        setTimeout(() => refreshProfile(s.user), 0);
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

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s);
    });

    const onRefresh = () => {
      const id = userIdRef.current;
      const u = user;
      if (id && u) refreshProfile(u);
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

  const isPremium = profile?.es_premium ?? false;
  const isAdmin = profile?.es_admin ?? false;

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isPremium, isAdmin, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

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

async function rowToProfile(row: any): Promise<ProfileData> {
  return {
    display_name: emailToName(row.correo_electronico ?? row.email ?? null),
    avatar_url: row.avatar_url ?? null,
    es_premium: Boolean(row.es_premium),
    es_admin: Boolean(row.es_admin),
  };
}

/* Intenta buscar por `id` (clave primaria = auth.uid) primero,
   luego por `user_id` como columna separada (schemas alternativos) */
async function fetchPerfil(userId: string): Promise<ProfileData | null> {
  /* Intento 1 — id = userId (esquema donde id es FK a auth.users) */
  const { data: d1 } = await supabase
    .from("perfiles")
    .select("correo_electronico, avatar_url, es_premium, es_admin")
    .eq("id", userId)
    .maybeSingle();
  if (d1) return rowToProfile(d1);

  /* Intento 2 — user_id = userId (esquema con columna separada) */
  const { data: d2 } = await supabase
    .from("perfiles")
    .select("correo_electronico, avatar_url, es_premium, es_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if (d2) return rowToProfile(d2);

  return null;
}

async function fetchPerfilByEmail(email: string): Promise<any | null> {
  const { data } = await supabase
    .from("perfiles")
    .select("id, user_id, correo_electronico, avatar_url, es_premium, es_admin")
    .eq("correo_electronico", email)
    .maybeSingle();
  return data ?? null;
}

async function upsertPerfil(user: User): Promise<ProfileData | null> {
  const email = user.email ?? null;

  /* Si existe una fila con ese email, la usamos (puede que id = UUID de auth) */
  if (email) {
    const found = await fetchPerfilByEmail(email);
    if (found) {
      return rowToProfile(found);
    }
  }

  /* Crea fila nueva — intenta con `id` como PK primero */
  const { error: e1 } = await supabase.from("perfiles").upsert(
    {
      id: user.id,
      correo_electronico: email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      es_premium: false,
      es_admin: false,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  if (e1) {
    /* Fallback: esquema con user_id */
    const { error: e2 } = await supabase.from("perfiles").upsert(
      {
        user_id: user.id,
        correo_electronico: email,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        es_premium: false,
        es_admin: false,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    if (e2) console.warn("[auth] perfiles upsert:", e2.message);
  }

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

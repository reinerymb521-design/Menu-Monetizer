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
  avatar_url:   string | null;
  es_premium:   boolean;
  es_admin:     boolean;
}

interface AuthContextType {
  user:      User | null;
  session:   Session | null;
  profile:   ProfileData | null;
  isPremium: boolean;
  isAdmin:   boolean;
  loading:   boolean;
  signOut:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null,
  isPremium: false, isAdmin: false, loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/* ── helpers ─────────────────────────────────────────────────── */
function emailToName(email: string | null | undefined): string | null {
  return email ? (email.split("@")[0] ?? null) : null;
}

function rowToProfile(row: any): ProfileData {
  return {
    display_name: emailToName(row.correo_electronico ?? row.email ?? null),
    avatar_url:   row.avatar_url  ?? null,
    es_premium:   Boolean(row.es_premium),
    es_admin:     Boolean(row.es_admin),
  };
}

/* Columnas a seleccionar — nunca incluimos "user_id" (no existe) */
const PERFIL_COLS = "id, correo_electronico, avatar_url, es_premium, es_admin";

/**
 * Carga el perfil.
 * Usa arrays (no maybeSingle) para manejar filas duplicadas sin errores.
 * Preferencia: fila con es_admin=true > fila con es_premium=true > primera fila.
 */
async function loadPerfil(user: User): Promise<ProfileData | null> {
  /* Reúne TODAS las filas que coincidan por id o por correo */
  const results: any[] = [];

  const { data: byId } = await supabase
    .from("perfiles")
    .select(PERFIL_COLS)
    .eq("id", user.id);
  if (byId) results.push(...byId);

  if (user.email) {
    const { data: byEmail } = await supabase
      .from("perfiles")
      .select(PERFIL_COLS)
      .eq("correo_electronico", user.email);
    if (byEmail) {
      /* Agrega solo las filas que no estén ya en results (evita duplicados) */
      for (const row of byEmail) {
        if (!results.find((r) => r.id === row.id)) results.push(row);
      }
    }
  }

  if (results.length === 0) return null;

  /* Elige la mejor fila: admin > premium > primera */
  const best =
    results.find((r) => r.es_admin) ??
    results.find((r) => r.es_premium) ??
    results[0];

  return rowToProfile(best);
}

/**
 * Crea perfil solo si no existe ninguna fila para este usuario.
 */
async function createPerfil(user: User): Promise<ProfileData | null> {
  /* Verifica primero: si ya hay filas por email, no crear nada nuevo */
  if (user.email) {
    const { data: existing } = await supabase
      .from("perfiles")
      .select("id")
      .eq("correo_electronico", user.email);
    if (existing && existing.length > 0) return loadPerfil(user);
  }

  const { error } = await supabase.from("perfiles").upsert(
    {
      id:                  user.id,
      correo_electronico:  user.email ?? null,
      avatar_url:          user.user_metadata?.avatar_url ?? null,
      es_premium:          false,
      es_admin:            false,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) console.warn("[auth] create perfil:", error.message);
  return loadPerfil(user);
}

/* ── Provider ────────────────────────────────────────────────── */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  /* Ref para acceder al usuario actual dentro de callbacks/events */
  const userRef = useRef<User | null>(null);

  const refreshProfile = async (u: User) => {
    let data = await loadPerfil(u);
    if (!data)  data = await createPerfil(u);
    if (data)   setProfile(data);
  };

  useEffect(() => {
    const applySession = (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      userRef.current = s?.user ?? null;

      if (s?.user) {
        /* Carga perfil de forma asíncrona sin bloquear el render */
        refreshProfile(s.user).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    /* Escucha cambios de sesión (login / logout / token refresh) */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      applySession(s);
    });

    /* Carga sesión inicial */
    supabase.auth.getSession().then(({ data: { session: s } }) => applySession(s));

    /* Evento para forzar recarga del perfil (ej: tras canjear código) */
    const onForceRefresh = () => {
      if (userRef.current) refreshProfile(userRef.current);
    };
    window.addEventListener("audiverse:profile-refresh", onForceRefresh);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("audiverse:profile-refresh", onForceRefresh);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isPremium = profile?.es_premium ?? false;
  const isAdmin   = profile?.es_admin   ?? false;

  return (
    <AuthContext.Provider value={{ user, session, profile, isPremium, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

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
  es_administrador?: boolean;
  perfil_publico: boolean;
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

function rowToProfile(row: any, roleIsAdmin = false): ProfileData {
  return {
    display_name: emailToName(row.correo_electronico ?? row.email ?? null),
    avatar_url:   row.avatar_url  ?? null,
    es_premium:   Boolean(row.es_premium),
    es_admin:     Boolean(row.es_admin) || Boolean(row.es_administrador) || roleIsAdmin,
    es_administrador: Boolean(row.es_administrador) || Boolean(row.es_admin) || roleIsAdmin,
    perfil_publico: row.perfil_publico !== false,
  };
}

/*
 * Keep this query limited to columns present in the Spanish production table.
 * Optional profile fields are still supported by rowToProfile when they exist,
 * but requesting them here would make the whole query fail on older schemas.
 */
const PERFIL_ADMIN_COLS = "id, correo_electronico, es_admin";

/**
 * Carga el perfil.
 * Usa arrays (no maybeSingle) para manejar filas duplicadas sin errores.
 * Preferencia: fila con es_admin=true > fila con es_premium=true > primera fila.
 */
async function loadPerfil(user: User): Promise<ProfileData | null> {
  /* Reúne las filas que coincidan por id o por correo. */
  const results: any[] = [];

  /*
   * La función vive en Supabase y aplica la misma regla de administrador
   * usando SECURITY DEFINER. Es importante consultarla aunque RLS no permita
   * leer la fila completa de perfiles.
   */
  const { data: serverAdmin, error: serverAdminError } = await (supabase as any)
    .rpc("is_audiverse_admin");
  if (serverAdminError) {
    console.warn("[auth] admin RPC lookup:", serverAdminError.message);
  }
  const functionIsAdmin = serverAdmin === true;

  if (user.email) {
    const { data: byEmail, error: byEmailError } = await (supabase.from("perfiles") as any)
      .select(PERFIL_ADMIN_COLS)
      .eq("correo_electronico", user.email);
    if (byEmailError) {
      console.warn("[auth] perfil lookup by email:", byEmailError.message);
    }
    if (byEmail) {
      /* Agrega solo las filas que no estén ya en results. */
      for (const row of byEmail) {
        if (!results.find((r) => r.id === row.id)) results.push(row);
      }
    }
  }

  if (results.length === 0) {
    const { data: byId, error: byIdError } = await (supabase.from("perfiles") as any)
      .select(PERFIL_ADMIN_COLS)
      .eq("id", user.id);
    if (byIdError) {
      console.warn("[auth] perfil lookup by id:", byIdError.message);
    }
    if (byId) results.push(...byId);
  }

  /* Consulta el rol por separado para que un perfil incompleto no oculte a un admin. */
  const { data: roles } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const roleIsAdmin =
    functionIsAdmin ||
    Boolean(roles?.some((role: { role: string }) => role.role === "admin"));

  if (results.length === 0) {
    return roleIsAdmin
      ? rowToProfile({ correo_electronico: user.email }, true)
      : null;
  }

  /* Una fila marcada como admin siempre tiene prioridad. */
  const best = results.find((r) => r.es_admin || r.es_administrador) ?? results[0];
  return rowToProfile(best, roleIsAdmin);
}

/**
 * Crea perfil solo si no existe ninguna fila para este usuario.
 */
    async function createPerfil(user: User): Promise<ProfileData | null> {
    const { error } = await (supabase.from("perfiles") as any).upsert(
      {
        id: user.id,
        correo_electronico: user.email ?? null,
        es_admin: false,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("[auth] create perfil error:", error.message);
    }

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
    const refreshProfile = async (u: User) => {
      let data = await loadPerfil(u);
      if (!data) {
        data = await createPerfil(u);
      }
      if (data) {
        setProfile(data);
      }
    };

    const applySession = async (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      userRef.current = s?.user ?? null;

      if (s?.user) {
        await refreshProfile(s.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    // Escucha cambios de sesión en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => {
      applySession(s);
    });

    // Carga sesión inicial al abrir la app
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s);
    });

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

  // Administrators bypass VIP gating without needing a code or subscription.
  const isPremium = Boolean(profile?.es_premium || profile?.es_admin);
  const isAdmin   = Boolean(profile?.es_admin || profile?.es_administrador);

  return (
    <AuthContext.Provider value={{ user, session, profile, isPremium, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom"; // O tu sistema de navegación

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Consultamos la tabla perfiles para ver si es_admin es true
        const { data } = await supabase
          .from("perfiles")
          .select("es_admin")
          .eq("id", user.id)
          .single();
        
        setIsAdmin(data?.es_admin || false);
      }
    };
    checkAdmin();
  }, []);

  return (
    <nav className="p-4 flex justify-between items-center bg-black/20">
      <Link to="/" className="text-xl font-bold">Audioverso</Link>
      
      <div className="flex gap-4">
        {/* Aquí va el resto de tu navegación */}
        
        {/* Solo mostramos el panel de Admin si el usuario es administrador */}
        {isAdmin && (
          <Link to="/admin" className="text-primary font-bold">
            Panel Admin
          </Link>
        )}
      </div>
    </nav>
  );
}

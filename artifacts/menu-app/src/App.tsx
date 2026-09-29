import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SettingsProvider } from "@/hooks/useSettings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BookReader from "./components/BookReader";
import AudioPlayer from "./components/AudioPlayer";
import MiniAudioPlayer from "./components/MiniAudioPlayer";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import LoginScreen from "./components/LoginScreen";

const queryClient = new QueryClient();

const paypalClientId = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string) || "test";

// Creamos un componente intermedio para manejar la lógica de redirección
const AppContent = () => {
  const { user, loading } = useAuth();

  // Mientras Supabase verifica la sesión, mostramos un estado de carga
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no hay usuario, obligamos a ver la pantalla de Login
  if (!user) {
    return <LoginScreen />;
  }

  // Si hay usuario, renderizamos la aplicación principal
  return (
    <SettingsProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AudioPlayerProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/read/:id" element={<BookReader />} />
            <Route path="/listen/:id" element={<AudioPlayer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MiniAudioPlayer />
        </AudioPlayerProvider>
      </BrowserRouter>
    </SettingsProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: "USD",
        intent: "subscription",
        vault: true,
        components: "buttons",
      }}
    >
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </PayPalScriptProvider>
  </QueryClientProvider>
);

export default App;

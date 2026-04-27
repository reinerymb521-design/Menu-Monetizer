import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/components/LoginScreen";
import AppLayout from "@/components/AppLayout";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="loader-spinner" />
        <p className="text-muted-foreground text-sm">Sintonizando la señal...</p>
      </div>
    );
  }

  return user ? <AppLayout /> : <LoginScreen />;
}

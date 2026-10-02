import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/components/LoginScreen";
import AppLayout from "@/components/AppLayout";
import LoadingScreen from "@/components/LoadingScreen";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Sintonizando la señal..." />;
  }

  return user ? <AppLayout /> : <LoginScreen />;
}

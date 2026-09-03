import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SignInCard } from "@/components/ui/sign-in-card";

export default function LoginPage() {
  const { login, register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    navigate("/");
  };

  const handleRegister = async (email: string, password: string) => {
    await register(email, password);
    navigate("/");
  };

  return (
    <SignInCard
      mode="login"
      onLogin={handleLogin}
      onRegister={handleRegister}
      loading={loading}
      error={error}
    />
  );
}

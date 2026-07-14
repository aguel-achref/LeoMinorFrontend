import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Vide le token peu importe où il a été stocké
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");

    // On peut aussi vider les identifiants "remember me" si tu veux forcer une saisie complète
    // localStorage.removeItem("rememberedEmail");
    // localStorage.removeItem("rememberedPassword");

    navigate("/authentication/sign-in", { replace: true });
  }, [navigate]);

  return null;
}

export default Logout;

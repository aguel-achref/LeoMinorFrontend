/**
 * Décode la partie payload d'un JWT (base64url) en objet JS, sans dépendance
 * externe (pas de vérification de signature : uniquement pour lire les
 * infos côté client, la vérification réelle se fait côté backend).
 *
 * Retourne null si le token est absent, malformé, ou non décodable.
 */
export function decodeToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    // JWT utilise le base64url (remplace +/ par -_ et retire le padding =)
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erreur lors du décodage du token:", error);
    return null;
  }
}

/**
 * Récupère le token JWT stocké (mêmes clés que l'intercepteur axiosConfig.js)
 * et retourne le prénom de l'utilisateur connecté, ou null si indisponible.
 *
 * Essaie plusieurs noms de champ possibles (first_name, firstName, prenom)
 * pour rester tolérant selon la structure exacte du payload backend.
 */
export function getConnectedUserFirstName() {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const payload = decodeToken(token);

  if (!payload) return null;

  return payload.first_name || payload.firstName || payload.prenom || null;
}

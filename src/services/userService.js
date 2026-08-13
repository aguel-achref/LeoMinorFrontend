import api from "services/axiosConfig";

/**
 * Récupère les informations de l'utilisateur actuellement connecté
 * (prénom, nom, email) via GET /api/users/me.
 */
export async function fetchCurrentUser() {
  const response = await api.get("/users/me");
  return response.data.data; // { id, first_name, last_name, email }
}

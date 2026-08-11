import api from "services/axiosConfig";

/**
 * Récupère les statistiques agrégées pour le dashboard
 * (totaux, répartition par statut/client/chaîne, commandes en alerte).
 *
 * @returns {Promise<{
 *   totalCommandes: number,
 *   totalClients: number,
 *   commandesParStatut: { label: string, count: number }[],
 *   commandesParClient: { label: string, count: number }[],
 *   commandesParChaine: { label: string, count: number }[],
 *   commandesAlerte: object[]
 * }>}
 */
export async function fetchDashboardSummary() {
  const response = await api.get("/dashboard/summary");
  return response.data.data; // on ne garde que le payload utile
}

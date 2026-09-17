// frontend/src/services/saisieHoraireService.js
//
// Adapte l'import ci-dessous à ton client API existant
// (même pattern que dashboardService.js — axios instance avec baseURL + token)

import api from "services/axiosConfig";

const BASE_URL = "/saisie-horaire";

// Liste fixe des chaînes (CH1 à CH15) — pas besoin d'appel API, c'est fixe
export const CHAINES = Array.from({ length: 15 }, (_, i) => `CH${i + 1}`);

// Récupère les créneaux d'UNE chaîne à UNE date précise (utilisé par le formulaire de saisie)
export async function fetchSaisies(chaine, date) {
  const response = await api.get(`${BASE_URL}/getSaisieHoraire`, {
    params: { chaine, date },
  });
  return response.data.data; // tableau de créneaux
}

// Récupère TOUTES les saisies (toutes chaînes/dates), avec filtres optionnels et pagination
// (utilisé par le tableau global sous le formulaire)
export async function fetchAllSaisies({
  chaine = "",
  dateDebut = "",
  dateFin = "",
  page = 1,
  limit = 20,
} = {}) {
  const params = { page, limit };
  if (chaine) params.chaine = chaine;
  if (dateDebut) params.date_debut = dateDebut;
  if (dateFin) params.date_fin = dateFin;

  const response = await api.get(`${BASE_URL}/getSaisieHoraire`, { params });
  return response.data; // { success, data, pagination }
}

export async function saveSaisies(chaine, date, entries) {
  const response = await api.post(`${BASE_URL}/saveSaisieHoraire`, {
    chaine,
    date,
    entries,
  });
  return response.data; // { success, message, data }
}

export async function deleteSaisie(id) {
  const response = await api.delete(`${BASE_URL}/deleteSaisieHoraire/${id}`);
  return response.data;
}

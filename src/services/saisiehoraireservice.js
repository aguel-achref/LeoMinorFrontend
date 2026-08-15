// frontend/src/services/saisieHoraireService.js
//
// Adapte l'import ci-dessous à ton client API existant
// (même pattern que dashboardService.js — axios instance avec baseURL + token)

import api from "services/axiosConfig";

const BASE_URL = "/saisie-horaire";

// Liste fixe des chaînes (CH1 à CH15) — pas besoin d'appel API, c'est fixe
export const CHAINES = Array.from({ length: 15 }, (_, i) => `CH${i + 1}`);

export async function fetchSaisies(chaine, date) {
  const response = await api.get(`${BASE_URL}/getSaisieHoraire`, {
    params: { chaine, date },
  });
  return response.data.data; // tableau de créneaux
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

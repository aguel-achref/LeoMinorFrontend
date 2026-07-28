import { useState } from "react";
import api from "services/axiosConfig";
import MDButton from "components/MDButton";
import Icon from "@mui/material/Icon";

/**
 * Bouton d'export Excel de toutes les commandes.
 * Appelle GET /commandes/export (backend) et déclenche le téléchargement
 * du fichier .xlsx généré côté serveur.
 *
 * Sécurité : si le serveur répond une erreur JSON (401, 404, 500...) au lieu
 * du fichier Excel, axios la reçoit quand même en tant que blob binaire.
 * On vérifie donc le Content-Type de la réponse avant de déclencher le
 * téléchargement, pour éviter un fichier .xlsx corrompu/illisible.
 */
function ExportCommande() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.get("/commandes/export", {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || "";

      // Le backend n'a pas renvoyé un fichier Excel : c'est une erreur JSON
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || "Erreur inconnue lors de l'export.");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const dateStr = new Date().toISOString().split("T")[0];

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `commandes_export_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export des commandes:", error);
      alert(error.message || "Erreur lors de l'export Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MDButton
      variant="gradient"
      color="white"
      size="small"
      onClick={handleExport}
      disabled={loading}
      startIcon={<Icon>file_download</Icon>}
    >
      {loading ? "Export en cours..." : "Exporter Excel"}
    </MDButton>
  );
}

export default ExportCommande;

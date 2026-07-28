import { useState } from "react";
import api from "services/axiosConfig";
import MDButton from "components/MDButton";
import Icon from "@mui/material/Icon";

/**
 * Bouton d'export Excel de toutes les commandes.
 * Appelle GET /commandes/export (backend) et déclenche le téléchargement
 * du fichier .xlsx généré côté serveur.
 */
function ExportCommande() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.get("/commandes/getAllCommandes", {
        responseType: "blob", // nécessaire pour recevoir un fichier binaire
      });

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
      alert("Erreur lors de l'export Excel.");
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

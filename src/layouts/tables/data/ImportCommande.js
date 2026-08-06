import { useState, useRef } from "react";
import PropTypes from "prop-types";
import api from "services/axiosConfig";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

/**
 * Bouton + popup d'import Excel. Envoie le fichier au backend
 * (POST /commandes/importCommandes) avec le client choisi ici.
 *
 * chaine et objectif ne sont pas demandés à l'import : ils sont mis à
 * vide/0 côté backend pour toutes les lignes importées, à corriger ensuite
 * directement dans le tableau (popup de modification existante).
 *
 * Props :
 * - clients : liste des clients (même format que dans Tables.jsx), pour
 *   remplir le Select
 * - onImported : callback appelé après un import réussi (ex: fetchCommandes)
 */
function ImportCommande({ clients, onImported }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [client, setClient] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("error");
  const fileInputRef = useRef(null);

  const handleOpen = () => {
    setFile(null);
    setClient("");
    setMessage("");
    setOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleSubmit = async () => {
    setMessage("");

    if (!file) {
      setMessageColor("error");
      setMessage("Choisis un fichier Excel (.xlsx) à importer.");
      return;
    }
    if (!client) {
      setMessageColor("error");
      setMessage("Choisis le client à appliquer aux commandes importées.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("client", client);

    setLoading(true);
    try {
      const response = await api.post("/commandes/importCommandes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { imported, skipped } = response.data;
      setMessageColor("success");
      setMessage(
        `${imported} commande(s) importée(s)` +
          (skipped ? `, ${skipped} ligne(s) ignorée(s) (dates manquantes).` : ".")
      );

      if (onImported) onImported();

      // Ferme automatiquement la popup après un court délai pour laisser
      // le message de succès visible
      setTimeout(() => setOpen(false), 1500);
    } catch (error) {
      console.error("Erreur lors de l'import des commandes:", error);
      setMessageColor("error");
      setMessage(error.response?.data?.message || "Erreur lors de l'import du fichier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MDButton
        variant="outlined"
        color="white"
        size="small"
        onClick={handleOpen}
        startIcon={<Icon>upload_file</Icon>}
      >
        Importer
      </MDButton>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Importer des commandes depuis Excel</DialogTitle>
        <DialogContent>
          <MDBox mb={3} mt={1}>
            <MDTypography variant="caption" color="text" mb={0.5} display="block">
              Fichier Excel (.xlsx)
            </MDTypography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={loading}
            />
          </MDBox>

          <FormControl fullWidth disabled={loading}>
            <InputLabel id="import-client-label">Client</InputLabel>
            <Select
              labelId="import-client-label"
              label="Client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              sx={{ height: "45px" }}
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.nom}>
                  {c.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <MDTypography variant="caption" color="text" mt={2} display="block">
            La chaîne et l&apos;objectif ne sont pas dans le fichier : ils seront laissés vides/à 0
            et à corriger ensuite ligne par ligne dans le tableau.
          </MDTypography>

          {message && (
            <MDTypography variant="button" color={messageColor} mt={2} display="block">
              {message}
            </MDTypography>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton variant="outlined" color="dark" onClick={handleClose} disabled={loading}>
            Annuler
          </MDButton>
          <MDButton variant="gradient" color="info" onClick={handleSubmit} disabled={loading}>
            {loading ? "Import en cours..." : "Importer"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

ImportCommande.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      nom: PropTypes.string,
    })
  ).isRequired,
  onImported: PropTypes.func,
};

ImportCommande.defaultProps = {
  onImported: null,
};

export default ImportCommande;

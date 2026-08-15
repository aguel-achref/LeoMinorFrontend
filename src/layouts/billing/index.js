/**
 * frontend/src/layouts/saisie-chaine/index.js
 *
 * Page de saisie horaire (prévu / réel) par chaîne de production (CH1 à CH15).
 * L'utilisateur choisit une chaîne + une date, puis ajoute librement
 * des créneaux horaires (heure_debut / heure_fin variables) avec
 * la quantité prévue et la quantité réelle produite.
 */

import { useState, useEffect, useCallback } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert";

// Material Dashboard 2 React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Services
import { fetchSaisies, saveSaisies, CHAINES } from "services/saisieHoraireService";

const emptyRow = () => ({
  id: null,
  heure_debut: "",
  heure_fin: "",
  produit: "",
  quantite_prevue: "",
  quantite_reelle: "",
});

function SaisieChaine() {
  const [chaine, setChaine] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", message }

  const loadSaisies = useCallback(async () => {
    if (!chaine || !date) return;
    setLoading(true);
    setFeedback(null);
    try {
      const data = await fetchSaisies(chaine, date);
      setRows(
        data.length > 0
          ? data.map((d) => ({
              id: d.id,
              heure_debut: d.heure_debut?.slice(0, 5) || "",
              heure_fin: d.heure_fin?.slice(0, 5) || "",
              produit: d.produit || "",
              quantite_prevue: d.quantite_prevue ?? "",
              quantite_reelle: d.quantite_reelle ?? "",
            }))
          : [emptyRow()]
      );
    } catch (err) {
      console.error("Erreur chargement saisies:", err);
      setFeedback({ type: "error", message: "Impossible de charger les créneaux existants." });
    } finally {
      setLoading(false);
    }
  }, [chaine, date]);

  // Recharger les créneaux quand la chaîne ou la date change
  useEffect(() => {
    loadSaisies();
  }, [loadSaisies]);

  const handleRowChange = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!chaine || !date) {
      setFeedback({ type: "error", message: "Sélectionne une chaîne et une date." });
      return;
    }

    const invalid = rows.some(
      (r) => !r.heure_debut || !r.heure_fin || r.heure_fin <= r.heure_debut
    );
    if (invalid) {
      setFeedback({
        type: "error",
        message: "Chaque créneau doit avoir une heure de fin après l'heure de début.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const entries = rows.map((r) => ({
        id: r.id,
        heure_debut: r.heure_debut,
        heure_fin: r.heure_fin,
        produit: r.produit,
        quantite_prevue: Number(r.quantite_prevue) || 0,
        quantite_reelle: r.quantite_reelle === "" ? null : Number(r.quantite_reelle),
      }));
      await saveSaisies(chaine, date, entries);
      setFeedback({ type: "success", message: "Saisies enregistrées avec succès." });
      loadSaisies();
    } catch (err) {
      console.error("Erreur enregistrement:", err);
      setFeedback({ type: "error", message: "Erreur lors de l'enregistrement des saisies." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={4} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="medium" mb={3}>
                  Saisie horaire de production
                </MDTypography>

                {feedback && (
                  <MDBox mb={2}>
                    <MDAlert color={feedback.type === "success" ? "success" : "error"}>
                      {feedback.message}
                    </MDAlert>
                  </MDBox>
                )}

                {/* Sélection chaîne + date */}
                <Grid container spacing={3} mb={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel id="chaine-select-label">Chaîne</InputLabel>
                      <Select
                        labelId="chaine-select-label"
                        value={chaine}
                        label="Chaîne"
                        onChange={(e) => setChaine(e.target.value)}
                      >
                        {CHAINES.map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <MDInput
                      type="date"
                      label="Date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                {loading ? (
                  <MDBox display="flex" justifyContent="center" p={3}>
                    <CircularProgress size={28} />
                  </MDBox>
                ) : (
                  <>
                    {/* En-têtes */}
                    <Grid container spacing={2} mb={1}>
                      <Grid item xs={2}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Heure début
                        </MDTypography>
                      </Grid>
                      <Grid item xs={2}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Heure fin
                        </MDTypography>
                      </Grid>
                      <Grid item xs={3}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Produit
                        </MDTypography>
                      </Grid>
                      <Grid item xs={2}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Qté prévue
                        </MDTypography>
                      </Grid>
                      <Grid item xs={2}>
                        <MDTypography variant="caption" fontWeight="bold">
                          Qté réelle
                        </MDTypography>
                      </Grid>
                      <Grid item xs={1} />
                    </Grid>

                    {/* Lignes de saisie */}
                    {rows.map((row, index) => (
                      <Grid
                        container
                        spacing={2}
                        mb={2}
                        key={row.id ?? `new-${index}`}
                        alignItems="center"
                      >
                        <Grid item xs={2}>
                          <MDInput
                            type="time"
                            value={row.heure_debut}
                            onChange={(e) => handleRowChange(index, "heure_debut", e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <MDInput
                            type="time"
                            value={row.heure_fin}
                            onChange={(e) => handleRowChange(index, "heure_fin", e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <MDInput
                            type="text"
                            placeholder="Optionnel"
                            value={row.produit}
                            onChange={(e) => handleRowChange(index, "produit", e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <MDInput
                            type="number"
                            value={row.quantite_prevue}
                            onChange={(e) =>
                              handleRowChange(index, "quantite_prevue", e.target.value)
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <MDInput
                            type="number"
                            value={row.quantite_reelle}
                            onChange={(e) =>
                              handleRowChange(index, "quantite_reelle", e.target.value)
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={1}>
                          <IconButton
                            color="error"
                            onClick={() => removeRow(index)}
                            disabled={rows.length === 1}
                          >
                            <Icon>delete</Icon>
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}

                    <MDBox display="flex" justifyContent="space-between" mt={3}>
                      <MDButton variant="outlined" color="info" onClick={addRow}>
                        <Icon sx={{ mr: 1 }}>add</Icon>
                        Ajouter un créneau
                      </MDButton>

                      <MDButton
                        variant="gradient"
                        color="success"
                        onClick={handleSave}
                        disabled={saving || !chaine}
                      >
                        {saving ? "Enregistrement..." : "Enregistrer"}
                      </MDButton>
                    </MDBox>
                  </>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SaisieChaine;

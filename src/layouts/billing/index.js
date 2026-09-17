/**
 * frontend/src/layouts/saisie-chaine/index.js
 *
 * Page de saisie horaire (prévu / réel) par chaîne de production (CH1 à CH15).
 * L'utilisateur choisit une chaîne + une date, voit un récapitulatif des
 * créneaux déjà enregistrés au-dessus, puis ajoute/modifie des créneaux
 * horaires (heure_debut / heure_fin variables) avec la quantité prévue et
 * la quantité réelle produite.
 *
 * Un tableau, sous le formulaire, affiche l'historique complet de la table
 * saisie_horaire (toutes chaînes/dates confondues), avec pagination.
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
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";

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
import { fetchSaisies, saveSaisies, fetchAllSaisies, CHAINES } from "services/saisieHoraireService";

const emptyRow = () => ({
  id: null,
  heure_debut: "",
  heure_fin: "",
  produit: "",
  quantite_prevue: "",
  quantite_reelle: "",
});

// Palette de couleurs stable pour les badges de chaîne (même chaîne = même couleur
// à chaque rendu, calculée à partir du nom pour ne pas dépendre de l'ordre).
const CHAINE_COLORS = ["info", "success", "warning", "error", "secondary", "primary"];
function getChaineColor(chaine) {
  if (!chaine) return "secondary";
  let hash = 0;
  for (let i = 0; i < chaine.length; i += 1) {
    hash = chaine.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHAINE_COLORS[Math.abs(hash) % CHAINE_COLORS.length];
}

/**
 * Compare quantité réelle vs prévue et retourne une couleur/label d'écart
 * pour un retour visuel rapide dans le tableau.
 */
function getEcartInfo(prevue, reelle) {
  if (reelle === null || reelle === undefined) {
    return { color: "text.secondary", label: "—" };
  }
  const diff = Number(reelle) - Number(prevue);
  if (diff >= 0) {
    return { color: "success.main", label: `+${diff}` };
  }
  return { color: "error.main", label: `${diff}` };
}

/**
 * Le thème Material Dashboard 2 applique `display: block` (+ padding) sur
 * MuiTableHead, ce qui sort l'en-tête du flux du tableau : le thead se
 * dimensionne alors indépendamment du tbody, d'où le décalage des colonnes.
 * On rétablit ici la sémantique tableau sur tous les descendants ; les
 * sélecteurs descendants d'un `sx` l'emportent sur les styleOverrides du thème.
 */
const tableResetSx = (minWidth) => ({
  display: "table",
  width: "100%",
  minWidth,
  tableLayout: "fixed",
  borderCollapse: "collapse",
  "& thead": { display: "table-header-group", padding: 0, margin: 0 },
  "& tbody": { display: "table-row-group" },
  "& tfoot": { display: "table-footer-group" },
  "& tr": { display: "table-row" },
  "& th, & td": {
    display: "table-cell",
    verticalAlign: "middle",
    padding: "12px 16px",
  },
});

/**
 * Définition centralisée des colonnes de l'historique.
 * Les largeurs sont appliquées sur le thead : combinées à `tableLayout: fixed`,
 * elles garantissent que chaque cellule du corps tombe sous son en-tête.
 */
const HISTORY_COLUMNS = [
  { key: "chaine", label: "Chaîne", width: "9%" },
  { key: "date", label: "Date", width: "13%" },
  { key: "creneau", label: "Créneau", width: "16%" },
  { key: "produit", label: "Produit", width: "18%" },
  { key: "prevue", label: "Prévue", width: "10%", align: "right" },
  { key: "reelle", label: "Réelle", width: "10%", align: "right" },
  { key: "ecart", label: "Écart", width: "9%", align: "center" },
  { key: "updated", label: "Modifié le", width: "15%" },
];

const headCellSx = {
  fontWeight: "bold",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
  backgroundColor: "grey.100",
};

const bodyCellSx = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

function SaisieChaine() {
  // --- Formulaire de saisie (chaîne + date sélectionnées) ---
  const [chaine, setChaine] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([emptyRow()]);
  const [savedEntries, setSavedEntries] = useState([]); // récapitulatif affiché au-dessus
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", message }

  // --- Historique complet (toutes les lignes de saisie_horaire) ---
  const [allEntries, setAllEntries] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allPage, setAllPage] = useState(0); // 0-indexed pour TablePagination
  const [allRowsPerPage, setAllRowsPerPage] = useState(20);
  const [allTotal, setAllTotal] = useState(0);

  const loadSaisies = useCallback(async () => {
    if (!chaine || !date) return;
    setLoading(true);
    setFeedback(null);
    try {
      const data = await fetchSaisies(chaine, date);

      setSavedEntries(data);

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

  const loadAllEntries = useCallback(async () => {
    setAllLoading(true);
    try {
      const res = await fetchAllSaisies({
        page: allPage + 1,
        limit: allRowsPerPage,
      });
      setAllEntries(res.data);
      setAllTotal(res.pagination.total);
    } catch (err) {
      console.error("Erreur chargement de l'historique complet:", err);
    } finally {
      setAllLoading(false);
    }
  }, [allPage, allRowsPerPage]);

  // Recharger les créneaux du formulaire quand la chaîne ou la date change
  useEffect(() => {
    loadSaisies();
  }, [loadSaisies]);

  // Recharger l'historique complet quand la pagination change
  useEffect(() => {
    loadAllEntries();
  }, [loadAllEntries]);

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
      // Recharge le récapitulatif au-dessus + les lignes d'édition avec les données à jour
      await loadSaisies();
      // Recharge aussi l'historique complet sous le formulaire
      await loadAllEntries();
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
          {/* Récapitulatif des créneaux déjà enregistrés pour la chaîne/date sélectionnées */}
          {chaine && date && savedEntries.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <MDBox p={3}>
                  <MDTypography variant="h6" fontWeight="medium" mb={2}>
                    Créneaux enregistrés — {chaine} du {date}
                  </MDTypography>
                  <TableContainer sx={{ overflowX: "auto", boxShadow: "none" }}>
                    <Table size="small" sx={tableResetSx(600)}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ ...headCellSx, width: "18%" }}>Heure début</TableCell>
                          <TableCell sx={{ ...headCellSx, width: "18%" }}>Heure fin</TableCell>
                          <TableCell sx={{ ...headCellSx, width: "30%" }}>Produit</TableCell>
                          <TableCell align="right" sx={{ ...headCellSx, width: "17%" }}>
                            Qté prévue
                          </TableCell>
                          <TableCell align="right" sx={{ ...headCellSx, width: "17%" }}>
                            Qté réelle
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {savedEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell sx={bodyCellSx}>{entry.heure_debut?.slice(0, 5)}</TableCell>
                            <TableCell sx={bodyCellSx}>{entry.heure_fin?.slice(0, 5)}</TableCell>
                            <TableCell sx={bodyCellSx} title={entry.produit || ""}>
                              {entry.produit || "—"}
                            </TableCell>
                            <TableCell align="right" sx={bodyCellSx}>
                              {entry.quantite_prevue}
                            </TableCell>
                            <TableCell align="right" sx={bodyCellSx}>
                              {entry.quantite_reelle ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MDBox>
              </Card>
            </Grid>
          )}

          {/* Formulaire de saisie */}
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

          {/* Historique complet — tous les champs de la table saisie_horaire (sauf id) */}
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Historique complet des saisies
                </MDTypography>

                {allLoading ? (
                  <MDBox display="flex" justifyContent="center" p={3}>
                    <CircularProgress size={28} />
                  </MDBox>
                ) : (
                  <>
                    <TableContainer
                      sx={{
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "grey.200",
                        boxShadow: "none",
                        overflowX: "auto",
                      }}
                    >
                      <Table sx={tableResetSx(960)}>
                        <TableHead>
                          <TableRow>
                            {HISTORY_COLUMNS.map((col) => (
                              <TableCell
                                key={col.key}
                                align={col.align || "left"}
                                sx={{ ...headCellSx, width: col.width }}
                              >
                                {col.label}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allEntries.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={HISTORY_COLUMNS.length} align="center">
                                <MDTypography variant="button" color="text">
                                  Aucune saisie trouvée.
                                </MDTypography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            allEntries.map((entry, index) => {
                              const ecart = getEcartInfo(
                                entry.quantite_prevue,
                                entry.quantite_reelle
                              );
                              return (
                                <TableRow
                                  key={entry.id}
                                  sx={{
                                    backgroundColor:
                                      index % 2 === 0 ? "background.paper" : "grey.50",
                                    "&:hover": { backgroundColor: "grey.100" },
                                  }}
                                >
                                  <TableCell sx={bodyCellSx}>
                                    <Chip
                                      label={entry.chaine}
                                      color={getChaineColor(entry.chaine)}
                                      size="small"
                                      sx={{ fontWeight: "bold", textTransform: "uppercase" }}
                                    />
                                  </TableCell>
                                  <TableCell sx={bodyCellSx}>
                                    <MDTypography variant="button" fontWeight="medium">
                                      {entry.date?.slice(0, 10)}
                                    </MDTypography>
                                  </TableCell>
                                  <TableCell sx={bodyCellSx}>
                                    <MDTypography variant="caption" color="text">
                                      {entry.heure_debut?.slice(0, 5)} →{" "}
                                      {entry.heure_fin?.slice(0, 5)}
                                    </MDTypography>
                                  </TableCell>
                                  <TableCell sx={bodyCellSx} title={entry.produit || ""}>
                                    <MDTypography variant="caption">
                                      {entry.produit || "—"}
                                    </MDTypography>
                                  </TableCell>
                                  <TableCell align="right" sx={bodyCellSx}>
                                    <MDTypography variant="button">
                                      {entry.quantite_prevue}
                                    </MDTypography>
                                  </TableCell>
                                  <TableCell align="right" sx={bodyCellSx}>
                                    <MDTypography variant="button" fontWeight="bold">
                                      {entry.quantite_reelle ?? "—"}
                                    </MDTypography>
                                  </TableCell>
                                  <TableCell align="center" sx={bodyCellSx}>
                                    <MDTypography
                                      variant="caption"
                                      fontWeight="bold"
                                      sx={{ color: ecart.color }}
                                    >
                                      {ecart.label}
                                    </MDTypography>
                                  </TableCell>
                                  <TableCell sx={bodyCellSx}>
                                    <MDTypography variant="caption" color="text">
                                      {entry.updated_at
                                        ? new Date(entry.updated_at).toLocaleString()
                                        : "—"}
                                    </MDTypography>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={allTotal}
                      page={allPage}
                      onPageChange={(e, newPage) => setAllPage(newPage)}
                      rowsPerPage={allRowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setAllRowsPerPage(parseInt(e.target.value, 10));
                        setAllPage(0);
                      }}
                      rowsPerPageOptions={[10, 20, 50, 100]}
                      labelRowsPerPage="Lignes par page"
                    />
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

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import api from "services/axiosConfig";

// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// @mui material components
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";

const emptyFormData = {
  chaine: "",
  commande: "",
  client: "",
  qté_commandé: "",
  models: "",
  date_debut_production: null,
  date_fin_production: null,
  date_mise_disposition: null,
  objectif: "",
};

// Génère la liste des chaînes disponibles : "ch 1" à "ch 15"
const chaineOptions = Array.from({ length: 15 }, (_, i) => `ch ${i + 1}`);

// Couleurs associees a chaque statut, pour l'affichage du badge en direct
const statutColorMap = {
  Ouvert: "success",
  "En attente": "warning",
  "Jour disposition": "info",
  Alerte: "error",
  Fermé: "dark",
};

/**
 * Calcule le statut en direct pendant la saisie, a partir des dates
 * (objets Date issus du DatePicker, peuvent etre null tant que non remplis).
 * Meme logique que le formulaire de creation (Tables.js) et le backend.
 */
function calculerStatutPreview(dateDebutProduction, dateMiseDisposition) {
  const SEUIL_ALERTE_JOURS = 2;

  if (!dateDebutProduction && !dateMiseDisposition) {
    return "En attente";
  }

  const today = dayjs().startOf("day");
  const dispo = dateMiseDisposition ? dayjs(dateMiseDisposition).startOf("day") : null;
  const debut = dateDebutProduction ? dayjs(dateDebutProduction).startOf("day") : null;

  if (dispo) {
    const diffDispoJours = dispo.diff(today, "day");

    if (diffDispoJours === 0) {
      return "Jour disposition";
    }
    if (diffDispoJours < 0) {
      return "Fermé";
    }
    if (diffDispoJours > 0 && diffDispoJours < SEUIL_ALERTE_JOURS) {
      return "Alerte";
    }
  }

  if (debut) {
    if (debut.isBefore(today)) {
      return "Ouvert";
    }
    if (debut.isAfter(today)) {
      return "En attente";
    }
  }

  return "Ouvert";
}

/**
 * Calcule l'écart en jours entre la date de mise à disposition et la date
 * de fin de production : ecart = date_mise_disposition - date_fin_production.
 */
function calculerEcart(dateFinProduction, dateMiseDisposition) {
  if (!dateFinProduction || !dateMiseDisposition) {
    return null;
  }

  const fin = dayjs(dateFinProduction).startOf("day");
  const dispo = dayjs(dateMiseDisposition).startOf("day");

  return dispo.diff(fin, "day");
}

/**
 * Calcule le nombre d'heures en direct :
 * nombre_jours = ceil(qté_commandé / objectif) ; nombre_heure = nombre_jours * 9h
 */
function calculerNombreHeure(qteCommande, objectif, heuresParJour = 9) {
  const qte = Number(qteCommande);
  const obj = Number(objectif);

  if (!obj || isNaN(qte) || isNaN(obj)) {
    return 0;
  }

  const nombreJours = Math.ceil(qte / obj);
  return nombreJours * heuresParJour;
}

/**
 * Calcule l'objectif horaire en direct : objectif (quotidien) / heures de
 * travail par jour (8h par defaut).
 */
function calculerObjectifHeure(objectif, heuresParJour = 8) {
  const obj = Number(objectif);

  if (!obj || isNaN(obj) || !heuresParJour) {
    return 0;
  }

  return Math.round((obj / heuresParJour) * 100) / 100;
}

// Calcule le numéro de semaine ISO 8601 (1 à 53) d'une date donnée
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Calcule le champ num_semaine en direct : "S03" si les deux dates tombent
 * dans la meme semaine ISO, sinon "S03_S05".
 */
function calculerNumSemaine(dateDebutProduction, dateMiseDisposition) {
  if (!dateDebutProduction || !dateMiseDisposition) {
    return "";
  }

  const wDebut = getWeekNumber(new Date(dateDebutProduction));
  const wDispo = getWeekNumber(new Date(dateMiseDisposition));

  const sDebut = `S${String(wDebut).padStart(2, "0")}`;
  const sDispo = `S${String(wDispo).padStart(2, "0")}`;

  return wDebut === wDispo ? sDebut : `${sDebut}_${sDispo}`;
}

/**
 * Calcule automatiquement la date de fin de production a partir de la date
 * de debut de production + nombre de jours (qté_commandé / objectif).
 */
function calculerDateFinProduction(dateDebutProduction, qteCommande, objectif) {
  if (!dateDebutProduction) {
    return null;
  }

  const qte = Number(qteCommande);
  const obj = Number(objectif);

  if (!obj || isNaN(qte) || isNaN(obj)) {
    return null;
  }

  const nombreJours = Math.ceil(qte / obj);
  if (!nombreJours) {
    return null;
  }

  return dayjs(dateDebutProduction).add(nombreJours, "day").toDate();
}

// Style custom pour que le champ ressemble à un MDInput
const datePickerInputStyle = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(0,0,0,0.23)",
  fontSize: "1rem",
  fontFamily: "inherit",
  outline: "none",
};

/**
 * Popup de modification d'une commande.
 *
 * Au moment de l'ouverture (open passe a true avec un commandeId), le
 * composant va chercher la commande via GET /commandes/getOneCommande/:id
 * et pre-remplit un formulaire identique a celui de la creation. La
 * soumission envoie un PUT /commandes/updateCommande/:id.
 */
function UpdateCommandeModal({ open, commandeId, clients, onClose, onUpdated }) {
  const [formData, setFormData] = useState(emptyFormData);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Recupere la commande a chaque ouverture de la popup
  useEffect(() => {
    if (!open || !commandeId) {
      return;
    }

    const fetchCommande = async () => {
      setFetching(true);
      setMessage("");
      try {
        const response = await api.get(`/commandes/getOneCommande/${commandeId}`);
        const commande = response.data.data;

        setFormData({
          chaine: commande.chaine || "",
          commande: commande.commande || "",
          client: commande.client || "",
          qté_commandé: commande.qté_commandé || "",
          models: commande.models || "",
          date_debut_production: commande.date_debut_production
            ? dayjs(commande.date_debut_production, ["DD/MM/YYYY", "YYYY-MM-DD"]).toDate()
            : null,
          date_fin_production: commande.date_fin_production
            ? dayjs(commande.date_fin_production, ["DD/MM/YYYY", "YYYY-MM-DD"]).toDate()
            : null,
          date_mise_disposition: commande.date_mise_disposition
            ? dayjs(commande.date_mise_disposition, ["DD/MM/YYYY", "YYYY-MM-DD"]).toDate()
            : null,
          objectif: commande.objectif || "",
        });
      } catch (error) {
        console.error("Erreur lors de la récupération de la commande:", error);
        setMessage("Erreur lors du chargement de la commande.");
      } finally {
        setFetching(false);
      }
    };

    fetchCommande();
  }, [open, commandeId]);

  // Recalcule automatiquement date_fin_production des que date_debut_production,
  // qté_commandé ou objectif changent (meme logique que le formulaire de creation)
  useEffect(() => {
    if (!open) return;

    const nouvelleDateFin = calculerDateFinProduction(
      formData.date_debut_production,
      formData.qté_commandé,
      formData.objectif
    );

    setFormData((prev) => {
      const memeDate =
        (!prev.date_fin_production && !nouvelleDateFin) ||
        (prev.date_fin_production &&
          nouvelleDateFin &&
          dayjs(prev.date_fin_production).isSame(dayjs(nouvelleDateFin), "day"));

      if (memeDate) return prev;

      if (!nouvelleDateFin) {
        return { ...prev, date_fin_production: null, date_mise_disposition: null };
      }

      return { ...prev, date_fin_production: nouvelleDateFin };
    });
  }, [formData.date_debut_production, formData.qté_commandé, formData.objectif, open]);

  // Statut / ecart / heures / semaine recalcules a chaque rendu
  const statutPreview = calculerStatutPreview(
    formData.date_debut_production,
    formData.date_mise_disposition
  );
  const statutPreviewColor = statutColorMap[statutPreview] || "secondary";

  const ecartPreview = calculerEcart(formData.date_fin_production, formData.date_mise_disposition);
  const ecartDisplay =
    ecartPreview === null ? "" : `${ecartPreview > 0 ? "+" : ""}${ecartPreview} j`;

  const nombreHeurePreview = calculerNombreHeure(formData.qté_commandé, formData.objectif);
  const objectifHeurePreview = calculerObjectifHeure(formData.objectif);
  const numSemainePreview = calculerNumSemaine(
    formData.date_debut_production,
    formData.date_mise_disposition
  );

  const selectedClientObj = clients.find((c) => c.nom === formData.client);
  const clientModelsOptions = selectedClientObj?.models || [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "client") {
      setFormData((prev) => ({ ...prev, client: value, models: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleClose = () => {
    setFormData(emptyFormData);
    setMessage("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { date_debut_production, date_fin_production, date_mise_disposition } = formData;

    if (date_debut_production && date_fin_production) {
      if (dayjs(date_fin_production).isBefore(dayjs(date_debut_production))) {
        setMessage("Erreur : la date de fin doit être après la date de début.");
        return;
      }
    }

    if (date_fin_production && date_mise_disposition) {
      if (dayjs(date_mise_disposition).isBefore(dayjs(date_fin_production))) {
        setMessage("Erreur : la date de mise à disposition doit être après la date de fin.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        statut: statutPreview,
        ecart: ecartPreview,
        nombre_heure: nombreHeurePreview,
        objectif_heure: objectifHeurePreview,
        num_semaine: numSemainePreview,
        date_debut_production: date_debut_production
          ? dayjs(date_debut_production).format("YYYY-MM-DD")
          : "",
        date_fin_production: date_fin_production
          ? dayjs(date_fin_production).format("YYYY-MM-DD")
          : "",
        date_mise_disposition: date_mise_disposition
          ? dayjs(date_mise_disposition).format("YYYY-MM-DD")
          : "",
      };

      await api.put(`/commandes/updateCommande/${commandeId}`, payload);

      if (onUpdated) onUpdated();
      handleClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la commande:", error);
      setMessage("Erreur lors de la mise à jour de la commande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Modifier la commande</DialogTitle>
      <MDBox component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {fetching ? (
            <MDBox py={4} textAlign="center">
              <MDTypography variant="button" color="text">
                Chargement de la commande...
              </MDTypography>
            </MDBox>
          ) : (
            <Grid container spacing={2} mt={0.5}>
              {/* Chaine */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="update-chaine-label">Chaîne</InputLabel>
                  <Select
                    labelId="update-chaine-label"
                    label="Chaîne"
                    name="chaine"
                    value={formData.chaine}
                    onChange={handleChange}
                    sx={{ height: "45px" }}
                  >
                    {chaineOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Statut calcule automatiquement (lecture seule) */}
              <Grid item xs={12} sm={4}>
                <MDBox display="flex" flexDirection="column" justifyContent="center" height="45px">
                  <MDTypography variant="caption" color="text" mb={0.5}>
                    Statut
                  </MDTypography>
                  <MDBox>
                    <MDBadge
                      badgeContent={statutPreview}
                      color={statutPreviewColor}
                      variant="gradient"
                      size="sm"
                      container
                    />
                  </MDBox>
                </MDBox>
              </Grid>

              <Grid item xs={12} sm={4}>
                <MDInput
                  type="text"
                  label="Commande"
                  name="commande"
                  value={formData.commande}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Client */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="update-client-label">Client</InputLabel>
                  <Select
                    labelId="update-client-label"
                    label="Client"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    sx={{ height: "45px" }}
                  >
                    {clients.map((c) => (
                      <MenuItem key={c.id} value={c.nom}>
                        {c.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <MDInput
                  type="text"
                  label="Qté commandé"
                  name="qté_commandé"
                  value={formData.qté_commandé}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Models */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="update-models-label">Models</InputLabel>
                  <Select
                    labelId="update-models-label"
                    label="Models"
                    name="models"
                    value={formData.models}
                    onChange={handleChange}
                    sx={{ height: "45px" }}
                    disabled={!formData.client || clientModelsOptions.length === 0}
                  >
                    {clientModelsOptions.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Dates */}
              <Grid item xs={12} sm={4}>
                <MDTypography variant="caption" color="text" mb={0.5} display="block">
                  Date début production
                </MDTypography>
                <DatePicker
                  selected={formData.date_debut_production}
                  onChange={(date) => handleDateChange("date_debut_production", date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="jj/mm/aaaa"
                  customInput={<input style={datePickerInputStyle} />}
                  isClearable
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <MDTypography variant="caption" color="text" mb={0.5} display="block">
                  Date fin production
                </MDTypography>
                <DatePicker
                  selected={formData.date_fin_production}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="jj/mm/aaaa"
                  customInput={
                    <input
                      style={{
                        ...datePickerInputStyle,
                        backgroundColor: "#f0f2f5",
                        cursor: "not-allowed",
                      }}
                    />
                  }
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <MDTypography variant="caption" color="text" mb={0.5} display="block">
                  Date mise à disposition
                </MDTypography>
                <DatePicker
                  selected={formData.date_mise_disposition}
                  onChange={(date) => handleDateChange("date_mise_disposition", date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="jj/mm/aaaa"
                  customInput={<input style={datePickerInputStyle} />}
                  minDate={formData.date_fin_production || null}
                  disabled={!formData.date_fin_production}
                  isClearable
                />
              </Grid>

              {/* Nombre d'heures (lecture seule) */}
              <Grid item xs={12} sm={4}>
                <MDInput
                  type="text"
                  label="Nombre d'heures"
                  name="nombre_heure"
                  value={nombreHeurePreview}
                  InputProps={{ readOnly: true }}
                  disabled
                  fullWidth
                />
              </Grid>

              {/* Ecart (lecture seule) */}
              <Grid item xs={12} sm={4}>
                <MDInput
                  type="text"
                  label="Écart"
                  name="ecart"
                  value={ecartDisplay}
                  InputProps={{ readOnly: true }}
                  disabled
                  fullWidth
                />
              </Grid>

              {/* Num semaine (lecture seule) */}
              <Grid item xs={12} sm={4}>
                <MDInput
                  type="text"
                  label="Numéro de semaine"
                  name="num_semaine"
                  value={numSemainePreview}
                  InputProps={{ readOnly: true }}
                  disabled
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <MDInput
                  type="text"
                  label="Objectif"
                  name="objectif"
                  value={formData.objectif}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              {/* Objectif heure (lecture seule) */}
              <Grid item xs={12} sm={4}>
                <MDInput
                  type="text"
                  label="Objectif heure"
                  name="objectif_heure"
                  value={objectifHeurePreview}
                  InputProps={{ readOnly: true }}
                  disabled
                  fullWidth
                />
              </Grid>
            </Grid>
          )}

          {message && (
            <MDTypography variant="button" color="error" mt={2} display="block">
              {message}
            </MDTypography>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton variant="outlined" color="dark" onClick={handleClose} type="button">
            Annuler
          </MDButton>
          <MDButton type="submit" variant="gradient" color="info" disabled={loading || fetching}>
            {loading ? "Enregistrement..." : "Mettre à jour"}
          </MDButton>
        </DialogActions>
      </MDBox>
    </Dialog>
  );
}

UpdateCommandeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  commandeId: PropTypes.string,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      nom: PropTypes.string,
      models: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func,
};

UpdateCommandeModal.defaultProps = {
  commandeId: null,
  clients: [],
  onUpdated: () => {},
};

export default UpdateCommandeModal;

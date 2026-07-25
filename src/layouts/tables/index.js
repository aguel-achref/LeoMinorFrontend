import { useState, useEffect } from "react";
import api from "services/axiosConfig";
import dayjs from "dayjs";

// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// Data
import authorsTableData, { formatCommandeRow } from "layouts/tables/data/authorsTableData";

const API_BASE_URL = "http://localhost:8080/api/commandes";

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

const emptyClientFormData = {
  nom: "",
  models: [],
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
 *
 * Regles (par ordre de priorite) :
 * 1. Aucune date saisie                          -> "En attente"
 * 2. date_mise_disposition == aujourd'hui        -> "Jour disposition"
 * 3. date_mise_disposition deja passee           -> "Fermé"
 * 4. date_mise_disposition dans moins de 2 jours -> "Alerte"
 * 5. date_debut_production < aujourd'hui         -> "Ouvert"
 * 6. date_debut_production > aujourd'hui         -> "En attente"
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
 * Retourne null tant que les deux dates ne sont pas renseignees.
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
 * 1. nombre de jours = qté_commandé / objectif (arrondi au jour superieur)
 * 2. nombre_heure = nombre de jours * 9h de travail par jour
 * Retourne 0 tant que l'un des deux champs n'est pas renseigné ou si
 * objectif vaut 0 (division impossible).
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
 * travail par jour (8h par defaut). Retourne 0 tant que objectif n'est pas
 * renseigné ou invalide. Correspond a la requete SQL "obj_heure" cote backend.
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
  const dayNum = d.getUTCDay() || 7; // dimanche = 7 au lieu de 0
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Calcule le champ num_semaine en direct, a partir des objets Date du
 * DatePicker : "S03" si date_debut_production et date_mise_disposition
 * tombent dans la meme semaine ISO (1 a 53), sinon "S03_S05".
 * Retourne "" tant que les deux dates ne sont pas renseignees.
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

function Tables() {
  const { columns } = authorsTableData();
  const [rows, setRows] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);

  const [formData, setFormData] = useState(emptyFormData);
  const [editingId, setEditingId] = useState(null); // null = creation, sinon = id de la commande en cours de modification

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Liste des clients existants (alimente la liste deroulante "Client")
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // --- State de la popup "Ajouter client" ---
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState(emptyClientFormData);
  const [clientModelInput, setClientModelInput] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientMessage, setClientMessage] = useState("");

  // Statut recalcule a chaque rendu, en fonction des dates actuellement saisies
  const statutPreview = calculerStatutPreview(
    formData.date_debut_production,
    formData.date_mise_disposition
  );
  const statutPreviewColor = statutColorMap[statutPreview] || "secondary";

  // Ecart recalcule a chaque rendu : date_mise_disposition - date_fin_production
  const ecartPreview = calculerEcart(formData.date_fin_production, formData.date_mise_disposition);
  const ecartDisplay =
    ecartPreview === null ? "" : `${ecartPreview > 0 ? "+" : ""}${ecartPreview} j`;

  // Nombre d'heures recalcule a chaque rendu : (qté_commandé / objectif) jours * 9h
  const nombreHeurePreview = calculerNombreHeure(formData.qté_commandé, formData.objectif);

  // Objectif heure recalcule a chaque rendu : objectif / 8h
  const objectifHeurePreview = calculerObjectifHeure(formData.objectif);

  // Num semaine recalcule a chaque rendu : semaine ISO du debut et de la mise a disposition
  const numSemainePreview = calculerNumSemaine(
    formData.date_debut_production,
    formData.date_mise_disposition
  );

  // Récupère l'objet client complet correspondant au nom sélectionné,
  // pour accéder à sa liste de modèles. Recalculé à chaque rendu.
  const selectedClientObj = clients.find((c) => c.nom === formData.client);
  const clientModelsOptions = selectedClientObj?.models || [];

  const fetchCommandes = async () => {
    setLoadingTable(true);
    try {
      const response = await api.get("/commandes/getAllCommandes/");
      const commandes = response.data.data;
      setRows(
        commandes.map((commande) =>
          formatCommandeRow(commande, { onEdit: handleEdit, onDelete: handleDelete })
        )
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des commandes:", error);
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await api.get("/clients/getAllClients");
      setClients(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "client") {
      // Quand on change de client, on réinitialise le champ models
      // car la liste de modèles disponibles change en fonction du client
      setFormData((prev) => ({ ...prev, client: value, models: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Gestion des dates avec cascade de cohérence
  const handleDateChange = (name, date) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: date };

      // Si on change la date de début, on vérifie fin + mise à dispo
      if (name === "date_debut_production") {
        if (
          updated.date_fin_production &&
          date &&
          dayjs(updated.date_fin_production).isBefore(dayjs(date))
        ) {
          updated.date_fin_production = null;
          updated.date_mise_disposition = null;
        }
      }

      // Si on change la date de fin, on vérifie mise à dispo
      if (name === "date_fin_production") {
        if (
          updated.date_mise_disposition &&
          date &&
          dayjs(updated.date_mise_disposition).isBefore(dayjs(date))
        ) {
          updated.date_mise_disposition = null;
        }
      }

      return updated;
    });
  };

  // Remplit le formulaire avec les donnees d'une commande existante pour la modifier
  const handleEdit = (commande) => {
    setEditingId(commande.id);
    setMessage("");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setMessage("");
  };

  // Supprime une commande apres confirmation
  const handleDelete = async (commande) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer la commande "${commande.commande}" ?`
    );
    if (!confirmation) return;

    try {
      await api.delete(`/commandes/deleteCommande/${commande.id}`);
      fetchCommandes();
    } catch (error) {
      console.error("Erreur lors de la suppression de la commande:", error);
      alert("Erreur lors de la suppression de la commande.");
    }
  };

  // --- Handlers de la popup "Ajouter client" ---

  const handleOpenClientDialog = () => {
    setClientFormData(emptyClientFormData);
    setClientModelInput("");
    setClientMessage("");
    setClientDialogOpen(true);
  };

  const handleCloseClientDialog = () => {
    setClientDialogOpen(false);
  };

  const handleClientNomChange = (e) => {
    setClientFormData({ ...clientFormData, nom: e.target.value });
  };

  // Ajoute le modele tape dans la liste "models" au chips (Entree ou virgule)
  const handleAddModelTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = clientModelInput.trim();
      if (value && !clientFormData.models.includes(value)) {
        setClientFormData({
          ...clientFormData,
          models: [...clientFormData.models, value],
        });
      }
      setClientModelInput("");
    }
  };

  // Retire un modele de la liste au clic sur le "x" du chip
  const handleRemoveModelTag = (modelToRemove) => {
    setClientFormData({
      ...clientFormData,
      models: clientFormData.models.filter((m) => m !== modelToRemove),
    });
  };

  const handleSubmitClient = async (e) => {
    e.preventDefault();
    setClientMessage("");

    if (!clientFormData.nom.trim()) {
      setClientMessage("Erreur : le nom du client est requis.");
      return;
    }

    setClientLoading(true);

    try {
      await api.post("/clients/createClient", {
        nom: clientFormData.nom.trim(),
        models: clientFormData.models,
      });

      // Rafraichit la liste deroulante et preselectionne le client cree
      await fetchClients();
      setFormData((prev) => ({ ...prev, client: clientFormData.nom.trim() }));

      setClientDialogOpen(false);
      setClientFormData(emptyClientFormData);
    } catch (error) {
      console.error("Erreur lors de la création du client:", error);
      setClientMessage("Erreur lors de la création du client.");
    } finally {
      setClientLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validation de cohérence des dates avant envoi
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
        // Statut, ecart, nombre_jours, objectif_heure et num_semaine sont calcules
        // automatiquement : on les envoie pour un affichage optimiste coherent cote
        // client, le backend les recalcule de toute facon (objectif_heure via la
        // requete SQL "obj_heure").
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

      if (editingId) {
        const response = await api.put(`/commandes/updateCommande/${editingId}`, payload);
        console.log("Commande mise à jour:", response.data);
        setMessage("Commande mise à jour avec succès !");
      } else {
        const response = await api.post("/commandes/createCommande/", payload);
        console.log("Commande créée:", response.data);
        setMessage("Commande créée avec succès !");
      }

      setEditingId(null);
      setFormData(emptyFormData);
      fetchCommandes();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la commande:", error);
      setMessage("Erreur lors de l'enregistrement de la commande.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  {editingId ? "Modifier la commande" : "Nouvelle chaîne de production"}
                </MDTypography>
              </MDBox>
              <MDBox pt={3} pb={3} px={2} component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Chaine (liste deroulante ch 1 -> ch 15) */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel id="chaine-label">Chaîne</InputLabel>
                      <Select
                        labelId="chaine-label"
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
                    <MDBox
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      height="45px"
                    >
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

                  {/* Client (liste deroulante alimentee par getAllClients) + bouton d'ajout */}
                  <Grid item xs={12} sm={4}>
                    <MDBox display="flex" alignItems="flex-end" gap={1}>
                      <FormControl fullWidth>
                        <InputLabel id="client-label">Client</InputLabel>
                        <Select
                          labelId="client-label"
                          label="Client"
                          name="client"
                          value={formData.client}
                          onChange={handleChange}
                          sx={{ height: "45px" }}
                          disabled={loadingClients}
                        >
                          {clients.map((c) => (
                            <MenuItem key={c.id} value={c.nom}>
                              {c.nom}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <MDButton
                        variant="outlined"
                        color="info"
                        size="small"
                        type="button"
                        onClick={handleOpenClientDialog}
                        sx={{ whiteSpace: "nowrap", height: "44px" }}
                      >
                        Ajouter client
                      </MDButton>
                    </MDBox>
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

                  {/* Models (liste deroulante alimentee par les modeles du client selectionne) */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="models-label">Models</InputLabel>
                      <Select
                        labelId="models-label"
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

                  {/* --- Champs date avec react-datepicker --- */}
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
                      onChange={(date) => handleDateChange("date_fin_production", date)}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="jj/mm/aaaa"
                      customInput={<input style={datePickerInputStyle} />}
                      minDate={formData.date_debut_production || null}
                      disabled={!formData.date_debut_production}
                      isClearable
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
                  {/* --- Fin des champs date --- */}

                  {/* Nombre d'heures calcule automatiquement (lecture seule) : (qté_commandé / objectif) jours * 9h */}
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

                  {/* Ecart calcule automatiquement (lecture seule) : date_mise_disposition - date_fin_production */}
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

                  {/* Num semaine calcule automatiquement (lecture seule) : S03 ou S03_S05 */}
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

                  {/* Objectif heure calcule automatiquement (lecture seule) : objectif / 8h -- remplace code_commande */}
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
                <MDBox mt={3} display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
                  {message && (
                    <MDTypography variant="button" color="text" mr={2}>
                      {message}
                    </MDTypography>
                  )}
                  {editingId && (
                    <MDButton variant="outlined" color="dark" onClick={handleCancelEdit}>
                      Annuler
                    </MDButton>
                  )}
                  <MDButton type="submit" variant="gradient" color="info" disabled={loading}>
                    {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Enregistrer"}
                  </MDButton>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Commandes
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                {loadingTable ? (
                  <MDBox p={3} textAlign="center">
                    <MDTypography variant="button" color="text">
                      Chargement des commandes...
                    </MDTypography>
                  </MDBox>
                ) : (
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={false}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    noEndBorder
                  />
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* --- Popup "Ajouter client" --- */}
      <Dialog open={clientDialogOpen} onClose={handleCloseClientDialog} fullWidth maxWidth="sm">
        <DialogTitle>Ajouter un client</DialogTitle>
        <MDBox component="form" onSubmit={handleSubmitClient}>
          <DialogContent>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Nom"
                name="nom"
                value={clientFormData.nom}
                onChange={handleClientNomChange}
                fullWidth
                autoFocus
              />
            </MDBox>

            <MDBox mb={1}>
              <MDInput
                type="text"
                label="Modèles (Entrée pour ajouter)"
                value={clientModelInput}
                onChange={(e) => setClientModelInput(e.target.value)}
                onKeyDown={handleAddModelTag}
                fullWidth
              />
            </MDBox>

            {clientFormData.models.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                {clientFormData.models.map((model) => (
                  <Chip
                    key={model}
                    label={model}
                    color="info"
                    onDelete={() => handleRemoveModelTag(model)}
                  />
                ))}
              </Stack>
            )}

            {clientMessage && (
              <MDTypography variant="button" color="error" mt={2} display="block">
                {clientMessage}
              </MDTypography>
            )}
          </DialogContent>
          <DialogActions>
            <MDButton variant="outlined" color="dark" onClick={handleCloseClientDialog}>
              Annuler
            </MDButton>
            <MDButton type="submit" variant="gradient" color="info" disabled={clientLoading}>
              {clientLoading ? "Ajout..." : "Ajouter"}
            </MDButton>
          </DialogActions>
        </MDBox>
      </Dialog>
    </DashboardLayout>
  );
}

export default Tables;

/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import MDButton from "components/MDButton";

// @mui material components
import Icon from "@mui/material/Icon";

export default function data() {
  return {
    columns: [
      { Header: "chaine", accessor: "chaine", align: "center" },
      { Header: "statut", accessor: "statut", align: "center" },
      { Header: "commande", accessor: "commande", align: "left" },
      { Header: "client", accessor: "client", align: "left" },
      { Header: "num semaine", accessor: "num_semaine", align: "center" },
      { Header: "qté commandé", accessor: "qté_commandé", align: "center" },
      { Header: "description", accessor: "description", align: "left" },
      { Header: "date debut production", accessor: "date_debut_production", align: "center" },
      { Header: "date fin production", accessor: "date_fin_production", align: "center" },
      { Header: "date mise disposition", accessor: "date_mise_disposition", align: "center" },
      { Header: "nombre jours", accessor: "nombre_jours", align: "center" },
      { Header: "ecart", accessor: "ecart", align: "center" },
      { Header: "objectif", accessor: "objectif", align: "center" },
      { Header: "code commande", accessor: "code_commande", align: "center" },
      { Header: "action", accessor: "action", align: "center" },
    ],
    rows: [],
  };
}

// Convertit "JJ/MM/AAAA" en objet Date JS valide (retourne null si vide/invalide)
function parseFrenchDate(dateStr) {
  if (!dateStr) return null;
  const [jour, mois, annee] = dateStr.split("/");
  if (!jour || !mois || !annee) return null;
  return new Date(`${annee}-${mois}-${jour}`);
}

// Compare uniquement l'annee/mois/jour, sans tenir compte de l'heure
function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
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
 * Calcule le champ num_semaine à partir des dates (chaînes "JJ/MM/AAAA") :
 * "S03" si date_debut_production et date_mise_disposition sont dans la
 * même semaine ISO, sinon "S03_S05". Retourne "" si une date manque.
 */
function calculerNumSemainePreview(dateDebutStr, dateDispoStr) {
  const dateDebut = parseFrenchDate(dateDebutStr);
  const dateDispo = parseFrenchDate(dateDispoStr);
  if (!dateDebut || !dateDispo) return "";

  const wDebut = getWeekNumber(dateDebut);
  const wDispo = getWeekNumber(dateDispo);
  const sDebut = `S${String(wDebut).padStart(2, "0")}`;
  const sDispo = `S${String(wDispo).padStart(2, "0")}`;

  return wDebut === wDispo ? sDebut : `${sDebut}_${sDispo}`;
}

// Determine le badge (libelle + couleur) a partir des dates de la commande.
// Priorite : Jour disposition > Fermé > Alerte > Ouvert / En attente > Ouvert (par defaut)
export function getStatutBadge(commande) {
  const currentDate = new Date();
  const dateDebutProduction = parseFrenchDate(commande.date_debut_production);
  const dateMiseDisposition = parseFrenchDate(commande.date_mise_disposition);

  const SEUIL_ALERTE_JOURS = 2;
  const msParJour = 1000 * 60 * 60 * 24;

  // Si aucune date n'est encore saisie, on affiche un statut neutre "En attente"
  if (!dateDebutProduction && !dateMiseDisposition) {
    return { label: "En attente", color: "warning" };
  }

  // 1. Le jour de mise a disposition, c'est aujourd'hui
  if (dateMiseDisposition && isSameDay(dateMiseDisposition, currentDate)) {
    return { label: "Jour disposition", color: "info" };
  }

  // 2. Deja fermé : date de mise a disposition depassee
  if (dateMiseDisposition && dateMiseDisposition < currentDate) {
    return { label: "Fermé", color: "dark" };
  }

  // 3. Alerte : mise a disposition dans moins de 2 jours
  if (dateMiseDisposition) {
    const diffJours = (dateMiseDisposition.getTime() - currentDate.getTime()) / msParJour;
    if (diffJours > 0 && diffJours < SEUIL_ALERTE_JOURS) {
      return { label: "Alerte", color: "error" };
    }
  }

  // 4. Ouvert / En attente selon la date de debut de production
  if (dateDebutProduction) {
    if (dateDebutProduction < currentDate) {
      return { label: "Ouvert", color: "success" };
    }
    if (dateDebutProduction > currentDate) {
      return { label: "En attente", color: "warning" };
    }
  }

  // 5. Valeur par defaut si aucune regle ne s'applique
  return { label: "Ouvert", color: "success" };
}

// Transforme une commande brute venant de l'API (base SQL) en une ligne
// affichable par DataTable, avec le badge de statut, le style du dashboard,
// et les boutons Modifier / Supprimer.
export function formatCommandeRow(commande, handlers = {}) {
  const { onEdit, onDelete } = handlers;
  const { label, color } = getStatutBadge(commande);

  const Cell = ({ value }) => (
    <MDTypography variant="caption" color="text" fontWeight="medium">
      {value}
    </MDTypography>
  );

  return {
    chaine: <Cell value={commande.chaine} />,
    statut: (
      <MDBox ml={-1}>
        <MDBadge badgeContent={label} color={color} variant="gradient" size="sm" />
      </MDBox>
    ),
    commande: <Cell value={commande.commande} />,
    client: <Cell value={commande.client} />,
    num_semaine: <Cell value={commande.num_semaine} />,
    qté_commandé: <Cell value={commande.qté_commandé} />,
    description: <Cell value={commande.description} />,
    date_debut_production: <Cell value={commande.date_debut_production} />,
    date_fin_production: <Cell value={commande.date_fin_production} />,
    date_mise_disposition: <Cell value={commande.date_mise_disposition} />,
    nombre_jours: <Cell value={commande.nombre_jours} />,
    ecart: <Cell value={commande.ecart} />,
    objectif: <Cell value={commande.objectif} />,
    code_commande: <Cell value={commande.code_commande} />,
    action: (
      <MDBox display="flex" justifyContent="center" gap={1}>
        <MDButton
          variant="text"
          color="info"
          iconOnly
          size="small"
          onClick={() => {
            if (onEdit) onEdit(commande);
          }}
        >
          <Icon>edit</Icon>
        </MDButton>
        <MDButton
          variant="text"
          color="error"
          iconOnly
          size="small"
          onClick={() => {
            if (onDelete) onDelete(commande);
          }}
        >
          <Icon>delete</Icon>
        </MDButton>
      </MDBox>
    ),
  };
}

/* =========================================================
 * Formulaire de saisie / edition d'une commande.
 * Le statut n'est plus saisi manuellement : il est calcule
 * automatiquement en direct a partir des dates renseignees,
 * via getStatutBadge (meme logique que dans le tableau).
 * Le num_semaine est lui aussi calcule automatiquement a partir
 * des memes dates (S03 ou S03_S05 selon les semaines ISO).
 * =========================================================
 */

import { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDInput from "components/MDInput";

// Valeurs par defaut du formulaire (statut et num_semaine retires, calcules automatiquement)
const emptyForm = {
  chaine: "",
  commande: "",
  client: "",
  qté_commandé: "",
  description: "",
  date_debut_production: "",
  date_fin_production: "",
  date_mise_disposition: "",
  nombre_jours: "",
  ecart: "",
  objectif: "",
  code_commande: "",
};

export function ProductionForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialData || emptyForm);

  // Recalcule le statut a chaque rendu, en fonction des dates actuellement saisies
  const statutCalcule = getStatutBadge(formData);

  // Recalcule le num_semaine a chaque rendu, en fonction des memes dates
  const numSemaineCalcule = calculerNumSemainePreview(
    formData.date_debut_production,
    formData.date_mise_disposition
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // On inclut le statut et le num_semaine calcules dans les donnees envoyees
    // (le backend le recalculera de toute facon, mais cela permet
    // un affichage optimiste immediat cote client si besoin)
    const dataToSend = { ...formData, statut: statutCalcule.label, num_semaine: numSemaineCalcule };

    if (onSubmit) {
      onSubmit(dataToSend);
    }
    if (!initialData) {
      setFormData(emptyForm);
    }
  };

  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h5" fontWeight="medium" mb={3}>
          {initialData ? "Modifier la chaîne de production" : "Nouvelle chaîne de production"}
        </MDTypography>

        <MDBox component="form" role="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Chaine */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Chaîne"
                name="chaine"
                value={formData.chaine}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Statut (calcule automatiquement, lecture seule) */}
            <Grid item xs={12} sm={4}>
              <MDBox display="flex" flexDirection="column" justifyContent="center" height="45px">
                <MDTypography variant="caption" color="text" fontWeight="regular" mb={0.5}>
                  Statut (auto)
                </MDTypography>
                <MDBox>
                  <MDBadge
                    badgeContent={statutCalcule.label}
                    color={statutCalcule.color}
                    variant="gradient"
                    size="sm"
                    container
                  />
                </MDBox>
              </MDBox>
            </Grid>

            {/* Commande */}
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
              <MDInput
                type="text"
                label="Client"
                name="client"
                value={formData.client}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Num semaine (calcule automatiquement, lecture seule) */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Numéro de semaine (auto)"
                name="num_semaine"
                value={numSemaineCalcule}
                InputProps={{ readOnly: true }}
                disabled
                fullWidth
              />
            </Grid>

            {/* Qté commandé */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="number"
                label="Qté commandé"
                name="qté_commandé"
                value={formData.qté_commandé}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <MDInput
                type="text"
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Code commande */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Code commande"
                name="code_commande"
                value={formData.code_commande}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Objectif */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="number"
                label="Objectif"
                name="objectif"
                value={formData.objectif}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Ecart */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Écart"
                name="ecart"
                value={formData.ecart}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Date debut production */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Date début production"
                name="date_debut_production"
                placeholder="JJ/MM/AAAA"
                value={formData.date_debut_production}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Date fin production */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Date fin production"
                name="date_fin_production"
                placeholder="JJ/MM/AAAA"
                value={formData.date_fin_production}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Date mise a disposition */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Date mise à disposition"
                name="date_mise_disposition"
                placeholder="JJ/MM/AAAA"
                value={formData.date_mise_disposition}
                onChange={handleChange}
                fullWidth
              />
            </Grid>

            {/* Nombre de jours */}
            <Grid item xs={12} sm={4}>
              <MDInput
                type="text"
                label="Nombre de jours"
                name="nombre_jours"
                value={formData.nombre_jours}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          <MDBox mt={4} display="flex" justifyContent="flex-end" gap={2}>
            {onCancel && (
              <MDButton variant="outlined" color="dark" onClick={onCancel}>
                Annuler
              </MDButton>
            )}
            <MDButton type="submit" variant="gradient" color="info">
              Enregistrer
            </MDButton>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  );
}

// Setting default values for the props of ProductionForm
ProductionForm.defaultProps = {
  initialData: null,
  onCancel: null,
};

// Typechecking props for the ProductionForm
ProductionForm.propTypes = {
  initialData: PropTypes.shape({
    chaine: PropTypes.string,
    commande: PropTypes.string,
    client: PropTypes.string,
    qté_commandé: PropTypes.string,
    description: PropTypes.string,
    date_debut_production: PropTypes.string,
    date_fin_production: PropTypes.string,
    date_mise_disposition: PropTypes.string,
    nombre_jours: PropTypes.string,
    ecart: PropTypes.string,
    objectif: PropTypes.string,
    code_commande: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

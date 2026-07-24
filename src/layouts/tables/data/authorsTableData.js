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

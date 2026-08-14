/**
=========================================================
* Material Dashboard 2 React - v2.2.0 (version connectée)
=========================================================
* Adapté pour afficher les statistiques réelles des commandes/clients
* via l'endpoint GET /api/dashboard/summary.
*/

import { useEffect, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Dashboard data helpers
import { fetchDashboardSummary } from "services/dashboardService";
import { toChartFormat } from "layouts/dashboard/data/chartAdapters";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const data = await fetchDashboardSummary();
        if (isMounted) setSummary(data);
      } catch (err) {
        console.error("Erreur chargement dashboard:", err);
        if (isMounted) setError("Impossible de charger les données du dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} textAlign="center">
          <MDTypography variant="body2" color="text">
            Chargement du dashboard...
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3} textAlign="center">
          <MDTypography variant="body2" color="error">
            {error}
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    );
  }

  const {
    totalCommandes,
    totalClients,
    commandesParStatut,
    commandesParClient,
    commandesParChaine,
    heuresParClient,
    heuresParChaineAujourdhui,
    heuresParChaineSemaine,
    dateAujourdhuiLabel,
    semaineLabel,
    commandesAlerte,
  } = summary;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Cards de statistiques globales */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="assignment"
                title="Total commandes"
                count={totalCommandes}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="info"
                icon="group"
                title="Total clients"
                count={totalClients}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon="warning"
                title="Commandes en alerte"
                count={commandesAlerte.length}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="precision_manufacturing"
                title="Chaînes actives"
                count={commandesParChaine.length}
              />
            </MDBox>
          </Grid>
        </Grid>

        {/* Graphiques de répartition */}
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="Commandes par statut"
                  description="Répartition actuelle"
                  date="mis à jour à l'instant"
                  chart={toChartFormat(commandesParStatut, "Commandes")}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="success"
                  title="Commandes par client"
                  description="Top clients par volume"
                  date="mis à jour à l'instant"
                  chart={toChartFormat(commandesParClient, "Commandes")}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="dark"
                  title="Commandes par chaîne"
                  description="Charge de production"
                  date="mis à jour à l'instant"
                  chart={toChartFormat(commandesParChaine, "Commandes")}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>

        {/* Dashboard dédié : heures totales de production par client */}
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="Heures totales de production par client"
                  description="Charge de travail estimée (nombre_heure cumulé)"
                  date="mis à jour à l'instant"
                  chart={toChartFormat(heuresParClient, "Heures", "total")}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>

        {/* Charge de travail par chaîne : aujourd'hui et cette semaine */}
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="primary"
                  title={`Heures par chaîne — aujourd'hui`}
                  description={`Commandes en cours le ${dateAujourdhuiLabel}`}
                  date="mis à jour à l'instant"
                  chart={toChartFormat(heuresParChaineAujourdhui, "Heures", "total")}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="warning"
                  title="Heures par chaîne — cette semaine"
                  description={`Semaine du ${semaineLabel}`}
                  date="mis à jour à l'instant"
                  chart={toChartFormat(heuresParChaineSemaine, "Heures", "total")}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;

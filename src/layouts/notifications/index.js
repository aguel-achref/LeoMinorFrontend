import { useEffect, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAlert from "components/MDAlert";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Réutilise l'endpoint dashboard/summary (déjà vérifié fonctionnel), qui
// renvoie commandesAlerte = commandes au statut "Alerte" OU "Jour disposition".
// On filtre ensuite pour ne garder QUE le statut "Alerte" exact.
import { fetchDashboardSummary } from "services/dashboardService";

function Notifications() {
  const [successSB, setSuccessSB] = useState(false);
  const [infoSB, setInfoSB] = useState(false);
  const [warningSB, setWarningSB] = useState(false);
  const [errorSB, setErrorSB] = useState(false);

  // Commandes dont le statut est exactement "Alerte"
  const [commandesAlerte, setCommandesAlerte] = useState([]);
  const [loadingAlertes, setLoadingAlertes] = useState(true);
  const [erreurAlertes, setErreurAlertes] = useState(null);

  const openSuccessSB = () => setSuccessSB(true);
  const closeSuccessSB = () => setSuccessSB(false);
  const openInfoSB = () => setInfoSB(true);
  const closeInfoSB = () => setInfoSB(false);
  const openWarningSB = () => setWarningSB(true);
  const closeWarningSB = () => setWarningSB(false);
  const openErrorSB = () => setErrorSB(true);
  const closeErrorSB = () => setErrorSB(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAlertes() {
      setLoadingAlertes(true);
      setErreurAlertes(null);
      try {
        const summary = await fetchDashboardSummary();

        // commandesAlerte du backend contient "Alerte" ET "Jour disposition" ;
        // ici on ne garde que "Alerte" au sens strict.
        const toutes = Array.isArray(summary?.commandesAlerte) ? summary.commandesAlerte : [];
        const alertesUniquement = toutes.filter((c) => c.statut === "Alerte");

        if (isMounted) setCommandesAlerte(alertesUniquement);
      } catch (error) {
        console.error("Erreur lors de la récupération des commandes en alerte:", error);
        if (isMounted) setErreurAlertes("Impossible de charger les alertes.");
      } finally {
        if (isMounted) setLoadingAlertes(false);
      }
    }

    loadAlertes();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderSuccessSB = (
    <MDSnackbar
      color="success"
      icon="check"
      title="Material Dashboard"
      content="Hello, world! This is a notification message"
      dateTime="11 mins ago"
      open={successSB}
      onClose={closeSuccessSB}
      close={closeSuccessSB}
      bgWhite
    />
  );

  const renderInfoSB = (
    <MDSnackbar
      icon="notifications"
      title="Material Dashboard"
      content="Hello, world! This is a notification message"
      dateTime="11 mins ago"
      open={infoSB}
      onClose={closeInfoSB}
      close={closeInfoSB}
    />
  );

  const renderWarningSB = (
    <MDSnackbar
      color="warning"
      icon="star"
      title="Material Dashboard"
      content="Hello, world! This is a notification message"
      dateTime="11 mins ago"
      open={warningSB}
      onClose={closeWarningSB}
      close={closeWarningSB}
      bgWhite
    />
  );

  const renderErrorSB = (
    <MDSnackbar
      color="error"
      icon="warning"
      title="Material Dashboard"
      content="Hello, world! This is a notification message"
      dateTime="11 mins ago"
      open={errorSB}
      onClose={closeErrorSB}
      close={closeErrorSB}
      bgWhite
    />
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={6} mb={3}>
        <Grid container spacing={3} justifyContent="center">
          {/* --- Alertes dynamiques : commandes au statut "Alerte" --- */}
          <Grid item xs={12} lg={8}>
            <Card>
              <MDBox p={2} lineHeight={0}>
                <MDTypography variant="h5">
                  Commandes en alerte
                  {!loadingAlertes && commandesAlerte.length > 0 && (
                    <MDTypography component="span" variant="h5" color="error" ml={1}>
                      ({commandesAlerte.length})
                    </MDTypography>
                  )}
                </MDTypography>
                <MDTypography variant="button" color="text" fontWeight="regular">
                  Mise à disposition dans moins de 2 jours
                </MDTypography>
              </MDBox>
              <MDBox pt={2} px={2} pb={2}>
                {loadingAlertes ? (
                  <MDTypography variant="button" color="text">
                    Chargement des alertes...
                  </MDTypography>
                ) : erreurAlertes ? (
                  <MDTypography variant="button" color="error">
                    {erreurAlertes}
                  </MDTypography>
                ) : commandesAlerte.length === 0 ? (
                  <MDAlert color="success" dismissible={false}>
                    <MDTypography variant="body2" color="white">
                      Aucune commande en alerte pour le moment.
                    </MDTypography>
                  </MDAlert>
                ) : (
                  commandesAlerte.map((commande) => (
                    <MDAlert key={commande.id} color="error" dismissible={false}>
                      <MDTypography variant="body2" color="white">
                        <MDTypography
                          component="span"
                          variant="body2"
                          fontWeight="bold"
                          color="white"
                        >
                          {commande.client}
                        </MDTypography>{" "}
                        — commande n° {commande.commande} ({commande.chaine}) — mise à disposition
                        le{" "}
                        <MDTypography
                          component="span"
                          variant="body2"
                          fontWeight="bold"
                          color="white"
                        >
                          {commande.date_mise_disposition}
                        </MDTypography>
                      </MDTypography>
                    </MDAlert>
                  ))
                )}
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card>
              <MDBox p={2} lineHeight={0}>
                <MDTypography variant="h5">Notifications</MDTypography>
                <MDTypography variant="button" color="text" fontWeight="regular">
                  Notifications on this page use Toasts from Bootstrap. Read more details here.
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Notifications;

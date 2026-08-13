import { useEffect, useState } from "react";
import api from "services/axiosConfig";

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

// Même logique de calcul de statut que dans le tableau des commandes,
// réutilisée ici pour ne garder que les commandes réellement en "Alerte".
import { getStatutBadge } from "layouts/tables/data/authorsTableData";

function Notifications() {
  const [successSB, setSuccessSB] = useState(false);
  const [infoSB, setInfoSB] = useState(false);
  const [warningSB, setWarningSB] = useState(false);
  const [errorSB, setErrorSB] = useState(false);

  // Commandes dont le statut calculé en direct est "Alerte"
  const [commandesAlerte, setCommandesAlerte] = useState([]);
  const [loadingAlertes, setLoadingAlertes] = useState(true);

  const openSuccessSB = () => setSuccessSB(true);
  const closeSuccessSB = () => setSuccessSB(false);
  const openInfoSB = () => setInfoSB(true);
  const closeInfoSB = () => setInfoSB(false);
  const openWarningSB = () => setWarningSB(true);
  const closeWarningSB = () => setWarningSB(false);
  const openErrorSB = () => setErrorSB(true);
  const closeErrorSB = () => setErrorSB(false);

  useEffect(() => {
    async function fetchCommandesAlerte() {
      setLoadingAlertes(true);
      try {
        const response = await api.get("/commandes/getAllCommandes/");
        const commandes = response.data.data || [];

        // On ne garde que les commandes dont le statut calculé en direct
        // (mêmes règles que le badge du tableau) est exactement "Alerte".
        const alertes = commandes.filter((c) => getStatutBadge(c).label === "Alerte");

        setCommandesAlerte(alertes);
      } catch (error) {
        console.error("Erreur lors de la récupération des commandes en alerte:", error);
      } finally {
        setLoadingAlertes(false);
      }
    }

    fetchCommandesAlerte();
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
                <MDTypography variant="h5">Commandes en alerte</MDTypography>
                <MDTypography variant="button" color="text" fontWeight="regular">
                  Mise à disposition dans moins de 2 jours
                </MDTypography>
              </MDBox>
              <MDBox pt={2} px={2} pb={2}>
                {loadingAlertes ? (
                  <MDTypography variant="button" color="text">
                    Chargement des alertes...
                  </MDTypography>
                ) : commandesAlerte.length === 0 ? (
                  <MDAlert color="success" dismissible={false}>
                    <MDTypography variant="body2" color="white">
                      Aucune commande en alerte pour le moment.
                    </MDTypography>
                  </MDAlert>
                ) : (
                  commandesAlerte.map((commande) => (
                    <MDAlert key={commande.id} color="error" dismissible>
                      <MDTypography variant="body2" color="white">
                        <MDTypography
                          component="span"
                          variant="body2"
                          fontWeight="bold"
                          color="white"
                        >
                          {commande.client}
                        </MDTypography>{" "}
                        — commande {commande.commande} ({commande.chaine}) : mise à disposition
                        prévue le{" "}
                        <MDTypography
                          component="span"
                          variant="body2"
                          fontWeight="bold"
                          color="white"
                        >
                          {commande.date_mise_disposition}
                        </MDTypography>
                        .
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
              <MDBox p={2}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} lg={3}>
                    <MDButton variant="gradient" color="success" onClick={openSuccessSB} fullWidth>
                      success notification
                    </MDButton>
                    {renderSuccessSB}
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <MDButton variant="gradient" color="info" onClick={openInfoSB} fullWidth>
                      info notification
                    </MDButton>
                    {renderInfoSB}
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <MDButton variant="gradient" color="warning" onClick={openWarningSB} fullWidth>
                      warning notification
                    </MDButton>
                    {renderWarningSB}
                  </Grid>
                  <Grid item xs={12} sm={6} lg={3}>
                    <MDButton variant="gradient" color="error" onClick={openErrorSB} fullWidth>
                      error notification
                    </MDButton>
                    {renderErrorSB}
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Notifications;

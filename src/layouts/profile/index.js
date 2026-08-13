import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";

// Overview page components
import Header from "layouts/profile/components/Header";
import PlatformSettings from "layouts/profile/components/PlatformSettings";

// Infos de l'utilisateur connecté, récupérées via GET /users/me
import { fetchCurrentUser } from "services/userService";

function Overview() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      setLoadingUser(true);
      setErrorUser(null);
      try {
        const user = await fetchCurrentUser();
        if (isMounted) setCurrentUser(user);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur connecté:", error);
        if (isMounted) setErrorUser("Impossible de charger les informations du profil.");
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }

    loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const fullName = currentUser
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
    : "";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header>
        <MDBox mt={5} mb={3}>
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={12} md={6} xl={4}>
              <PlatformSettings />
            </Grid>
            <Grid item xs={12} md={6} xl={4} sx={{ display: "flex" }}>
              <Divider orientation="vertical" sx={{ ml: -2, mr: 1 }} />
              {loadingUser ? (
                <MDBox p={2}>
                  <MDTypography variant="button" color="text">
                    Chargement du profil...
                  </MDTypography>
                </MDBox>
              ) : errorUser ? (
                <MDBox p={2}>
                  <MDTypography variant="button" color="error">
                    {errorUser}
                  </MDTypography>
                </MDBox>
              ) : (
                <ProfileInfoCard
                  title="informations du profil"
                  description=""
                  info={{
                    fullName: fullName || "Non renseigné",
                    email: currentUser?.email || "Non renseigné",
                  }}
                  social={[]}
                  action={{ route: "", tooltip: "Modifier le profil" }}
                  shadow={false}
                />
              )}
              <Divider orientation="vertical" sx={{ mx: 0 }} />
            </Grid>
          </Grid>
        </MDBox>
      </Header>
    </DashboardLayout>
  );
}

export default Overview;

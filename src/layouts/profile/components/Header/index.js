import { useState, useEffect } from "react";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React base styles
import breakpoints from "assets/theme/base/breakpoints";

// Images
import backgroundImage from "assets/images/bg-profile.jpg";

// Infos de l'utilisateur connecté, récupérées via GET /users/me
import { fetchCurrentUser } from "services/userService";

function Header({ children }) {
  const [tabsOrientation, setTabsOrientation] = useState("horizontal");

  // Utilisateur connecté, affiché en haut du profil à la place du mock
  // "Richard Davis". Chargé indépendamment du contenu passé en children.
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // A function that sets the orientation state of the tabs.
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    window.addEventListener("resize", handleTabsOrientation);
    handleTabsOrientation();

    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const user = await fetchCurrentUser();
        if (isMounted) setCurrentUser(user);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur connecté:", error);
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

  // Initiales utilisées comme fallback si aucune photo de profil n'est disponible
  const initials = fullName
    ? fullName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <MDBox position="relative" mb={5}>
      <MDBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="18.75rem"
        borderRadius="xl"
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.info.main, 0.6),
              rgba(gradients.info.state, 0.6)
            )}, url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "50%",
          overflow: "hidden",
        }}
      />
      <Card
        sx={{
          position: "relative",
          mt: -8,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={currentUser?.avatar_url || undefined}
              alt={fullName || "Avatar utilisateur"}
              sx={{
                width: 74,
                height: 74,
                fontWeight: "bold",
                bgcolor: ({ palette }) => palette.info.main,
              }}
            >
              {!currentUser?.avatar_url && (initials || "")}
            </Avatar>
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                {loadingUser ? "Chargement..." : fullName || "Utilisateur"}
              </MDTypography>
              {currentUser?.role && (
                <MDTypography variant="button" color="text" fontWeight="regular">
                  {currentUser.role}
                </MDTypography>
              )}
            </MDBox>
          </Grid>
        </Grid>
        {children}
      </Card>
    </MDBox>
  );
}

Header.defaultProps = {
  children: "",
};

Header.propTypes = {
  children: PropTypes.node,
};

export default Header;

import { useState, useEffect } from "react";

// react-router components
import { useLocation, Link, useNavigate } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

// Réutilise le même endpoint dashboard/summary que la page Notifications,
// pour garder une seule source de vérité pour les commandes en alerte.
import { fetchDashboardSummary } from "services/dashboardService";

// Infos de l'utilisateur connecté, récupérées via GET /users/me
import { fetchCurrentUser } from "services/userService";

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const [openAccountMenu, setOpenAccountMenu] = useState(false);
  const route = useLocation().pathname.split("/").slice(1);
  const navigate = useNavigate();

  // Commandes dont le statut est exactement "Alerte", affichées dans le
  // menu déroulant de notifications (icône cloche).
  const [commandesAlerte, setCommandesAlerte] = useState([]);
  const [loadingAlertes, setLoadingAlertes] = useState(true);

  // Utilisateur connecté, affiché dans le menu déroulant du compte
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAlertes() {
      try {
        const summary = await fetchDashboardSummary();
        const toutes = Array.isArray(summary?.commandesAlerte) ? summary.commandesAlerte : [];
        const alertesUniquement = toutes.filter((c) => c.statut === "Alerte");
        if (isMounted) setCommandesAlerte(alertesUniquement);
      } catch (error) {
        console.error("Erreur lors de la récupération des alertes (navbar):", error);
      } finally {
        if (isMounted) setLoadingAlertes(false);
      }
    }

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

    loadAlertes();
    loadCurrentUser();

    // Rafraîchit automatiquement les alertes toutes les 5 minutes
    const intervalId = setInterval(loadAlertes, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);
  const handleOpenAccountMenu = (event) => setOpenAccountMenu(event.currentTarget);
  const handleCloseAccountMenu = () => setOpenAccountMenu(false);

  // Clique sur une alerte du menu -> ferme le menu et va vers la page
  // Notifications, qui liste ces mêmes commandes en détail.
  const handleClickAlerte = () => {
    handleCloseMenu();
    navigate("/notifications");
  };

  const handleGoToProfile = () => {
    handleCloseAccountMenu();
    navigate("/profile");
  };

  // Render the notifications menu : une entrée rouge par commande en
  // alerte, ou un message neutre s'il n'y en a aucune.
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      {loadingAlertes ? (
        <NotificationItem icon={<Icon>hourglass_empty</Icon>} title="Chargement..." />
      ) : commandesAlerte.length === 0 ? (
        <NotificationItem icon={<Icon color="success">check_circle</Icon>} title="Aucune alerte" />
      ) : (
        commandesAlerte.map((commande) => (
          <NotificationItem
            key={commande.id}
            icon={<Icon color="error">warning</Icon>}
            title={`${commande.client} — commande n° ${commande.commande}`}
            onClick={handleClickAlerte}
          />
        ))
      )}
    </Menu>
  );

  // Render du menu déroulant du compte : prénom + nom de l'utilisateur
  // connecté, avec un lien vers le profil complet.
  const renderAccountMenu = () => (
    <Menu
      anchorEl={openAccountMenu}
      anchorReference={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openAccountMenu)}
      onClose={handleCloseAccountMenu}
      sx={{ mt: 2 }}
    >
      <MDBox px={2} py={1} minWidth="200px">
        {loadingUser ? (
          <MDTypography variant="button" color="text">
            Chargement...
          </MDTypography>
        ) : currentUser ? (
          <>
            <MDTypography variant="button" fontWeight="bold" display="block">
              {currentUser.first_name} {currentUser.last_name}
            </MDTypography>
            {currentUser.email && (
              <MDTypography variant="caption" color="text" display="block">
                {currentUser.email}
              </MDTypography>
            )}
          </>
        ) : (
          <MDTypography variant="button" color="error">
            Utilisateur introuvable
          </MDTypography>
        )}
      </MDBox>
      <Divider sx={{ my: 0.5 }} />
      <NotificationItem
        icon={<Icon>person</Icon>}
        title="Voir le profil"
        onClick={handleGoToProfile}
      />
    </Menu>
  );

  // Styles for the navbar icons
  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }

      return colorValue;
    },
  });

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </MDBox>
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            <MDBox color={light ? "white" : "inherit"}>
              {/* Compte connecté : clic -> menu déroulant avec prénom + nom */}
              <IconButton
                sx={navbarIconButton}
                size="small"
                disableRipple
                aria-controls="account-menu"
                aria-haspopup="true"
                onClick={handleOpenAccountMenu}
              >
                <Icon sx={iconsStyle}>account_circle</Icon>
              </IconButton>
              {renderAccountMenu()}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton>
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                variant="contained"
                onClick={handleOpenMenu}
              >
                <Badge badgeContent={commandesAlerte.length} color="error" overlap="circular">
                  <Icon sx={iconsStyle}>notifications</Icon>
                </Badge>
              </IconButton>
              {renderMenu()}
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;

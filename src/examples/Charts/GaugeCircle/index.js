import PropTypes from "prop-types";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

/**
 * Cercle de jauge affichant un pourcentage (heures travaillées / objectif),
 * réalisé en CSS pur (conic-gradient), sans dépendance supplémentaire.
 */
function GaugeCircle({ label, value, target }) {
  const hasTarget = typeof target === "number" && target > 0;
  const percentage = hasTarget ? Math.round((value / target) * 100) : null;
  const clampedPercentage = percentage === null ? 0 : Math.min(Math.max(percentage, 0), 100);

  let color = "#9e9e9e"; // gris : pas d'objectif défini pour cette chaîne
  if (percentage !== null) {
    if (percentage > 100) color = "#f44336"; // rouge : dépassement de capacité
    else if (percentage >= 80) color = "#ff9800"; // orange : proche de la capacité
    else color = "#4caf50"; // vert : dans l'objectif
  }

  const gradient = `conic-gradient(${color} ${clampedPercentage * 3.6}deg, #e0e0e0 0deg)`;

  return (
    <MDBox display="flex" flexDirection="column" alignItems="center" p={1}>
      <MDBox
        sx={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s ease",
        }}
      >
        <MDBox
          sx={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 4px rgba(0,0,0,0.1)",
          }}
        >
          <MDTypography variant="h6" fontWeight="bold">
            {percentage === null ? "N/A" : `${percentage}%`}
          </MDTypography>
          <MDTypography variant="caption" color="text">
            {value}h{hasTarget ? ` / ${target}h` : ""}
          </MDTypography>
        </MDBox>
      </MDBox>
      <MDTypography variant="button" fontWeight="medium" mt={1} textAlign="center">
        {label}
      </MDTypography>
    </MDBox>
  );
}

GaugeCircle.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  target: PropTypes.number,
};

GaugeCircle.defaultProps = {
  target: null,
};

export default GaugeCircle;

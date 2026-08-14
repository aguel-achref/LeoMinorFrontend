import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import GaugeCircle from "examples/Charts/GaugeCircle";

/**
 * Carte affichant une jauge circulaire par chaîne, côte à côte.
 * @param {object[]} data - ex: [{ label, total, objectif, pourcentage }]
 */
function GaugeGridCard({ title, description, data }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox padding="1rem">
        <MDTypography variant="h6">{title}</MDTypography>
        {description && (
          <MDTypography component="div" variant="button" color="text">
            {description}
          </MDTypography>
        )}
        <MDBox mt={2}>
          {hasData ? (
            <Grid container justifyContent="flex-start">
              {data.map((item) => (
                <Grid item key={item.label}>
                  <GaugeCircle label={item.label} value={item.total} target={item.objectif} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <MDBox display="flex" alignItems="center" justifyContent="center" height="10rem">
              <MDTypography variant="button" color="text">
                Aucune donnée à afficher
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </MDBox>
    </Card>
  );
}

GaugeGridCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  data: PropTypes.array.isRequired,
};

GaugeGridCard.defaultProps = {
  description: "",
};

export default GaugeGridCard;

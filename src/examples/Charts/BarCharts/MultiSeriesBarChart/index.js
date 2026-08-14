import { useMemo } from "react";
import PropTypes from "prop-types";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function MultiSeriesBarChart({ title, description, chart }) {
  const hasData = Array.isArray(chart?.labels) && chart.labels.length > 0;

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: false },
        y: { stacked: false, beginAtZero: true },
      },
      plugins: {
        legend: { position: "bottom" },
      },
    }),
    []
  );

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox padding="1rem">
        <MDTypography variant="h6">{title}</MDTypography>
        {description && (
          <MDTypography component="div" variant="button" color="text">
            {description}
          </MDTypography>
        )}
        <MDBox mt={2} height="20rem">
          {hasData ? (
            <Bar data={chart} options={options} />
          ) : (
            <MDBox display="flex" alignItems="center" justifyContent="center" height="100%">
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

MultiSeriesBarChart.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  chart: PropTypes.shape({
    labels: PropTypes.array,
    datasets: PropTypes.array,
  }).isRequired,
};

MultiSeriesBarChart.defaultProps = {
  description: "",
};

export default MultiSeriesBarChart;

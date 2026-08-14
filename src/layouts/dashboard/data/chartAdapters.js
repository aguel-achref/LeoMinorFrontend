/**
 * Transforme un tableau d'objets groupés (venant du backend)
 * au format attendu par ReportsBarChart / ReportsLineChart :
 * { labels: string[], datasets: { label, data } }
 *
 * @param {object[]} groupedData - ex: [{ label, count }] ou [{ label, total }]
 * @param {string} datasetLabel - nom affiché pour la série (ex: "Commandes", "Heures")
 * @param {string} [valueKey="count"] - nom du champ numérique à extraire (ex: "count" ou "total")
 */
export function toChartFormat(groupedData, datasetLabel, valueKey = "count") {
  const data = Array.isArray(groupedData) ? groupedData : [];

  return {
    labels: data.map((item) => item.label),
    datasets: {
      label: datasetLabel,
      data: data.map((item) => item[valueKey]),
    },
  };
}

const PALETTE = [
  "#3f51b5",
  "#4caf50",
  "#ff9800",
  "#f44336",
  "#00bcd4",
  "#9c27b0",
  "#795548",
  "#607d8b",
  "#e91e63",
  "#8bc34a",
];

/**
 * Transforme { labels, chaines, series } (venant du backend) au format
 * multi-séries attendu par react-chartjs-2 : { labels, datasets: [...] }
 *
 * @param {object} grouped - ex: { labels: [...], chaines: [...], series: [{ chaine, data }] }
 */
export function toMultiSeriesChartFormat(grouped) {
  const labels = Array.isArray(grouped?.labels) ? grouped.labels : [];
  const series = Array.isArray(grouped?.series) ? grouped.series : [];

  return {
    labels,
    datasets: series.map((s, index) => ({
      label: s.chaine,
      data: s.data,
      backgroundColor: PALETTE[index % PALETTE.length],
    })),
  };
}

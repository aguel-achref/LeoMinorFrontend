/**
 * Transforme un tableau [{ label, count }] (venant du backend)
 * au format attendu par ReportsBarChart / ReportsLineChart :
 * { labels: string[], datasets: { label, data } }
 *
 * @param {{ label: string, count: number }[]} groupedData
 * @param {string} datasetLabel - nom affiché pour la série (ex: "Commandes")
 */
export function toChartFormat(groupedData, datasetLabel) {
  return {
    labels: groupedData.map((item) => item.label),
    datasets: {
      label: datasetLabel,
      data: groupedData.map((item) => item.count),
    },
  };
}

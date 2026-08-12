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
  return {
    labels: groupedData.map((item) => item.label),
    datasets: {
      label: datasetLabel,
      data: groupedData.map((item) => item[valueKey]),
    },
  };
}

const XLSX = require('xlsx');
const path = require('path');

const THEME_COLORS = {
  light: { header: '3B82F6', alt: 'F8F9FA' },
  dark: { header: '60A5FA', alt: '374151' },
};

function generateExcel(reportData, outPath, options = {}) {
  const theme = options.theme === 'dark' ? 'dark' : 'light';
  const colors = THEME_COLORS[theme];
  const { title, username, fileName, data = [], analytics = {} } = reportData;

  const wb = XLSX.utils.book_new();

  const metaRows = [
    ['ReportGen — Generated Report'],
    ['Title', title || 'Generated Report'],
    ['Generated', new Date().toLocaleString()],
    ['User', username || 'N/A'],
    ['Source File', fileName || 'N/A'],
    [],
  ];
  const metaSheet = XLSX.utils.aoa_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, metaSheet, 'Info');

  if (data.length > 0) {
    const dataSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, dataSheet, 'Data');
  }

  const summaryRows = [
    ['Metric', 'Value'],
    ['Total Rows', analytics.rowCount || data.length],
    ['Total Columns', analytics.columnCount || 0],
  ];
  if (analytics.numericStats) {
    summaryRows.push([], ['Column', 'Min', 'Max', 'Average', 'Sum']);
    for (const [col, stats] of Object.entries(analytics.numericStats)) {
      summaryRows.push([col, stats.min, stats.max, stats.avg, stats.sum]);
    }
  }
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  if (analytics.numericStats) {
    const chartRows = [['Column', 'Average']];
    for (const [col, stats] of Object.entries(analytics.numericStats)) {
      chartRows.push([col, stats.avg]);
    }
    const chartSheet = XLSX.utils.aoa_to_sheet(chartRows);
    XLSX.utils.book_append_sheet(wb, chartSheet, 'Charts');
  }

  XLSX.writeFile(wb, outPath);
  return outPath;
}

module.exports = { generateExcel };

const fs = require('fs');
const Papa = require('papaparse');

function generateCSV(reportData, outPath) {
  const { title, username, fileName, data = [], analytics = {} } = reportData;

  const metaLines = [
    `# ReportGen — ${title || 'Generated Report'}`,
    `# Generated: ${new Date().toISOString()}`,
    `# User: ${username || 'N/A'}`,
    `# Source: ${fileName || 'N/A'}`,
    `# Rows: ${analytics.rowCount || data.length}`,
    `# Columns: ${analytics.columnCount || 0}`,
    '',
  ];

  const csvContent = data.length > 0
    ? Papa.unparse(data, { quotes: true })
    : '';

  fs.writeFileSync(outPath, metaLines.join('\n') + csvContent, 'utf8');
  return outPath;
}

module.exports = { generateCSV };

const path = require('path');
const fs = require('fs');
const { generatePDF } = require('./pdfGenerator');
const { generateExcel } = require('./excelGenerator');
const { generateCSV } = require('./csvGenerator');

const generatedDir = path.join(__dirname, '..', '..', 'generated');
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

async function generateAllFormats(report, user, theme = 'light') {
  const reportData = {
    title: report.name || report.reportTitle,
    username: user?.name || user?.email,
    fileName: report.fileName,
    data: report.parsedData || [],
    analytics: report.analytics || {},
  };

  // Use _id as the stable filename base (fallback to timestamp)
  const baseName = (report._id && String(report._id)) || `report-${Date.now()}`;
  const files = {};

  const pdfPath = path.join(generatedDir, `${baseName}.pdf`);
  await generatePDF(reportData, pdfPath, { theme });
  files.pdf = `${baseName}.pdf`;

  const excelPath = path.join(generatedDir, `${baseName}.xlsx`);
  generateExcel(reportData, excelPath, { theme });
  files.excel = `${baseName}.xlsx`;

  const csvPath = path.join(generatedDir, `${baseName}.csv`);
  generateCSV(reportData, csvPath);
  files.csv = `${baseName}.csv`;

  // Return generated filenames so callers can persist them
  return files;
}

module.exports = { generateAllFormats, generatedDir };

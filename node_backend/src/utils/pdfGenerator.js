const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const THEME_COLORS = {
  light: { primary: '#3B82F6', text: '#1F2937', muted: '#6B7280', bg: '#F8F9FA' },
  dark: { primary: '#60A5FA', text: '#F3F4F6', muted: '#9CA3AF', bg: '#1F2937' },
};

async function generatePDF(reportData, outPath, options = {}) {
  const theme = options.theme === 'dark' ? 'dark' : 'light';
  const colors = THEME_COLORS[theme];
  const { title, username, fileName, data = [], analytics = {} } = reportData;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const pageWidth = doc.page.width - 100;

    doc.fillColor(colors.primary).fontSize(22).text('ReportGen', { align: 'left' });
    doc.moveDown(0.3);
    doc.fillColor(colors.text).fontSize(16).text(title || 'Generated Report');
    doc.moveDown(0.5);
    doc.fillColor(colors.muted).fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`)
      .text(`User: ${username || 'N/A'}`)
      .text(`Source: ${fileName || 'N/A'}`);
    doc.moveDown(1);

    doc.fillColor(colors.primary).fontSize(14).text('Summary');
    doc.moveDown(0.3);
    doc.fillColor(colors.text).fontSize(11);
    doc.text(`Total Rows: ${analytics.rowCount || data.length}`);
    doc.text(`Total Columns: ${analytics.columnCount || 0}`);
    doc.moveDown(1);

    if (analytics.numericStats) {
      doc.fillColor(colors.primary).fontSize(14).text('Numeric Statistics');
      doc.moveDown(0.3);
      doc.fillColor(colors.text).fontSize(10);
      for (const [col, stats] of Object.entries(analytics.numericStats)) {
        doc.text(`${col}: min=${stats.min.toFixed(2)}, max=${stats.max.toFixed(2)}, avg=${stats.avg.toFixed(2)}, sum=${stats.sum.toFixed(2)}`);
      }
      doc.moveDown(1);
    }

    if (data.length > 0) {
      doc.fillColor(colors.primary).fontSize(14).text('Data Preview');
      doc.moveDown(0.3);
      const columns = Object.keys(data[0]);
      const preview = data.slice(0, 20);
      const colWidth = pageWidth / Math.min(columns.length, 5);

      doc.fillColor(colors.bg).rect(50, doc.y, pageWidth, 18).fill();
      doc.fillColor(colors.text).fontSize(8);
      let x = 52;
      const headerY = doc.y + 4;
      columns.slice(0, 5).forEach((col) => {
        doc.text(String(col).slice(0, 12), x, headerY, { width: colWidth - 4, lineBreak: false });
        x += colWidth;
      });
      doc.y += 22;

      preview.forEach((row, i) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
        }
        if (i % 2 === 0) {
          doc.fillColor(colors.bg).rect(50, doc.y - 2, pageWidth, 16).fill();
        }
        doc.fillColor(colors.text).fontSize(8);
        x = 52;
        const rowY = doc.y + 2;
        columns.slice(0, 5).forEach((col) => {
          doc.text(String(row[col] ?? '').slice(0, 15), x, rowY, { width: colWidth - 4, lineBreak: false });
          x += colWidth;
        });
        doc.y += 16;
      });
    }

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fillColor(colors.muted).fontSize(8)
        .text(`ReportGen — Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 40, { align: 'center', width: pageWidth });
    }

    doc.info.Title = title || 'Report';
    doc.info.Author = username || 'ReportGen';
    doc.info.CreationDate = new Date();

    doc.end();
    stream.on('finish', () => resolve(outPath));
    stream.on('error', reject);
  });
}

module.exports = { generatePDF };

const fs = require('fs');
const PDFDocument = require('pdfkit');

async function generateContentPDF({ title, content, createdAt }, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const contentWidth = doc.page.width - 100;

    doc.fontSize(22).fillColor('#3B82F6').text('Automated Report', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#1F2937').text(title);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6B7280').text(`Created: ${new Date(createdAt).toLocaleString()}`);
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#1F2937').text(content || 'No content provided.', {
      align: 'left',
      width: contentWidth,
    });

    doc.info.Title = title;
    doc.info.CreationDate = new Date(createdAt || Date.now());

    doc.end();
    stream.on('finish', () => resolve(outPath));
    stream.on('error', reject);
  });
}

module.exports = { generateContentPDF };

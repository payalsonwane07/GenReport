const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');
const Report = require('../models/Report');
const User = require('../models/User');
const { generatedDir } = require('../utils/reportGenerator');

const MIME_TYPES = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  zip: 'application/zip',
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getOwnedReport(reportId, userId) {
  return Report.findOne({ reportId, userId });
}

function getGeneratedPath(report, format) {
  const key = format === 'excel' ? 'excel' : format;
  const filename = report.generatedFiles?.[key];
  if (!filename) return null;
  return path.join(generatedDir, filename);
}

function streamFile(res, filePath, downloadName, mimeType) {
  if (!fs.existsSync(filePath)) return false;
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Content-Length', fs.statSync(filePath).size);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  return true;
}

async function resolveReportAccess(req) {
  const linkToken = req.query.linkToken;
  if (linkToken) {
    const report = await Report.findOne({ reportId: req.params.reportId });
    if (!report) return null;
    const entry = (report.downloadTokens || []).find(
      (t) => t.token === linkToken && t.expiresAt > new Date()
    );
    if (!entry) return null;
    return report;
  }
  return getOwnedReport(req.params.reportId, req.user?.id);
}

exports.downloadFormat = async (req, res) => {
  try {
    const format = req.params.format?.toLowerCase();
    const validFormats = ['pdf', 'excel', 'csv', 'zip'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ message: 'Invalid format. Use pdf, excel, csv, or zip.' });
    }

    const report = await resolveReportAccess(req);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    // Accept completed status case-insensitively
    if (String(report.status || '').toLowerCase() !== 'completed') {
      return res.status(400).json({ message: 'Report is not ready for download' });
    }

    const baseName = (report.name || report.fileName || 'report').replace(/\.[^.]+$/, '');

    if (format === 'zip') {
      const files = ['pdf', 'excel', 'csv'].map((f) => ({
        format: f,
        path: getGeneratedPath(report, f),
      })).filter((f) => f.path && fs.existsSync(f.path));

      if (!files.length) return res.status(404).json({ message: 'No generated files found' });

      res.setHeader('Content-Type', MIME_TYPES.zip);
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}-all-formats.zip"`);

      const archive = archiver('zip', { zlib: { level: 5 } });
      archive.on('error', (err) => {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ message: 'Zip generation failed' });
      });
      archive.pipe(res);

      for (const f of files) {
        const ext = f.format === 'excel' ? 'xlsx' : f.format;
        archive.file(f.path, { name: `${baseName}.${ext}` });
      }
      await archive.finalize();
    } else {
      const filePath = getGeneratedPath(report, format);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: `${format.toUpperCase()} file not found` });
      }
      const ext = format === 'excel' ? 'xlsx' : format;
      const sent = streamFile(res, filePath, `${baseName}.${ext}`, MIME_TYPES[format]);
      if (!sent) return res.status(404).json({ message: 'File not found' });
    }

    report.downloadCount = (report.downloadCount || 0) + 1;
    await report.save();
    console.log(`[Download] User ${req.user.id} downloaded ${format} for report ${report.reportId}`);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: 'Download failed' });
  }
};

exports.createDownloadLink = async (req, res) => {
  try {
    const format = req.params.format?.toLowerCase() || 'pdf';
    const report = await getOwnedReport(req.params.reportId, req.user.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    report.downloadTokens = report.downloadTokens || [];
    report.downloadTokens.push({ token, format, expiresAt });
    report.downloadTokens = report.downloadTokens.filter((t) => t.expiresAt > new Date());
    await report.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const link = `${baseUrl}/api/download/${report.reportId}/${format}?linkToken=${token}`;

    res.json({ link, expiresAt, format });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create download link' });
  }
};

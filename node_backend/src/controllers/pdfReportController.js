const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Report = require('../models/Report');
const { generateContentPDF } = require('../utils/contentPdfGenerator');

const reportsDir = path.join(__dirname, '..', '..', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

function serializeReport(report) {
  return {
    reportId: report._id,
    title: report.title,
    content: report.content,
    status: report.status,
    createdAt: report.createdAt,
    filePath: report.filePath ? `/reports/${path.basename(report.filePath)}` : null,
  };
}

exports.generateReport = async (req, res) => {
  const { title, content } = req.body;
  let report;

  try {
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    report = new Report({
      userId: req.user.id,
      title: title.trim(),
      content: content || '',
      status: 'processing',
    });
    await report.save();

    const fileName = `${report._id}.pdf`;
    const absolutePath = path.join(reportsDir, fileName);

    await generateContentPDF(
      { title: report.title, content: report.content, createdAt: report.createdAt },
      absolutePath
    );

    report.filePath = absolutePath;
    report.status = 'completed';
    await report.save();

    res.status(201).json(serializeReport(report));
  } catch (err) {
    console.error(err);
    if (report) {
      report.status = 'failed';
      await report.save().catch(() => {});
    }
    res.status(500).json({ message: 'PDF generation failed' });
  }
};

exports.downloadReport = async (req, res) => {
  const { reportId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const report = await Report.findOne({ _id: reportId, userId: req.user.id });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (report.status !== 'completed' || !report.filePath) {
      return res.status(400).json({ message: 'Report PDF is not ready' });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ message: 'PDF file not found on disk' });
    }

    const safeName = report.title.replace(/[^a-zA-Z0-9-_ ]/g, '_').trim() || 'report';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.setHeader('Content-Length', fs.statSync(report.filePath).size);
    fs.createReadStream(report.filePath).pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: 'Download failed' });
  }
};

exports.listReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id })
      .select('title content createdAt filePath status')
      .sort({ createdAt: -1 });

    res.json(reports.map(serializeReport));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

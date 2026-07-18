const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const User = require('../models/User');
const { parseUploadedFile, computeAnalytics, generateChartData } = require('../utils/dataParser');
const { generateAllFormats, generatedDir } = require('../utils/reportGenerator');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');


function serializeReport(report) {
  const obj = report.toObject ? report.toObject() : report;
  return {
    _id: obj._id,
    id: obj._id,
    userId: obj.userId,
    title: obj.title || obj.fileName || 'Untitled Report',
    fileName: obj.fileName || '',
    fileType: obj.fileType || 'unknown',
    status: obj.status || 'pending',
    createdAt: obj.createdAt || new Date(),
    pdfPath: obj.pdfPath || null,
    analytics: obj.analytics || {},
    // Include a small preview of parsed data and column names for frontend
    parsedData: Array.isArray(obj.parsedData) ? obj.parsedData.slice(0, 20) : [],
  };
}

async function processReport(report, user) {
  try {
    if (!report.storedFileName) {
      throw new Error('No stored file name found');
    }

    const filePath = path.join(uploadDir, report.storedFileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('Uploaded file not found on disk');
    }

    // Parse the uploaded file
    const { data, summary, fileType } = parseUploadedFile(filePath);
    if (!data || data.length === 0) {
      throw new Error('File contains no data');
    }

    // Compute analytics
    const analytics = computeAnalytics(data, summary);
    const charts = generateChartData(data, analytics);

    // Update report with parsed data
    report.parsedData = data.slice(0, 500); // Limit to 500 rows in database
    report.analytics = { ...analytics, charts };
    report.fileType = fileType;
    report.status = 'processing';
    await report.save();

    // Generate files (PDF, Excel, CSV) and persist generated filenames
    const theme = user?.theme === 'dark' ? 'dark' : 'light';
    const files = await generateAllFormats(report, user, theme);

    // Update report with generated filenames
    report.generatedFiles = files;
    report.pdfPath = files.pdf || null;
    report.status = 'completed';
    report.errorMessage = null;
    report.updatedAt = new Date();
    await report.save();

    console.log(`Report generation completed for ${report._id}`);
  } catch (err) {
    console.error(`Report generation failed for ${report._id}:`, err.message);
    report.status = 'failed';
    report.errorMessage = err.message;
    report.updatedAt = new Date();
    try {
      await report.save();
    } catch (saveErr) {
      console.error('Failed to save error status:', saveErr.message);
    }
  }
}

exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const saved = [];

    for (const f of req.files) {
      try {
        const report = new Report({
          userId: req.user.id,
          title: f.originalname.replace(/\.[^.]+$/, ''), // Remove extension
          fileName: f.originalname,
          storedFileName: f.filename,
          fileType: path.extname(f.originalname).toLowerCase().replace('.', ''),
          status: 'pending',
        });
        await report.save();
        saved.push(serializeReport(report));

        // Process report in background
        setImmediate(() => processReport(report, user).catch(err => {
          console.error('Background processing error:', err.message);
        }));
      } catch (fileErr) {
        console.error(`Error processing file ${f.originalname}:`, fileErr.message);
      }
    }

    if (saved.length === 0) {
      return res.status(400).json({ message: 'Failed to process uploaded files' });
    }

    res.json({
      success: true,
      data: saved,
      message: `${saved.length} file(s) uploaded. Processing in progress...`,
    });
  } catch (err) {
    console.error('Upload handler error:', err.message);
    res.status(500).json({ message: err.message || 'Server error during upload' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    report.status = 'processing';
    await report.save();

    // Process report
    await processReport(report, user);

    // Fetch updated report
    const updated = await Report.findById(reportId);
    res.json({
      success: true,
      data: serializeReport(updated),
      message: updated.status === 'completed' ? 'Report generated successfully' : 'Report generation failed',
    });
  } catch (err) {
    console.error('Generate report error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.listReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id })
      .select('-parsedData')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports.map(serializeReport),
    });
  } catch (err) {
    console.error('List reports error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.getReport = async (req, res) => {
  try {
    const requestedId = req.params.id;
    console.log('🔍 [DEBUG] getReport called');
    console.log('   Requested ID:', requestedId);
    console.log('   Requested ID type:', typeof requestedId);
    console.log('   User ID making request:', req.user.id);
    
    const report = await Report.findById(requestedId);

    if (!report) {
      console.log('   ❌ Report NOT FOUND for ID:', requestedId);
      console.log('   Checking all reports in DB for this user...');
      const allUserReports = await Report.find({ userId: req.user.id }).select('_id title fileName');
      console.log('   User has', allUserReports.length, 'reports:');
      allUserReports.forEach(r => console.log('      - _id:', r._id, '| title:', r.title));
      return res.status(404).json({ message: 'Report not found' });
    }

    console.log('   ✅ Report FOUND!');
    console.log('   Found report _id:', report._id);
    console.log('   Report userId in DB:', report.userId.toString());
    console.log('   Request user ID:', req.user.id);
    console.log('   UserID match?', report.userId.toString() === req.user.id);

    if (report.userId.toString() !== req.user.id) {
      console.log('   ❌ Authorization FAILED: userId mismatch');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    console.log('   ✅ Authorization passed, returning report');
    res.json({
      success: true,
      data: serializeReport(report),
    });
  } catch (err) {
    console.error('❌ Get report error:', err.message);
    console.error('   Stack:', err.stack);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Delete uploaded file
    if (report.storedFileName) {
      const uploadPath = path.join(uploadDir, report.storedFileName);
      if (fs.existsSync(uploadPath)) {
        try {
          fs.unlinkSync(uploadPath);
        } catch (delErr) {
          console.warn('Failed to delete uploaded file:', delErr.message);
        }
      }
    }

    if (report.generatedFiles && typeof report.generatedFiles === 'object') {
      for (const key of Object.keys(report.generatedFiles)) {
        try {
          const fname = report.generatedFiles[key];
          if (!fname) continue;
          const p = path.join(generatedDir, fname);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (delErr) {
          console.warn('Failed to delete generated file:', delErr.message);
        }
      }
    } else if (report.pdfPath) {
      const pdfPath = path.join(generatedDir, report.pdfPath);
      if (fs.existsSync(pdfPath)) {
        try {
          fs.unlinkSync(pdfPath);
        } catch (delErr) {
          console.warn('Failed to delete PDF file:', delErr.message);
        }
      }
    }

    // Delete report from database
    await Report.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (err) {
    console.error('Delete report error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({ message: 'Report is not ready for download' });
    }

    if (!report.pdfPath) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    const generatedDir = path.join(__dirname, '..', '..', 'generated');
    const pdfPath = path.join(generatedDir, report.pdfPath);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file not found on server' });
    }

    // Set headers for download
    const fileName = `${report.title || 'report'}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err.message);
      res.status(500).json({ message: 'Error downloading file' });
    });
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};


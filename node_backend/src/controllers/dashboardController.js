const Report = require('../models/Report');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await Report.find({ userId });

    const totalReports = reports.length;
    const completedReports = reports.filter((r) => r.status === 'completed').length;
    const processingReports = reports.filter((r) => r.status === 'pending' || r.status === 'processing').length;
    const failedReports = reports.filter((r) => r.status === 'failed').length;

    const monthlyData = {};
    reports.forEach((r) => {
      const date = r.createdAt;
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    const trend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([name, value]) => ({ name, value }));

    const qualityScore = totalReports > 0
      ? Math.round((completedReports / totalReports) * 100)
      : 100;

    res.json({
      success: true,
      data: {
        totalReports,
        completedReports,
        processingReports,
        failedReports,
        qualityScore,
        trend: trend.length ? trend : [{ name: 'No data', value: 0 }],
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        { id: 'standard', name: 'Standard Report', description: 'Full data table with summary statistics' },
        { id: 'summary', name: 'Summary Report', description: 'Key statistics and insights only' },
        { id: 'detailed', name: 'Detailed Report', description: 'Complete analysis with charts and tables' },
      ],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

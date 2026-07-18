const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Papa = require('papaparse');

function normalizeFileType(ext) {
  const map = { csv: 'csv', xlsx: 'xlsx', xls: 'xlsx', json: 'json' };
  return map[ext.toLowerCase()] || ext.toLowerCase();
}

function parseCSV(filePath) {
  console.log(`[dataParser] Parsing CSV file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content || content.trim().length === 0) {
    throw new Error('CSV file is empty');
  }
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  if (result.errors.length) {
    throw new Error(`CSV parsing error: ${result.errors[0].message}`);
  }
  if (!result.data || result.data.length === 0) {
    throw new Error('CSV file contains no data rows');
  }
  console.log(`[dataParser] CSV parsed successfully: ${result.data.length} rows`);
  return result.data;
}

function parseExcel(filePath) {
  console.log(`[dataParser] Parsing Excel file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }
  try {
    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file contains no sheets');
    }
    const sheetName = workbook.SheetNames[0];
    console.log(`[dataParser] Reading sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    if (!data || data.length === 0) {
      throw new Error('Excel sheet contains no data rows');
    }
    console.log(`[dataParser] Excel parsed successfully: ${data.length} rows from sheet "${sheetName}"`);
    return data;
  } catch (err) {
    throw new Error(`Excel parsing failed: ${err.message}`);
  }
}

function parseJSON(filePath) {
  console.log(`[dataParser] Parsing JSON file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content || content.trim().length === 0) {
    throw new Error('JSON file is empty');
  }
  try {
    const parsed = JSON.parse(content);
    let data;
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      data = parsed.data;
    } else {
      data = [parsed];
    }
    if (!data || data.length === 0) {
      throw new Error('JSON file contains no data rows');
    }
    console.log(`[dataParser] JSON parsed successfully: ${data.length} rows`);
    return data;
  } catch (err) {
    throw new Error(`JSON parsing failed: ${err.message}`);
  }
}

function parseUploadedFile(filePath) {
  console.log(`[dataParser] Starting parseUploadedFile: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  console.log(`[dataParser] File extension: ${ext}`);
  let data;
  switch (ext) {
    case 'csv': 
      data = parseCSV(filePath);
      break;
    case 'xlsx':
    case 'xls': 
      data = parseExcel(filePath);
      break;
    case 'json': 
      data = parseJSON(filePath);
      break;
    default: 
      throw new Error(`Unsupported file type: ${ext}`);
  }
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Parsed data is not a valid array or is empty');
  }

  const columns = Object.keys(data[0]);
  console.log(`[dataParser] Columns detected: ${columns.length} - ${columns.join(', ')}`);
  
  const summary = {
    totalRows: data.length,
    totalColumns: columns.length,
    columns,
    numericColumns: columns.filter((col) =>
      data.some((row) => {
        const val = row[col];
        return typeof val === 'number' || (val !== null && val !== undefined && !isNaN(parseFloat(val)) && val !== '');
      })
    ),
  };
  
  console.log(`[dataParser] Summary: ${summary.totalRows} rows, ${summary.totalColumns} columns, ${summary.numericColumns.length} numeric columns`);
  
  const fileType = normalizeFileType(ext);
  return { data, summary, fileType };
}

function computeAnalytics(data, summary) {
  console.log(`[dataParser] Computing analytics for ${summary.totalRows} rows`);
  const analytics = {
    totalRows: summary.totalRows,
    totalColumns: summary.totalColumns,
    columns: summary.columns,
  };
  if (summary.numericColumns.length > 0) {
    analytics.numericStats = {};
    for (const col of summary.numericColumns) {
      const values = data.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
      if (values.length) {
        analytics.numericStats[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          sum: values.reduce((a, b) => a + b, 0),
        };
      }
    }
  }
  console.log(`[dataParser] Analytics computed: ${Object.keys(analytics.numericStats || {}).length} numeric columns analyzed`);
  return analytics;
}

/**
 * Generate chart data from parsed data and analytics
 */
function generateChartData(data, analytics) {
  console.log(`[dataParser] Generating chart data`);
  if (!data || data.length === 0) return {};

  const charts = {};
  const numericCols = analytics.numericStats ? Object.keys(analytics.numericStats) : [];
  const allCols = analytics.columns || [];

  // Get categorical columns
  const categoricalCols = allCols.filter(c => !numericCols.includes(c));

  // Bar Chart: First categorical vs first numeric
  if (categoricalCols.length > 0 && numericCols.length > 0) {
    const catCol = categoricalCols[0];
    const numCol = numericCols[0];
    const grouped = {};

    data.slice(0, 100).forEach(row => {
      const key = String(row[catCol] || 'Other').substring(0, 20);
      const val = parseFloat(row[numCol]) || 0;
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      grouped[key].sum += val;
      grouped[key].count += 1;
    });

    charts.barChart = Object.entries(grouped)
      .map(([name, { sum, count }]) => ({
        name,
        value: Math.round(sum / count * 100) / 100,
      }))
      .slice(0, 10);
  }

  // Line Chart: numeric column over first 30-50 rows
  if (numericCols.length > 0) {
    const col = numericCols[0];
    charts.lineChart = data.slice(0, 50).map((row, idx) => ({
      name: `${idx + 1}`,
      value: parseFloat(row[col]) || 0,
    }));
  }

  // Pie Chart: distribution of first categorical column
  if (categoricalCols.length > 0) {
    const col = categoricalCols[0];
    const counts = {};

    data.slice(0, 200).forEach(row => {
      const key = String(row[col] || 'Other').substring(0, 20);
      counts[key] = (counts[key] || 0) + 1;
    });

    charts.pieChart = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }

  return charts;
}

module.exports = { 
  parseUploadedFile, 
  computeAnalytics, 
  normalizeFileType,
  generateChartData,
};

const fs = require('fs');
const path = require('path');

// In-memory cache for parsed datasets
const cache = new Map();

/**
 * Locate a file across potential data directories
 */
function resolveFilePath(filename) {
  const candidateDirs = [
    process.env.DATA_DIR ? path.resolve(__dirname, '..', process.env.DATA_DIR) : null,
    path.resolve(__dirname, '../../data'),
    path.resolve(__dirname, '../data'),
    path.resolve(__dirname, '../../'),
    path.resolve(__dirname, '../'),
    process.cwd(),
    path.resolve(process.cwd(), 'data')
  ].filter(Boolean);

  for (const dir of candidateDirs) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Fast robust CSV parser that splits lines and handles basic numbers
 */
function parseCsvFile(filename, useCache = true) {
  if (useCache && cache.has(filename)) {
    return cache.get(filename);
  }

  const filePath = resolveFilePath(filename);
  if (!filePath) {
    throw new Error(`Data file not found: ${filename}. Please verify the file exists in data directory.`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split by comma
    const values = rawLine.split(',').map(v => v.trim());
    const row = {};

    headers.forEach((h, idx) => {
      let val = values[idx] !== undefined ? values[idx] : '';
      // Try parsing numeric
      if (val !== '' && !isNaN(Number(val))) {
        val = Number(val);
      }
      row[h] = val;
    });

    rows.push(row);
  }

  if (useCache) {
    cache.set(filename, rows);
  }

  return rows;
}

module.exports = {
  resolveFilePath,
  parseCsvFile
};

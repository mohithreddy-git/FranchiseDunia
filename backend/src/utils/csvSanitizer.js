/**
 * Sanitizes a string for CSV cell export to neutralize Formula Injection (CSV Injection).
 * Any cell value starting with '=', '+', '-', '@', TAB (\t), or CR (\r)
 * is prepended with a single quote (') per security standards.
 * 
 * @param {any} val
 * @returns {string} Sanitized string value
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Encodes an array of row objects into CSV text with formula injection protection
 * @param {string[]} headers - Header labels
 * @param {string[]} keys - Corresponding object keys
 * @param {object[]} rows - Array of row objects
 * @returns {string} CSV text
 */
function generateSanitizedCsv(headers, keys, rows) {
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((row) => {
    return keys
      .map((k) => {
        const rawVal = row[k];
        const sanitized = sanitizeCsvCell(rawVal);
        return `"${sanitized.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headerLine, ...rowLines].join('\r\n') + '\r\n';
}

module.exports = {
  sanitizeCsvCell,
  generateSanitizedCsv,
};

// Trade Log Export Server — localhost:3456
// Receives trade log data from scalp.html, writes JSON + XLSX to Trade Logs/

const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PORT = 3456;
const LOG_DIR = path.join(__dirname, 'Trade Logs');

// Ensure Trade Logs directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/export') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const trades = data.trades || [];
        if (!trades.length) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, tradesWritten: 0, msg: 'No trades to export' }));
          return;
        }

        // Date for filename — use export date or today
        const dateStr = data.exportDate || new Date().toISOString().slice(0, 10);

        // Write JSON
        const jsonPath = path.join(LOG_DIR, `scalp-log-${dateStr}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(trades, null, 2));

        // Write XLSX
        const xlsxPath = path.join(LOG_DIR, `scalp-log-${dateStr}.xlsx`);
        const rows = trades.map(t => ({
          'Time': t.time || new Date(t.openTime).toLocaleString(),
          'Direction': (t.dir || t.Direction || '').toUpperCase(),
          'Confidence': t.conf ? t.conf + '%' : (t.Confidence || ''),
          'TF': t.tf || t.TF || '',
          'Status': t.status || t.Status || '',
          'Entry': t.entry || t.Entry || '',
          'SL': t.sl || t.SL || '',
          'TP1': t.tp1 || t.TP1 || '',
          'TP2': t.tp2 || t.TP2 || '',
          '$ P&L': t.pnl != null ? t.pnl : (t['$ P&L'] != null ? t['$ P&L'] : ''),
          'Strategy': t.stratName || t.Strategy || '',
          'Reason': t.reason || t.Reason || '',
          'Close Time': t.closeTime ? new Date(t.closeTime).toLocaleString() : (t['Close Time'] || ''),
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scalp Log');
        XLSX.writeFile(wb, xlsxPath);

        console.log(`[${new Date().toLocaleString()}] Exported ${trades.length} trades → ${dateStr} (JSON + XLSX)`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, tradesWritten: trades.length, date: dateStr }));
      } catch (err) {
        console.error('Export error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, uptime: process.uptime() }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Trade Log Export Server running on http://localhost:${PORT}`);
  console.log(`Saving to: ${LOG_DIR}`);
});

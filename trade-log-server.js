// Trade Log Export Server — localhost:3456
// Receives trade log data from scalp.html, writes JSON + XLSX to Trade Logs/

const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PORT = 3456;
const LOG_DIR = path.join(__dirname, 'Trade Logs');
const MAX_BODY = 5 * 1024 * 1024; // 5MB max request body
const ALLOWED_ORIGINS = ['http://localhost', 'https://brancammedia.github.io', 'http://127.0.0.1'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // strict YYYY-MM-DD

// Ensure Trade Logs directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function isAllowedOrigin(origin) {
  if (!origin) return true; // no origin = same-origin or non-browser
  return ALLOWED_ORIGINS.some(a => origin.startsWith(a));
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  if (!isAllowedOrigin(origin)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // CORS headers — only allowed origins
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/export') {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      if (size > MAX_BODY) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Payload too large' }));
        return;
      }
      try {
        const data = JSON.parse(body);
        const trades = data.trades || [];
        if (!trades.length) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, tradesWritten: 0, msg: 'No trades to export' }));
          return;
        }

        // Validate and sanitize date — strict YYYY-MM-DD only
        const dateStr = (data.exportDate && DATE_RE.test(data.exportDate))
          ? data.exportDate
          : new Date().toISOString().slice(0, 10);

        // Filter trades to today only (by openTime date)
        const todayStart = new Date(dateStr + 'T00:00:00').getTime();
        const todayEnd = new Date(dateStr + 'T23:59:59.999').getTime();
        const todayTrades = trades.filter(t => {
          const ts = t.openTime || 0;
          return ts >= todayStart && ts <= todayEnd;
        });

        // Also write full log as a separate cumulative file
        const fullJsonPath = path.join(LOG_DIR, 'scalp-log-cumulative.json');
        const tmpFull = fullJsonPath + '.tmp';
        fs.writeFileSync(tmpFull, JSON.stringify(trades, null, 2));
        fs.renameSync(tmpFull, fullJsonPath);

        // Write daily JSON (atomic: temp + rename)
        const jsonPath = path.join(LOG_DIR, `scalp-log-${dateStr}.json`);
        const tmpJson = jsonPath + '.tmp';
        fs.writeFileSync(tmpJson, JSON.stringify(todayTrades, null, 2));
        fs.renameSync(tmpJson, jsonPath);

        // Write daily XLSX (atomic)
        const xlsxPath = path.join(LOG_DIR, `scalp-log-${dateStr}.xlsx`);
        const tmpXlsx = xlsxPath + '.tmp';
        const rows = todayTrades.map(t => ({
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
        XLSX.writeFile(wb, tmpXlsx);
        fs.renameSync(tmpXlsx, xlsxPath);

        console.log(`[${new Date().toLocaleString()}] Exported ${todayTrades.length}/${trades.length} trades (today/total) → ${dateStr}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, tradesWritten: todayTrades.length, totalReceived: trades.length, date: dateStr }));
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

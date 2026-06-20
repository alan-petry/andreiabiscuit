const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const PORT = 3124;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.apk': 'application/vnd.android.package-archive',
};

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const filePath = path.join(ROOT, urlPath);

  function serve(fp) {
    const ext = path.extname(fp).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const stat = fs.statSync(fp);
    const headers = { 'Content-Type': mime, 'Content-Length': stat.size };
    if (ext === '.apk') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(fp)}"`;
    }
    res.writeHead(200, headers);
    fs.createReadStream(fp).pipe(res);
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      serve(path.join(filePath, 'index.html'));
    } else {
      serve(filePath);
    }
  } catch {
    try {
      serve(path.join(ROOT, 'index.html'));
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  }
}).listen(PORT, () => console.log('Frontend rodando na porta', PORT));

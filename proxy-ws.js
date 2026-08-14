// Minimal WebSocket proxy suitable for Railway
const http = require('http');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || 3000;
const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true, xfwd: true });

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WS proxy running\n');
    return;
  }
  res.writeHead(404);
  res.end();
});

server.on('upgrade', (req, socket, head) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const target = url.searchParams.get('target');
    if (!target || !/^wss?:\/\//i.test(target)) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\nMissing or invalid target');
      socket.destroy();
      return;
    }
    proxy.ws(req, socket, head, { target }, err => {
      try { socket.destroy(); } catch(e) {}
    });
  } catch (err) {
    try { socket.destroy(); } catch(e) {}
  }
});

server.listen(PORT, () => {
  console.log(`WS proxy listening on port ${PORT}`);
});

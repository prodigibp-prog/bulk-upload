/**
 * SIMTEG Local Proxy Server
 * =========================================================
 * Mengatasi CORS restriction ketika upload video dari browser.
 * Jalankan dengan: node proxy.js
 * Proxy berjalan di: http://localhost:3001
 */

const http = require('http');
const https = require('https');

// PORT: Render.com / Railway inject ini otomatis, fallback ke 3001 untuk lokal
const PORT = process.env.PORT || 3001;
const API_HOST = 'api-simteg.bintangpelajar.com';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer((req, res) => {
    // CORS: always add headers
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Health check endpoint (support GET - untuk status badge di UI)
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', proxy: 'SIMTEG Proxy', version: '1.0' }));
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    // Collect request body
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        // Map proxy path → SIMTEG API path
        const pathMap = {
            '/upload-bulk': '/bahan-ajar/video_upload/upload-video-bulk',
        };

        const apiPath = pathMap[req.url];
        if (!apiPath) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Unknown proxy path: ${req.url}` }));
            return;
        }

        console.log(`\n[Proxy] ${new Date().toLocaleTimeString()} POST ${req.url} → https://${API_HOST}${apiPath}`);
        console.log(`[Proxy] Body length: ${body.length} chars`);

        const options = {
            hostname: API_HOST,
            path: apiPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const apiReq = https.request(options, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => { data += chunk; });
            apiRes.on('end', () => {
                console.log(`[Proxy] API responded: HTTP ${apiRes.statusCode}`);
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        });

        apiReq.on('error', (err) => {
            console.error(`[Proxy] Error: ${err.message}`);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
        });

        apiReq.write(body);
        apiReq.end();
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🔀  SIMTEG Local Proxy - AKTIF       ║');
    console.log(`║   Listening on http://localhost:${PORT}   ║`);
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   → /upload-bulk                       ║`);
    console.log(`║     ↳ api-simteg.bintangpelajar.com    ║`);
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('  Biarkan terminal ini tetap terbuka saat upload.');
    console.log('  Tekan Ctrl+C untuk berhenti.\n');
});

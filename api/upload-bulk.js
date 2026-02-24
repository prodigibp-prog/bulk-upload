const https = require('https');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const bodyStr = JSON.stringify(req.body);

    return new Promise((resolve) => {
        const options = {
            hostname: 'api-simteg.bintangpelajar.com',
            path: '/bahan-ajar/video_upload/upload-video-bulk',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
            },
        };
        const apiReq = https.request(options, (apiRes) => {
            let data = '';
            apiRes.on('data', c => { data += c; });
            apiRes.on('end', () => {
                try { res.status(apiRes.statusCode).json(JSON.parse(data)); }
                catch (e) { res.status(apiRes.statusCode).send(data); }
                resolve();
            });
        });
        apiReq.on('error', (err) => { res.status(502).json({ error: err.message }); resolve(); });
        apiReq.write(bodyStr);
        apiReq.end();
    });
};

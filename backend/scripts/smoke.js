const http = require('http');

function get(path) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: process.env.PORT || 5000, path }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res({ status: r.statusCode, body: d }));
    }).on('error', rej);
  });
}

function post(path, data) {
  return new Promise((res, rej) => {
    const d = JSON.stringify(data);
    const req = http.request({ host: '127.0.0.1', port: process.env.PORT || 5000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, (r) => {
      let body = '';
      r.on('data', c => body += c);
      r.on('end', () => res({ status: r.statusCode, body }));
    });
    req.on('error', rej);
    req.write(d);
    req.end();
  });
}

(async () => {
  try {
    console.log('Checking /');
    const root = await get('/');
    if (root.status !== 200) throw new Error('Root not 200');

    console.log('Attempting login with admin/changeme');
    const login = await post('/api/users/login', { username: 'admin', password: 'changeme' });
    if (login.status !== 200) throw new Error('Login failed');
    const data = JSON.parse(login.body);
    if (!data.token) throw new Error('No token returned');

    console.log('API smoke check passed');
    process.exit(0);
  } catch (err) {
    console.error('Smoke failed', err);
    process.exit(1);
  }
})();

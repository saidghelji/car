const http = require('http');

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:5000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let out = '';
      res.on('data', d => out += d);
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const customers = await getJson('/api/customers');
    const vehicles = await getJson('/api/vehicles');
    const cust = customers[0];
    const veh = vehicles[0];
    const body = {
      client: cust.id,
      contractDate: new Date().toISOString(),
      departureDate: new Date().toISOString(),
      returnDate: new Date(Date.now()+2*24*60*60*1000).toISOString(),
      matricule: veh.licensePlate,
      vehicle: veh.id,
      pricePerDay: 50,
      total: 100,
      paymentType: 'espece'
    };
    const res = await postJson('/api/contracts', body);
    console.log('STATUS', res.status);
    console.log(res.body);
  } catch (err) {
    console.error(err);
  }
})();

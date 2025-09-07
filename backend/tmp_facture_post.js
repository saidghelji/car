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
    const contracts = await getJson('/api/contracts');
    const cust = customers[0];
    const contract = contracts[0];
    const body = {
      clientId: cust.id,
      contractId: contract.id,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now()+30*24*60*60*1000).toISOString(),
      totalTTC: 200,
      montantHT: 180,
      tvaAmount: 20,
      tvaPercentage: 11.11,
      paymentType: 'espèce'
    };
    const res = await postJson('/api/factures', body);
    console.log('STATUS', res.status);
    console.log(res.body);
  } catch (err) {
    console.error(err);
  }
})();

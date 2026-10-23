const http = require('http');

console.log('====================================================');
console.log('PHASE 5: SERVER API INTEGRATION TEST SUITE');
console.log('====================================================\n');

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition, name, detail = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${detail}`);
    }
  }

  // TEST 1: Missing customer name
  const res1 = await postJSON('/api/orders/create', {
    customer_name: '',
    customer_phone: '+1 555-0199',
    customer_address: '123 Pine St',
    latitude: 33.5850,
    longitude: -7.6100,
    items: [{ product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }],
  });
  assert(res1.status === 400 && res1.body.error.includes('name'), 'Order API: Missing customer name rejected with 400');

  // TEST 2: Missing customer phone
  const res2a = await postJSON('/api/orders/create', {
    customer_name: 'John Doe',
    customer_phone: '',
    customer_address: '123 Pine St',
    latitude: 33.5850,
    longitude: -7.6100,
    items: [{ product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }],
  });
  assert(res2a.status === 400 && res2a.body.error.includes('phone'), 'Order API: Missing phone rejected with 400');

  // TEST 3: Invalid phone format
  const res2 = await postJSON('/api/orders/create', {
    customer_name: 'Jane Doe',
    customer_phone: 'abc-no-digits',
    customer_address: '123 Pine St',
    latitude: 33.5850,
    longitude: -7.6100,
    items: [{ product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }],
  });
  assert(res2.status === 400 && res2.body.error.includes('phone'), 'Order API: Malformed phone rejected with 400');

  // TEST 4: Missing address
  const res3a = await postJSON('/api/orders/create', {
    customer_name: 'Jane Doe',
    customer_phone: '+1 555-0199',
    customer_address: '   ',
    latitude: 33.5850,
    longitude: -7.6100,
    items: [{ product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }],
  });
  assert(res3a.status === 400 && res3a.body.error.includes('address'), 'Order API: Blank address rejected with 400');

  // TEST 5: Invalid coordinates
  const res3 = await postJSON('/api/orders/create', {
    customer_name: 'Jane Doe',
    customer_phone: '+1 555-0199',
    customer_address: '123 Pine St',
    latitude: 999.0, // Invalid latitude
    longitude: -7.6100,
    items: [{ product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }],
  });
  assert(res3.status === 400 && res3.body.error.includes('coordinates'), 'Order API: Out-of-bounds coordinates rejected with 400');

  // TEST 6: Empty items array
  const res4a = await postJSON('/api/orders/create', {
    customer_name: 'Jane Doe',
    customer_phone: '+1 555-0199',
    customer_address: '123 Pine St',
    latitude: 33.5850,
    longitude: -7.6100,
    items: [],
  });
  assert(res4a.status === 400 && res4a.body.error.includes('at least one product'), 'Order API: Empty items array rejected with 400');

  // TEST 7: Invalid item quantity (negative / zero / float)
  const res4b = await postJSON('/api/orders/create', {
    customer_name: 'Jane Doe',
    customer_phone: '+1 555-0199',
    customer_address: '123 Pine St',
    latitude: 33.5850,
    longitude: -7.6100,
    items: [{ product_id: '00000000-0000-0000-0000-000000000000', quantity: -2 }],
  });
  assert(res4b.status === 400 && res4b.body.error.includes('quantity'), 'Order API: Non-positive item quantity rejected with 400');

  // TEST 8: Nonexistent product ID in database
  const res4 = await postJSON('/api/orders/create', {
    customer_name: 'Jane Doe',
    customer_phone: '+1 555-0199',
    customer_address: '123 Pine St',
    latitude: 33.5850,
    longitude: -7.6100,
    items: [{ product_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
  });
  assert(res4.status === 400 && res4.body.error.includes('not found'), 'Order API: Nonexistent product rejected with 400');

  // TEST 9: Eligibility API - Malformed coordinate types
  const res5 = await postJSON('/api/delivery/check-eligibility', {
    lat: 'invalid-string',
    lng: -7.6100,
  });
  assert(res5.status === 400 && res5.body.isEligible === false, 'Eligibility API: Invalid latitude type rejected with 400');

  // TEST 10: Eligibility API - Normal coordinate lookup
  const res6 = await postJSON('/api/delivery/check-eligibility', {
    lat: 33.5850,
    lng: -7.6100,
  });
  assert(res6.status === 200 && typeof res6.body.isEligible === 'boolean', 'Eligibility API: Active coordinate check returns structured 200 result');

  console.log('\n====================================================');
  console.log(`INTEGRATION RESULTS: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');

  if (passed === total) process.exit(0);
  else process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

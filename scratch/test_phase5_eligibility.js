const { validateDeliveryEligibility, isPointInPolygon } = require('../src/lib/geo/point-in-polygon');

console.log('====================================================');
console.log('RUNNING PHASE 5 DELIVERY ELIGIBILITY TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
  }
}

// 1. Polygon Definition: Square in Casablanca [33.58 - 33.60, -7.63 - -7.59]
const testActiveZone = {
  id: 'zone-active-1',
  name: 'Central District (Active)',
  polygon: [
    [33.6000, -7.6300],
    [33.6000, -7.5900],
    [33.5750, -7.5900],
    [33.5750, -7.6300],
  ],
  active: true,
  delivery_fee: 2.50,
  color: '#4f46e5',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const testInactiveZone = {
  id: 'zone-inactive-2',
  name: 'Harbor District (Inactive)',
  polygon: [
    [33.6500, -7.6500],
    [33.6500, -7.6200],
    [33.6200, -7.6200],
    [33.6200, -7.6500],
  ],
  active: false,
  delivery_fee: 5.00,
  color: '#d97706',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const allZones = [testActiveZone, testInactiveZone];

// TEST 1: Customer point clearly inside active zone
const insidePoint = { lat: 33.5850, lng: -7.6100 };
const res1 = validateDeliveryEligibility(insidePoint.lat, insidePoint.lng, allZones);
assert(
  res1.isEligible === true && res1.matchingZone.id === 'zone-active-1' && res1.deliveryFee === 2.50,
  'Customer inside active zone -> Eligible with correct zone and delivery fee'
);

// TEST 2: Customer point outside all zones
const outsidePoint = { lat: 33.7000, lng: -7.5000 };
const res2 = validateDeliveryEligibility(outsidePoint.lat, outsidePoint.lng, allZones);
assert(
  res2.isEligible === false && res2.matchingZone === null,
  'Customer outside all zones -> Ineligible'
);

// TEST 3: Customer point inside an INACTIVE zone only
const inactivePoint = { lat: 33.6300, lng: -7.6300 };
const res3 = validateDeliveryEligibility(inactivePoint.lat, inactivePoint.lng, allZones);
assert(
  res3.isEligible === false && res3.matchingZone === null,
  'Customer inside inactive zone only -> Ineligible'
);

// TEST 4: Customer point exactly on boundary edge (Boundary rule: treated as inside)
const boundaryPoint = { lat: 33.6000, lng: -7.6100 }; // On top horizontal edge [33.60, -7.63] to [33.60, -7.59]
const res4 = validateDeliveryEligibility(boundaryPoint.lat, boundaryPoint.lng, allZones);
assert(
  res4.isEligible === true && res4.matchingZone.id === 'zone-active-1',
  'Customer on polygon boundary edge -> Treated as inside per documented rule'
);

// TEST 5: Customer point on a vertex corner
const vertexPoint = { lat: 33.6000, lng: -7.6300 };
const res5 = validateDeliveryEligibility(vertexPoint.lat, vertexPoint.lng, allZones);
assert(
  res5.isEligible === true && res5.matchingZone.id === 'zone-active-1',
  'Customer on polygon vertex corner -> Treated as inside'
);

// TEST 6: Invalid coordinates (NaN, Infinity, out-of-range bounds)
const invalidLat = validateDeliveryEligibility(120.0, -7.6100, allZones);
const nanCoord = validateDeliveryEligibility(NaN, -7.6100, allZones);
assert(
  invalidLat.isEligible === false && nanCoord.isEligible === false,
  'Invalid/out-of-bounds coordinates -> Safely rejected without throwing'
);

// TEST 7: Malformed polygon in zone data (empty points, non-array)
const malformedZone = {
  id: 'zone-malformed',
  name: 'Broken Zone',
  polygon: 'bad json string {[',
  active: true,
  delivery_fee: 10,
};
const res7 = validateDeliveryEligibility(insidePoint.lat, insidePoint.lng, [malformedZone]);
assert(
  res7.isEligible === false,
  'Malformed polygon data -> Safely skipped without crashing'
);

// TEST 8: Overlapping zones deterministic selection
const overlappingZone = {
  id: 'zone-active-0-alpha',
  name: 'Overlapping Priority Zone',
  polygon: testActiveZone.polygon,
  active: true,
  delivery_fee: 1.00,
  color: '#059669',
};
const res8 = validateDeliveryEligibility(insidePoint.lat, insidePoint.lng, [overlappingZone, testActiveZone]);
assert(
  res8.isEligible === true && res8.matchingZone.id === 'zone-active-0-alpha',
  'Overlapping zones -> Deterministically selected by sorted ID'
);

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

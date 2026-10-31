/**
 * Brightloop Registration API Test Suite
 * Tests: valid signup, duplicate signup, and every password validation condition.
 * Run: node test-register.js  (from backend/ with server NOT running on port 5000)
 */
import http from 'http';
import { spawn } from 'child_process';

const BASE = 'http://localhost:5000';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };

    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(chunks);
        } catch {
          json = { raw: chunks };
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${label} ${detail}`);
    failed++;
  }
}

async function run() {
  console.log('--- BRIGHTLOOP REGISTRATION API TESTS ---\n');

  // TEST 1: Missing fields
  console.log('TEST 1: Missing email and password');
  let res = await request('POST', '/api/auth/register', {});
  assert('Returns 400', res.status === 400, `got ${res.status}`);
  assert('Error message mentions required', res.body.message?.includes('required'), res.body.message);

  // TEST 2: Missing password only
  console.log('\nTEST 2: Missing password');
  res = await request('POST', '/api/auth/register', { email: 'test@example.com' });
  assert('Returns 400', res.status === 400, `got ${res.status}`);

  // TEST 3: Invalid email format
  console.log('\nTEST 3: Invalid email format');
  res = await request('POST', '/api/auth/register', { email: 'not-an-email', password: 'Abcdef@123' });
  assert('Returns 400', res.status === 400, `got ${res.status}`);
  assert('Error mentions email', res.body.message?.toLowerCase().includes('email'), res.body.message);

  // TEST 4: Password too short (<9 chars)
  console.log('\nTEST 4: Password too short (8 chars)');
  res = await request('POST', '/api/auth/register', { email: 'short@test.com', password: 'Ab@12345' });
  assert('Returns 400', res.status === 400, `got ${res.status}`);
  assert('Error mentions requirements', res.body.message?.includes('9 characters'), res.body.message);

  // TEST 5: Password missing uppercase
  console.log('\nTEST 5: Password missing uppercase');
  res = await request('POST', '/api/auth/register', { email: 'noupper@test.com', password: 'abcdefgh@1' });
  assert('Returns 400', res.status === 400, `got ${res.status}`);
  assert('Error mentions uppercase', res.body.message?.includes('uppercase'), res.body.message);

  // TEST 6: Password missing lowercase
  console.log('\nTEST 6: Password missing lowercase');
  res = await request('POST', '/api/auth/register', { email: 'nolower@test.com', password: 'ABCDEFGH@1' });
  assert('Returns 400', res.status === 400, `got ${res.status}`);
  assert('Error mentions lowercase', res.body.message?.includes('lowercase'), res.body.message);

  // TEST 7: Password missing special character
  console.log('\nTEST 7: Password missing special character');
  res = await request('POST', '/api/auth/register', { email: 'nospecial@test.com', password: 'Abcdefgh12' });
  assert('Returns 400', res.status === 400, `got ${res.status}`);
  assert('Error mentions special', res.body.message?.includes('special'), res.body.message);

  // TEST 8: Valid registration
  console.log('\nTEST 8: Valid customer registration');
  const testEmail = `testcustomer_${Date.now()}@brightloop.test`;
  res = await request('POST', '/api/auth/register', { email: testEmail, password: 'SecurePass@1' });
  assert('Returns 201', res.status === 201, `got ${res.status}`);
  assert('success is true', res.body.success === true);
  assert('Email is normalized to lowercase', res.body.user?.email === testEmail.toLowerCase());
  assert('Role is customer', res.body.user?.role === 'customer');
  assert('Has id', !!res.body.user?.id);
  assert('Has createdAt', !!res.body.user?.createdAt);
  assert('passwordHash NOT exposed', res.body.user?.passwordHash === undefined);

  // TEST 9: Duplicate email
  console.log('\nTEST 9: Duplicate email registration');
  res = await request('POST', '/api/auth/register', { email: testEmail, password: 'SecurePass@1' });
  assert('Returns 409', res.status === 409, `got ${res.status}`);
  assert('Error mentions already exists', res.body.message?.includes('already exists'), res.body.message);

  // TEST 10: Email whitespace trimming and case normalization
  console.log('\nTEST 10: Email normalization (whitespace + uppercase)');
  const rawEmail = `  TestNormalize_${Date.now()}@BRIGHTLOOP.TEST  `;
  res = await request('POST', '/api/auth/register', { email: rawEmail, password: 'NormalizedPass@1' });
  assert('Returns 201', res.status === 201, `got ${res.status}`);
  assert('Email is lowercase + trimmed', res.body.user?.email === rawEmail.trim().toLowerCase());

  // TEST 11: Reject role escalation attempt
  console.log('\nTEST 11: Role escalation attempt (sending role: admin)');
  const escalationEmail = `escalation_${Date.now()}@brightloop.test`;
  res = await request('POST', '/api/auth/register', {
    email: escalationEmail,
    password: 'EscalateMe@1',
    role: 'admin',
  });
  assert('Returns 201 (not rejected outright)', res.status === 201, `got ${res.status}`);
  assert('Role is still customer (escalation blocked)', res.body.user?.role === 'customer', `got ${res.body.user?.role}`);

  // SUMMARY
  console.log(`\n--- RESULTS: ${passed} passed, ${failed} failed ---`);
  return failed === 0;
}

run()
  .then((allPassed) => process.exit(allPassed ? 0 : 1))
  .catch((err) => {
    console.error('[Test Error]', err);
    process.exit(1);
  });


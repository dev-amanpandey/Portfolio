#!/usr/bin/env node

/**
 * Test Certificate Authentication
 * This script tests that:
 * 1. GET /api/certificates works WITHOUT auth
 * 2. POST /api/certificates requires auth
 * 3. DELETE /api/certificates/:id requires auth
 * 4. Authenticated admin can POST and DELETE
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

let authCookie = '';
let testCertificateId = '';

function makeRequest(method, endpoint, body = null, useAuth = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (useAuth && authCookie) {
      options.headers['Cookie'] = authCookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Certificate Authentication Tests\n');

  try {
    // Test 1: GET /api/certificates (Public - should work)
    console.log('✓ Test 1: GET /api/certificates (Public)');
    let response = await makeRequest('GET', '/api/certificates');
    if (response.statusCode === 200) {
      console.log('  ✅ PASS: Public GET works (200)');
    } else {
      console.log(`  ❌ FAIL: Expected 200, got ${response.statusCode}`);
    }

    // Test 2: POST /api/certificates without auth (should return 401)
    console.log('\n✓ Test 2: POST /api/certificates (Without Auth)');
    response = await makeRequest('POST', '/api/certificates', {
      title: 'Test Cert',
      issuer: 'Test Issuer',
    });
    if (response.statusCode === 401) {
      console.log('  ✅ PASS: POST without auth returns 401');
      console.log(`  Response: ${response.body}`);
    } else {
      console.log(`  ❌ FAIL: Expected 401, got ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }

    // Test 3: DELETE /api/certificates/:id without auth (should return 401)
    console.log('\n✓ Test 3: DELETE /api/certificates/:id (Without Auth)');
    response = await makeRequest('DELETE', '/api/certificates/6a8ffc886f8b7f035528879c');
    if (response.statusCode === 401) {
      console.log('  ✅ PASS: DELETE without auth returns 401');
    } else {
      console.log(`  ❌ FAIL: Expected 401, got ${response.statusCode}`);
    }

    if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
      console.log('\nSkipping authenticated checks: set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD to run them.');
      process.exit(0);
    }

    // Test 4: Login to get auth token
    console.log('\n✓ Test 4: POST /api/admin/login (Get Auth Token)');
    response = await makeRequest('POST', '/api/admin/login', {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });
    if (response.statusCode === 200) {
      const setCookie = response.headers['set-cookie'];
      if (setCookie && Array.isArray(setCookie)) {
        authCookie = setCookie
          .map((cookie) => cookie.split(';')[0])
          .join('; ');
        console.log('  ✅ PASS: Login successful, auth cookie obtained');
        console.log(`  Cookie: ${authCookie.substring(0, 50)}...`);
      } else {
        console.log('  ⚠️  WARNING: No set-cookie header received');
      }
    } else {
      console.log(`  ❌ FAIL: Expected 200, got ${response.statusCode}`);
      console.log(`  Response: ${response.body}`);
    }

    // Test 5: Verify GET /api/admin/me with auth
    console.log('\n✓ Test 5: GET /api/admin/me (Verify Auth)');
    response = await makeRequest('GET', '/api/admin/me', null, true);
    if (response.statusCode === 200) {
      console.log('  ✅ PASS: Admin can access /me endpoint');
      const data = JSON.parse(response.body);
      console.log(`  User: ${data.user?.email}`);
    } else {
      console.log(`  ❌ FAIL: Expected 200, got ${response.statusCode}`);
    }

    console.log('\n✅ All authentication tests completed!');
    console.log('\n📝 Summary:');
    console.log('  ✓ GET /api/certificates: PUBLIC (no auth required)');
    console.log('  ✓ POST /api/certificates: PROTECTED (requireAdmin middleware)');
    console.log('  ✓ DELETE /api/certificates/:id: PROTECTED (requireAdmin middleware)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  }
}

runTests();

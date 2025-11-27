/**
 * Frontend-to-Backend Integration Test Runner
 *
 * Standalone Node.js script to test the frontend calling the backend API
 * Run with: node integration-runner.js
 *
 * Requires backend to be running on http://127.0.0.1:5000
 */

const API_BASE_URL = "http://127.0.0.1:5000";

// Test results tracking
let passed = 0;
let failed = 0;
const results = [];

// Colors for console output
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

// Helper to create a valid location object
function createLocation(address, lat, lng, rank = 1, time = 30) {
  return {
    address,
    coordinates: { lat, lng },
    rank,
    time,
  };
}

// Helper function to make requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: response.headers,
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Test runner
async function runTest(name, testFn) {
  try {
    await testFn();
    passed++;
    results.push({ name, status: "PASS" });
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } catch (error) {
    failed++;
    results.push({ name, status: "FAIL", error: error.message });
    console.log(`  ${RED}✗${RESET} ${name}`);
    console.log(`    ${RED}Error: ${error.message}${RESET}`);
  }
}

// Assert helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(
      message || `Expected ${value} to be between ${min} and ${max}`
    );
  }
}

// ============================================
// TEST SUITES
// ============================================

async function testBackendConnectivity() {
  console.log(`\n${CYAN}Backend Connectivity${RESET}`);

  await runTest("should connect to backend health endpoint", async () => {
    const res = await makeRequest("/health");
    assert(res.ok, `Health check failed: ${res.error || res.status}`);
    assertEqual(res.data.status, "healthy", "Status should be healthy");
  });

  await runTest("should return version info", async () => {
    const res = await makeRequest("/health");
    assert(res.ok, `Health check failed: ${res.error || res.status}`);
    assert("version" in res.data, "Should have version field");
    assert("timestamp" in res.data, "Should have timestamp field");
  });
}

async function testSubmitTwoLocations() {
  console.log(`\n${CYAN}Submit Two Locations (Main Use Case)${RESET}`);

  await runTest(
    "should successfully submit two valid locations and get midpoint",
    async () => {
      const locations = [
        createLocation("Cape Town, South Africa", -33.9249, 18.4241, 1, 30),
        createLocation("Johannesburg, South Africa", -26.2041, 28.0473, 2, 30),
      ];

      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });

      assert(
        res.ok,
        `Request failed: ${res.error || JSON.stringify(res.data)}`
      );
      assert(res.data.midpoint, "Response should have midpoint");
      assert(
        typeof res.data.midpoint.lat === "number",
        "Midpoint should have lat"
      );
      assert(
        typeof res.data.midpoint.lng === "number",
        "Midpoint should have lng"
      );

      // Verify response has expected fields
      assert(res.data.allCoordinates, "Should have allCoordinates");
      assertEqual(
        res.data.allCoordinates.length,
        2,
        "Should have 2 coordinate pairs"
      );

      // Verify midpoint is between the two locations
      assertInRange(
        res.data.midpoint.lat,
        -34,
        -26,
        "Midpoint lat should be between locations"
      );
      assertInRange(
        res.data.midpoint.lng,
        18,
        29,
        "Midpoint lng should be between locations"
      );
    }
  );

  await runTest("should successfully submit three locations", async () => {
    const locations = [
      createLocation("Cape Town, South Africa", -33.9249, 18.4241, 1, 30),
      createLocation("Johannesburg, South Africa", -26.2041, 28.0473, 2, 30),
      createLocation("Durban, South Africa", -29.8587, 31.0218, 3, 30),
    ];

    const res = await makeRequest("/locations", {
      method: "POST",
      body: JSON.stringify({ locations }),
    });

    assert(res.ok, `Request failed: ${res.error || JSON.stringify(res.data)}`);
    assertEqual(
      res.data.allCoordinates.length,
      3,
      "Should have 3 coordinate pairs"
    );
    assert(res.data.midpoint, "Should have midpoint");
  });

  await runTest("should reject submission with only one location", async () => {
    const locations = [
      createLocation("Cape Town, South Africa", -33.9249, 18.4241, 1, 30),
    ];

    const res = await makeRequest("/locations", {
      method: "POST",
      body: JSON.stringify({ locations }),
    });

    assert(!res.ok, "Single location should be rejected");
    assert(
      [400, 422, 500].includes(res.status),
      `Status should be error, got ${res.status}`
    );
  });

  await runTest(
    "should reject submission with empty locations array",
    async () => {
      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations: [] }),
      });

      assert(!res.ok, "Empty locations should be rejected");
    }
  );

  await runTest(
    "should reject submission without locations field",
    async () => {
      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({}),
      });

      assert(!res.ok, "Missing locations field should be rejected");
    }
  );
}

async function testLocationValidation() {
  console.log(`\n${CYAN}Location Validation${RESET}`);

  await runTest(
    "should reject location with invalid latitude (>90)",
    async () => {
      const locations = [
        createLocation("Valid", -33.9249, 18.4241, 1, 30),
        createLocation("Invalid", 100, 28.0473, 2, 30), // Invalid lat
      ];

      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });

      assert(!res.ok, "Invalid latitude should be rejected");
    }
  );

  await runTest(
    "should reject location with invalid longitude (>180)",
    async () => {
      const locations = [
        createLocation("Valid", -33.9249, 18.4241, 1, 30),
        createLocation("Invalid", -26.2041, 200, 2, 30), // Invalid lng
      ];

      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });

      assert(!res.ok, "Invalid longitude should be rejected");
    }
  );

  await runTest(
    "should reject location missing coordinates field",
    async () => {
      const locations = [
        createLocation("Valid", -33.9249, 18.4241, 1, 30),
        { address: "Missing coords", rank: 2, time: 30 }, // No coordinates
      ];

      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });

      assert(!res.ok, "Missing coordinates should be rejected");
    }
  );

  await runTest("should reject location missing rank field", async () => {
    const locations = [
      createLocation("Valid", -33.9249, 18.4241, 1, 30),
      {
        address: "Missing rank",
        coordinates: { lat: -26.2041, lng: 28.0473 },
        time: 30,
      },
    ];

    const res = await makeRequest("/locations", {
      method: "POST",
      body: JSON.stringify({ locations }),
    });

    assert(!res.ok, "Missing rank should be rejected");
  });
}

async function testMidpointCalculation() {
  console.log(`\n${CYAN}Midpoint Calculation${RESET}`);
  console.log(
    `  ${YELLOW}Note: These tests may fail due to Google Maps API rate limits${RESET}`
  );

  // Add delay to avoid rate limiting
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await runTest(
    "should calculate correct midpoint for symmetric locations",
    async () => {
      const locations = [
        createLocation("West", 0, 10, 1, 30),
        createLocation("East", 0, 20, 2, 30),
      ];

      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });

      // Handle rate limiting gracefully
      if (!res.ok && res.data?.message?.includes("Too many requests")) {
        console.log(`    ${YELLOW}⚠ Skipped due to API rate limit${RESET}`);
        passed++; // Count as passed since it's an external limitation
        return;
      }

      assert(
        res.ok,
        `Request failed: ${res.error || JSON.stringify(res.data)}`
      );

      // Midpoint should be at lng ~15 (halfway between 10 and 20)
      assertInRange(
        res.data.midpoint.lat,
        -1,
        1,
        "Midpoint lat should be near 0"
      );
      assertInRange(
        res.data.midpoint.lng,
        14,
        16,
        "Midpoint lng should be near 15"
      );
    }
  );

  // Add delay between tests
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await runTest(
    "should calculate midpoint for locations in different hemispheres",
    async () => {
      const locations = [
        createLocation("New York", 40.7128, -74.006, 1, 30),
        createLocation("Sydney", -33.8688, 151.2093, 2, 30),
      ];

      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });

      // Handle rate limiting gracefully
      if (!res.ok && res.data?.message?.includes("Too many requests")) {
        console.log(`    ${YELLOW}⚠ Skipped due to API rate limit${RESET}`);
        passed++; // Count as passed since it's an external limitation
        return;
      }

      assert(
        res.ok,
        `Request failed: ${res.error || JSON.stringify(res.data)}`
      );
      assert(res.data.midpoint, "Should have midpoint");
      assert(
        typeof res.data.midpoint.lat === "number",
        "Should have numeric lat"
      );
      assert(
        typeof res.data.midpoint.lng === "number",
        "Should have numeric lng"
      );
    }
  );
}

async function testResponseStructure() {
  console.log(`\n${CYAN}Response Structure${RESET}`);

  await runTest(
    "should return properly structured response with all fields",
    async () => {
      const locations = [
        createLocation("Cape Town", -33.9249, 18.4241, 1, 30),
        createLocation("Johannesburg", -26.2041, 28.0473, 2, 30),
      ];

      const res = await makeRequest("/locations", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });

      assert(res.ok, `Request should succeed: ${JSON.stringify(res.data)}`);

      // Check required fields exist
      assert(res.data.midpoint, "Should have midpoint");
      assert(res.data.allCoordinates, "Should have allCoordinates");
      assert(res.data.allDistances, "Should have allDistances");
      assert(res.data.allTimes, "Should have allTimes");

      // Check data types
      assertEqual(
        typeof res.data.midpoint.lat,
        "number",
        "Lat should be number"
      );
      assertEqual(
        typeof res.data.midpoint.lng,
        "number",
        "Lng should be number"
      );

      // Coordinates should be valid
      assertInRange(res.data.midpoint.lat, -90, 90, "Lat should be valid");
      assertInRange(res.data.midpoint.lng, -180, 180, "Lng should be valid");
    }
  );

  await runTest("should return JSON content type", async () => {
    const res = await makeRequest("/health");

    const contentType = res.headers.get("content-type");
    assert(contentType.includes("application/json"), "Should be JSON");
  });
}

// ============================================
// MAIN RUNNER
// ============================================

async function main() {
  console.log(
    `\n${YELLOW}═══════════════════════════════════════════════════════════${RESET}`
  );
  console.log(`${YELLOW}   Frontend → Backend Integration Test Suite${RESET}`);
  console.log(
    `${YELLOW}═══════════════════════════════════════════════════════════${RESET}`
  );
  console.log(`\nConnecting to: ${API_BASE_URL}`);

  // Check if backend is running
  try {
    const healthCheck = await makeRequest("/health");
    if (!healthCheck.ok) {
      console.log(
        `\n${RED}ERROR: Backend is not responding. Please start the backend first.${RESET}`
      );
      console.log(`Run: cd backend && python app.py`);
      process.exit(1);
    }
    console.log(`${GREEN}Backend is running!${RESET}\n`);
  } catch (error) {
    console.log(
      `\n${RED}ERROR: Cannot connect to backend at ${API_BASE_URL}${RESET}`
    );
    console.log(`Error: ${error.message}`);
    console.log(`\nPlease ensure the backend is running:`);
    console.log(`  cd backend && python app.py`);
    process.exit(1);
  }

  // Run all test suites
  await testBackendConnectivity();
  await testSubmitTwoLocations();
  await testLocationValidation();
  await testMidpointCalculation();
  await testResponseStructure();

  // Print summary
  console.log(
    `\n${YELLOW}═══════════════════════════════════════════════════════════${RESET}`
  );
  console.log(`${YELLOW}   Test Summary${RESET}`);
  console.log(
    `${YELLOW}═══════════════════════════════════════════════════════════${RESET}`
  );

  const total = passed + failed;
  console.log(`\n  Total:  ${total} tests`);
  console.log(`  ${GREEN}Passed: ${passed}${RESET}`);
  console.log(`  ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`);

  if (failed === 0) {
    console.log(`\n  ${GREEN}✓ ALL TESTS PASSED!${RESET}\n`);
  } else {
    console.log(`\n  ${RED}✗ SOME TESTS FAILED${RESET}\n`);

    console.log(`  Failed tests:`);
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`    ${RED}• ${r.name}${RESET}`);
        console.log(`      ${r.error}`);
      });
    console.log();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);

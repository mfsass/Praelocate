/**
 * Frontend-to-Backend Integration Tests
 *
 * Tests the complete flow of the frontend calling the backend API
 * Run with: npm test -- --testPathPattern=integration.test.js --watchAll=false
 *
 * NOTE: These tests require the backend to be running on port 5000
 * Use 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows
 */

const API_BASE_URL = "http://127.0.0.1:5000";

describe("Frontend to Backend Integration Tests", () => {
  // Test backend connectivity
  describe("Backend Connectivity", () => {
    test("should connect to backend health endpoint", async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe("healthy");
    });

    test("should connect to backend root endpoint", async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.message).toContain("Praelocate");
    });
  });

  // Test submitting two locations
  describe("Submit Two Locations", () => {
    test("should successfully submit two valid locations and get midpoint", async () => {
      const locations = [
        { address: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
        { address: "Johannesburg, South Africa", lat: -26.2041, lng: 28.0473 },
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty("midpoint");
      expect(data.midpoint).toHaveProperty("lat");
      expect(data.midpoint).toHaveProperty("lng");

      // Verify midpoint is between the two locations
      expect(data.midpoint.lat).toBeGreaterThan(-34); // South of Cape Town
      expect(data.midpoint.lat).toBeLessThan(-26); // North of Johannesburg
      expect(data.midpoint.lng).toBeGreaterThan(18); // East of Cape Town
      expect(data.midpoint.lng).toBeLessThan(29); // West of Johannesburg

      // Verify we have location count
      expect(data).toHaveProperty("location_count");
      expect(data.location_count).toBe(2);
    });

    test("should successfully submit three locations", async () => {
      const locations = [
        { address: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
        { address: "Johannesburg, South Africa", lat: -26.2041, lng: 28.0473 },
        { address: "Durban, South Africa", lat: -29.8587, lng: 31.0218 },
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.location_count).toBe(3);
      expect(data.midpoint).toBeDefined();
    });

    test("should reject submission with only one location", async () => {
      const locations = [
        { address: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      // Should return an error status
      expect(response.ok).toBe(false);
      expect([400, 422, 500]).toContain(response.status);
    });

    test("should reject submission with empty locations array", async () => {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations: [] }),
      });

      expect(response.ok).toBe(false);
    });

    test("should reject submission without locations field", async () => {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.ok).toBe(false);
    });
  });

  // Test location validation
  describe("Location Validation", () => {
    test("should reject location with invalid latitude", async () => {
      const locations = [
        { address: "Valid", lat: -33.9249, lng: 18.4241 },
        { address: "Invalid", lat: 100, lng: 28.0473 }, // Invalid: lat > 90
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      expect(response.ok).toBe(false);
    });

    test("should reject location with invalid longitude", async () => {
      const locations = [
        { address: "Valid", lat: -33.9249, lng: 18.4241 },
        { address: "Invalid", lat: -26.2041, lng: 200 }, // Invalid: lng > 180
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      expect(response.ok).toBe(false);
    });

    test("should reject location missing required fields", async () => {
      const locations = [
        { address: "Valid", lat: -33.9249, lng: 18.4241 },
        { address: "Missing coords" }, // Missing lat/lng
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      expect(response.ok).toBe(false);
    });
  });

  // Test midpoint calculation accuracy
  describe("Midpoint Calculation", () => {
    test("should calculate correct midpoint for two symmetric locations", async () => {
      // Two locations at same latitude, different longitudes
      const locations = [
        { address: "West", lat: 0, lng: 10 },
        { address: "East", lat: 0, lng: 20 },
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      // Midpoint should be at lng 15 (halfway between 10 and 20)
      expect(data.midpoint.lat).toBeCloseTo(0, 1);
      expect(data.midpoint.lng).toBeCloseTo(15, 1);
    });

    test("should calculate midpoint for locations in different hemispheres", async () => {
      const locations = [
        { address: "Northern", lat: 40.7128, lng: -74.006 }, // New York
        { address: "Southern", lat: -33.8688, lng: 151.2093 }, // Sydney
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.midpoint).toBeDefined();
      expect(typeof data.midpoint.lat).toBe("number");
      expect(typeof data.midpoint.lng).toBe("number");
    });
  });

  // Test response structure and data types
  describe("Response Structure", () => {
    test("should return properly structured response with all fields", async () => {
      const locations = [
        { address: "Cape Town", lat: -33.9249, lng: 18.4241 },
        { address: "Johannesburg", lat: -26.2041, lng: 28.0473 },
      ];

      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      const data = await response.json();

      // Check all expected fields exist
      expect(data).toHaveProperty("midpoint");
      expect(data).toHaveProperty("location_count");

      // Check data types
      expect(typeof data.midpoint.lat).toBe("number");
      expect(typeof data.midpoint.lng).toBe("number");
      expect(typeof data.location_count).toBe("number");

      // Coordinates should be valid
      expect(data.midpoint.lat).toBeGreaterThanOrEqual(-90);
      expect(data.midpoint.lat).toBeLessThanOrEqual(90);
      expect(data.midpoint.lng).toBeGreaterThanOrEqual(-180);
      expect(data.midpoint.lng).toBeLessThanOrEqual(180);
    });

    test("should return JSON content type", async () => {
      const response = await fetch(`${API_BASE_URL}/health`);

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });
  });

  // Test CORS headers (frontend calling backend from different origin)
  describe("CORS Support", () => {
    test("should allow cross-origin requests", async () => {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(response.ok).toBe(true);
    });

    test("should handle OPTIONS preflight request", async () => {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      // Should not error out
      expect(response.status).toBeLessThan(500);
    });
  });
});

// Custom test runner for standalone execution
if (typeof window === "undefined" && require.main === module) {
  console.log("Running integration tests...");
  console.log("Make sure backend is running on http://localhost:5000");
}

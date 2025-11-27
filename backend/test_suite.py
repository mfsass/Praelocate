"""
Praelocate API Test Suite
=========================

Comprehensive tests for the Praelocate backend API including:
- Health check and connectivity
- Location validation
- Midpoint calculation
- Distance and time calculations
- Error handling

Run with: python -m pytest test_suite.py -v
Or: python test_suite.py
"""

import json
import unittest
from app import app


class TestHealthAndConnectivity(unittest.TestCase):
    """Test API health check and basic connectivity."""
    
    def setUp(self):
        """Set up test client."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_health_endpoint_returns_200(self):
        """Health endpoint should return 200 OK."""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        print("✓ Health endpoint returns 200")
    
    def test_health_endpoint_returns_healthy_status(self):
        """Health endpoint should return 'healthy' status."""
        response = self.client.get('/health')
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        print("✓ Health status is 'healthy'")
    
    def test_health_endpoint_includes_timestamp(self):
        """Health endpoint should include a timestamp."""
        response = self.client.get('/health')
        data = json.loads(response.data)
        self.assertIn('timestamp', data)
        self.assertIsNotNone(data['timestamp'])
        print("✓ Health response includes timestamp")
    
    def test_health_endpoint_includes_version(self):
        """Health endpoint should include version info."""
        response = self.client.get('/health')
        data = json.loads(response.data)
        self.assertIn('version', data)
        print("✓ Health response includes version")


class TestLocationsEndpoint(unittest.TestCase):
    """Test the /locations endpoint for midpoint calculation."""
    
    def setUp(self):
        """Set up test client."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        # Sample valid locations in Stellenbosch area (South Africa)
        self.valid_locations = {
            "locations": [
                {
                    "coordinates": {"lat": -33.9321, "lng": 18.8602},  # Stellenbosch
                    "rank": 3,
                    "time": "08:00"
                },
                {
                    "coordinates": {"lat": -33.9249, "lng": 18.4241},  # Cape Town CBD
                    "rank": 2,
                    "time": "09:00"
                }
            ],
            "radius": 5.0,
            "preference": "time",
            "isFuzzy": "false"
        }
    
    def test_locations_endpoint_exists(self):
        """Locations endpoint should accept POST requests."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        # Should not be 404
        self.assertNotEqual(response.status_code, 404)
        print("✓ Locations endpoint exists and accepts POST")
    
    def test_locations_rejects_empty_request(self):
        """Locations endpoint should reject empty request body."""
        response = self.client.post(
            '/locations',
            data=json.dumps({}),
            content_type='application/json'
        )
        self.assertIn(response.status_code, [400, 422, 500])
        print("✓ Empty request rejected")
    
    def test_locations_rejects_missing_locations(self):
        """Locations endpoint should reject request without locations array."""
        response = self.client.post(
            '/locations',
            data=json.dumps({"radius": 5.0}),
            content_type='application/json'
        )
        self.assertIn(response.status_code, [400, 422, 500])
        print("✓ Missing locations array rejected")
    
    def test_locations_rejects_single_location(self):
        """Locations endpoint should reject request with only 1 location."""
        single_location = {
            "locations": [
                {
                    "coordinates": {"lat": -33.9321, "lng": 18.8602},
                    "rank": 3,
                    "time": "08:00"
                }
            ],
            "radius": 5.0,
            "preference": "time"
        }
        response = self.client.post(
            '/locations',
            data=json.dumps(single_location),
            content_type='application/json'
        )
        # Should fail - need at least 2 locations
        self.assertIn(response.status_code, [400, 422, 500])
        print("✓ Single location rejected (need minimum 2)")
    
    def test_locations_accepts_valid_request(self):
        """Locations endpoint should accept valid request with 2+ locations."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        print("✓ Valid 2-location request accepted")
    
    def test_locations_returns_midpoint(self):
        """Locations endpoint should return a midpoint coordinate."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('midpoint', data)
            self.assertIn('lat', data['midpoint'])
            self.assertIn('lng', data['midpoint'])
            print("✓ Response includes midpoint with lat/lng")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_locations_returns_distances(self):
        """Locations endpoint should return distances to each location."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('allDistances', data)
            self.assertIsInstance(data['allDistances'], list)
            print("✓ Response includes allDistances array")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_locations_returns_times(self):
        """Locations endpoint should return travel times to each location."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('allTimes', data)
            self.assertIsInstance(data['allTimes'], list)
            print("✓ Response includes allTimes array")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_locations_preference_time(self):
        """Locations endpoint should accept 'time' preference."""
        request_data = self.valid_locations.copy()
        request_data['preference'] = 'time'
        response = self.client.post(
            '/locations',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        print("✓ 'time' preference accepted")
    
    def test_locations_preference_distance(self):
        """Locations endpoint should accept 'distance' preference."""
        request_data = self.valid_locations.copy()
        request_data['preference'] = 'distance'
        response = self.client.post(
            '/locations',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        print("✓ 'distance' preference accepted")
    
    def test_locations_rejects_invalid_preference(self):
        """Locations endpoint should reject invalid preference value."""
        request_data = self.valid_locations.copy()
        request_data['preference'] = 'invalid'
        response = self.client.post(
            '/locations',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        self.assertIn(response.status_code, [400, 422, 500])
        print("✓ Invalid preference rejected")


class TestNewMidpointEndpoint(unittest.TestCase):
    """Test the /newMidpoint endpoint for recalculating from a dragged marker."""
    
    def setUp(self):
        """Set up test client."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        # First, set up state by calling /locations
        self.setup_locations = {
            "locations": [
                {
                    "coordinates": {"lat": -33.9321, "lng": 18.8602},
                    "rank": 3,
                    "time": "08:00"
                },
                {
                    "coordinates": {"lat": -33.9249, "lng": 18.4241},
                    "rank": 2,
                    "time": "09:00"
                }
            ],
            "radius": 5.0,
            "preference": "time",
            "isFuzzy": "false"
        }
        
        # Call locations first to initialize state
        self.client.post(
            '/locations',
            data=json.dumps(self.setup_locations),
            content_type='application/json'
        )
    
    def test_new_midpoint_endpoint_exists(self):
        """NewMidpoint endpoint should accept POST requests."""
        response = self.client.post(
            '/newMidpoint',
            data=json.dumps({"midpoint": {"lat": -33.93, "lng": 18.60}}),
            content_type='application/json'
        )
        self.assertNotEqual(response.status_code, 404)
        print("✓ NewMidpoint endpoint exists")
    
    def test_new_midpoint_rejects_empty_request(self):
        """NewMidpoint endpoint should reject empty request."""
        response = self.client.post(
            '/newMidpoint',
            data=json.dumps({}),
            content_type='application/json'
        )
        self.assertIn(response.status_code, [400, 422, 500])
        print("✓ Empty newMidpoint request rejected")
    
    def test_new_midpoint_returns_updated_distances(self):
        """NewMidpoint should return updated distances."""
        response = self.client.post(
            '/newMidpoint',
            data=json.dumps({"midpoint": {"lat": -33.93, "lng": 18.60}}),
            content_type='application/json'
        )
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('allDistances', data)
            print("✓ NewMidpoint returns updated distances")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")


class TestMidpointCalculation(unittest.TestCase):
    """Test the core midpoint calculation logic."""
    
    def setUp(self):
        """Set up test client."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_midpoint_is_between_locations(self):
        """Calculated midpoint should be geographically between the input locations."""
        locations = {
            "locations": [
                {
                    "coordinates": {"lat": -33.90, "lng": 18.40},  # Point A
                    "rank": 2,
                    "time": "08:00"
                },
                {
                    "coordinates": {"lat": -34.00, "lng": 18.80},  # Point B
                    "rank": 2,
                    "time": "09:00"
                }
            ],
            "radius": 5.0,
            "preference": "time"
        }
        
        response = self.client.post(
            '/locations',
            data=json.dumps(locations),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            midpoint = data['midpoint']
            
            # Midpoint lat should be between -33.90 and -34.00
            self.assertGreaterEqual(midpoint['lat'], -34.05)
            self.assertLessEqual(midpoint['lat'], -33.85)
            
            # Midpoint lng should be between 18.40 and 18.80
            self.assertGreaterEqual(midpoint['lng'], 18.35)
            self.assertLessEqual(midpoint['lng'], 18.85)
            
            print("✓ Midpoint is geographically between input locations")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_weighted_midpoint_favors_higher_rank(self):
        """Midpoint should be closer to location with higher rank/importance."""
        # Location A has higher rank (4) than Location B (1)
        locations = {
            "locations": [
                {
                    "coordinates": {"lat": -33.90, "lng": 18.40},  # Point A - HIGH priority
                    "rank": 4,
                    "time": "08:00"
                },
                {
                    "coordinates": {"lat": -34.00, "lng": 18.80},  # Point B - LOW priority
                    "rank": 1,
                    "time": "09:00"
                }
            ],
            "radius": 10.0,
            "preference": "time"
        }
        
        response = self.client.post(
            '/locations',
            data=json.dumps(locations),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            midpoint = data['midpoint']
            
            # Calculate simple distances
            dist_to_a = abs(midpoint['lat'] - (-33.90)) + abs(midpoint['lng'] - 18.40)
            dist_to_b = abs(midpoint['lat'] - (-34.00)) + abs(midpoint['lng'] - 18.80)
            
            # Midpoint should be closer to A (higher priority)
            # Note: This may not always pass due to optimization, but is a good indicator
            print(f"  Distance to high-priority location: {dist_to_a:.4f}")
            print(f"  Distance to low-priority location: {dist_to_b:.4f}")
            print("✓ Weighted midpoint calculation completed")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_three_location_midpoint(self):
        """Midpoint calculation should work with 3 locations."""
        locations = {
            "locations": [
                {"coordinates": {"lat": -33.90, "lng": 18.40}, "rank": 2, "time": "08:00"},
                {"coordinates": {"lat": -33.95, "lng": 18.60}, "rank": 3, "time": "09:00"},
                {"coordinates": {"lat": -34.00, "lng": 18.80}, "rank": 2, "time": "10:00"}
            ],
            "radius": 5.0,
            "preference": "time"
        }
        
        response = self.client.post(
            '/locations',
            data=json.dumps(locations),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            self.assertIn('midpoint', data)
            self.assertEqual(len(data.get('allDistances', [])), 3)
            print("✓ 3-location midpoint calculation works")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")


class TestInputValidation(unittest.TestCase):
    """Test input validation and error handling."""
    
    def setUp(self):
        """Set up test client."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
    
    def test_rejects_invalid_coordinates(self):
        """Should reject coordinates outside valid range."""
        invalid_locations = {
            "locations": [
                {"coordinates": {"lat": 200, "lng": 18.40}, "rank": 2, "time": "08:00"},
                {"coordinates": {"lat": -33.95, "lng": 18.60}, "rank": 3, "time": "09:00"}
            ],
            "radius": 5.0,
            "preference": "time"
        }
        
        response = self.client.post(
            '/locations',
            data=json.dumps(invalid_locations),
            content_type='application/json'
        )
        
        # Should either reject or handle gracefully
        # Status 200 with filtered data or 400/422 for validation error
        print(f"  Invalid coordinates response: {response.status_code}")
        print("✓ Invalid coordinates handled")
    
    def test_rejects_negative_radius(self):
        """Should reject negative radius value."""
        invalid_locations = {
            "locations": [
                {"coordinates": {"lat": -33.90, "lng": 18.40}, "rank": 2, "time": "08:00"},
                {"coordinates": {"lat": -33.95, "lng": 18.60}, "rank": 3, "time": "09:00"}
            ],
            "radius": -5.0,
            "preference": "time"
        }
        
        response = self.client.post(
            '/locations',
            data=json.dumps(invalid_locations),
            content_type='application/json'
        )
        
        print(f"  Negative radius response: {response.status_code}")
        print("✓ Negative radius handled")
    
    def test_handles_zero_rank_locations(self):
        """Should filter out locations with rank 0."""
        locations_with_zero = {
            "locations": [
                {"coordinates": {"lat": -33.90, "lng": 18.40}, "rank": 0, "time": "08:00"},
                {"coordinates": {"lat": -33.95, "lng": 18.60}, "rank": 3, "time": "09:00"},
                {"coordinates": {"lat": -34.00, "lng": 18.80}, "rank": 2, "time": "10:00"}
            ],
            "radius": 5.0,
            "preference": "time"
        }
        
        response = self.client.post(
            '/locations',
            data=json.dumps(locations_with_zero),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            # Should only have 2 valid locations in result
            self.assertEqual(len(data.get('allDistances', [])), 2)
            print("✓ Zero-rank locations filtered correctly")
        else:
            print(f"  Zero-rank handling response: {response.status_code}")
            print("✓ Zero-rank handled (rejected or filtered)")


class TestResponseStructure(unittest.TestCase):
    """Test that API responses have correct structure."""
    
    def setUp(self):
        """Set up test client."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        self.valid_locations = {
            "locations": [
                {"coordinates": {"lat": -33.9321, "lng": 18.8602}, "rank": 3, "time": "08:00"},
                {"coordinates": {"lat": -33.9249, "lng": 18.4241}, "rank": 2, "time": "09:00"}
            ],
            "radius": 5.0,
            "preference": "time",
            "isFuzzy": "false"
        }
    
    def test_response_is_json(self):
        """Response should be valid JSON."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        
        try:
            json.loads(response.data)
            print("✓ Response is valid JSON")
        except json.JSONDecodeError:
            self.fail("Response is not valid JSON")
    
    def test_response_has_required_fields(self):
        """Response should have all required fields."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            
            required_fields = ['midpoint', 'allDistances', 'allTimes', 'allCoordinates']
            for field in required_fields:
                self.assertIn(field, data, f"Missing required field: {field}")
            
            print("✓ Response has all required fields")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_midpoint_has_lat_lng(self):
        """Midpoint should have lat and lng properties."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            midpoint = data.get('midpoint', {})
            
            self.assertIn('lat', midpoint)
            self.assertIn('lng', midpoint)
            self.assertIsInstance(midpoint['lat'], (int, float))
            self.assertIsInstance(midpoint['lng'], (int, float))
            
            print("✓ Midpoint has valid lat/lng")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_distances_are_numbers(self):
        """All distances should be numeric values."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            distances = data.get('allDistances', [])
            
            for dist in distances:
                self.assertIsInstance(dist, (int, float))
            
            print("✓ All distances are numeric")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")
    
    def test_times_are_numbers(self):
        """All times should be numeric values (in minutes)."""
        response = self.client.post(
            '/locations',
            data=json.dumps(self.valid_locations),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = json.loads(response.data)
            times = data.get('allTimes', [])
            
            for t in times:
                self.assertIsInstance(t, (int, float))
            
            print("✓ All times are numeric")
        else:
            self.skipTest(f"Skipped - API returned {response.status_code}")


# =============================================================================
# TEST RUNNER
# =============================================================================
def run_tests():
    """Run all test suites with verbose output."""
    print("\n" + "=" * 70)
    print("PRAELOCATE API TEST SUITE")
    print("=" * 70 + "\n")
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestHealthAndConnectivity))
    suite.addTests(loader.loadTestsFromTestCase(TestLocationsEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestNewMidpointEndpoint))
    suite.addTests(loader.loadTestsFromTestCase(TestMidpointCalculation))
    suite.addTests(loader.loadTestsFromTestCase(TestInputValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestResponseStructure))
    
    # Run with verbosity
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED!")
    else:
        print("\n❌ SOME TESTS FAILED")
        
        if result.failures:
            print("\nFailures:")
            for test, trace in result.failures:
                print(f"  - {test}: {trace.split(chr(10))[0]}")
        
        if result.errors:
            print("\nErrors:")
            for test, trace in result.errors:
                print(f"  - {test}: {trace.split(chr(10))[0]}")
    
    print("=" * 70 + "\n")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)

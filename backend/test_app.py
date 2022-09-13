import unittest
import app


class TestApp(unittest.TestCase):
    def test_calculate_midpoint(self):
        loc1 = {"lat": -33.9456, "lng": 18.8842}
        loc2 = {"lat": -33.99787, "lng": 18.8675}
        loc3 = {"lat": -33.9123, "lng": 18.8301}

        result_list = app.calculate_midpoint(loc1, loc2, loc3)
        result_all_coordinates = result_list["allCoordinates"]
        result_midpoint = result_all_coordinates["midpoint"]

        check_midpoint_lat = (loc1["lat"] + loc2["lat"] + loc3["lat"]) / 3
        check_midpoint_lng = (loc1["lng"] + loc2["lng"] + loc3["lng"]) / 3
        check_midpoint = {
            "lat": (check_midpoint_lat),
            "lng": (check_midpoint_lng),
        }
        print(f"CheckMidpoint: {check_midpoint['lat']}, {check_midpoint['lng']}")
        self.assertAlmostEqual(result_midpoint["lat"], check_midpoint["lat"])
        self.assertAlmostEqual(result_midpoint["lng"], check_midpoint["lng"])
        self.assertAlmostEqual(
            (
                app.calculate_midpoint(
                    {"lat": -33.9456, "lng": 18.8842},
                    {"lat": -33.9456, "lng": 18.8842},
                    {"lat": -33.9456, "lng": 18.8842},
                )["distance"]
            ),
            0.0,
        )


if __name__ == "__main__":
    unittest.main()

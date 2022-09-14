import unittest
import app


class TestApp(unittest.TestCase):
    def test_calculate_midpoint(self):
        # latitudes, longitudes, and ranks
        loc = [
            (-33.9340673, 18.8661883, 2.0),
            (-33.9326571, 18.8653934, 3.0),
            (-33.9354089, 18.8600011, 4.0),
            (-33.9340673, 18.8661883, 2.0),
            (-33.9326571, 18.8653934, 3.0),
            (-33.9340673, 18.8661883, 2.0),
            (-33.9326571, 18.8653934, 3.0),
        ]

        result_list = app.calculate_midpoint(loc)
        result_midpoint = result_list["midpoint"]

        check_midpoint_lat = (
            loc[0][0]
            + loc[1][0]
            + loc[2][0]
            + loc[3][0]
            + loc[4][0]
            + loc[5][0]
            + loc[6][0]
        ) / (len(loc))
        check_midpoint_lng = (
            loc[0][1]
            + loc[1][1]
            + loc[2][1]
            + loc[3][1]
            + loc[4][1]
            + loc[5][1]
            + loc[6][1]
        ) / (len(loc))
        check_midpoint = {
            "lat": (check_midpoint_lat),
            "lng": (check_midpoint_lng),
        }
        print(f"CheckMidpoint: {check_midpoint['lat']}, {check_midpoint['lng']}")
        self.assertAlmostEqual(result_midpoint["lat"], check_midpoint["lat"])
        self.assertAlmostEqual(result_midpoint["lng"], check_midpoint["lng"])


if __name__ == "__main__":
    unittest.main()

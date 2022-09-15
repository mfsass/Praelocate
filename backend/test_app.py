import unittest
import app


class TestApp(unittest.TestCase):
    def test_calculate_midpoint(self):
        # latitudes, longitudes, and ranks
        data = [
            (-33.9180673, 18.8561883, 1.0, "20:30"),
            (-33.9326571, 18.8653934, 3.0, "20:30"),
            (-33.9354089, 18.8600011, 4.0, "08:30"),
            (-33.9340673, 18.8661883, 2.0, "16:30"),
            (-33.9356571, 18.8653934, 3.0, "11:30"),
            (-33.924454, 18.821924, 2.0, "15:30"),
            (-33.965704, 18.474756, 3.0, "16:30"),
        ]

        app.radius = 1
        # initialize all app.locations global variables
        app.all_ranks = []
        app.coordinates = []
        app.times = []
        app.optimize_preference = "distance"  # otherwise varies with traffic times
        coord = []
        app.midpoint = {}

        for i in range(0, len(data)):
            app.all_ranks.append(data[i][2])  # ranks
            app.coordinates.append((data[i][0], data[i][1]))  # coordinates
            coord.append((data[i][0], data[i][1]))  # coordinates
            app.times.append((data[i][3]))
        # call the function
        result = app.calculate_midpoint(data)

        # check the results
        # output =
        # Details: Avg distance, Avg time, All distances, All times, Avg time weighted, Origin
        # [10.3, 14.48, [5.45, 4.89, 4.15, 4.7, 4.57, 3.45, 44.92], [9.25, 9.38, 10.42, 11.93, 10.8, 7.22, 42.37], 14.01, (-33.93614919347826, 18.830927215591863)]

        # check the midpoint
        self.assertEqual(
            result["midpoint"], {"lat": -33.927165847678154, "lng": 18.79844399347826}
        )
        self.assertEqual(result["avgDistance"], 13.37)
        self.assertEqual(
            result["allDistances"], [9.6, 9.04, 8.3, 8.84, 8.71, 4.32, 44.81]
        )


if __name__ == "__main__":
    unittest.main()

import { React, useState } from "react";
import LocationBox from "./LocationBox";

import "./locations.css";

function Locations() {
  const [location1, setLocation1] = useState("");
  const [location2, setLocation2] = useState("");
  const [location3, setLocation3] = useState("");

  const handleSubmit = (e) => {
    // location1.latitude = -33.93087933494542; -> eendrag
    // location1.longitude = 18.872240042486016;
    // location2.latitude = -33.93253245739606; -> neelsie
    // location2.longitude = 18.86538266947165;
    e.preventDefault();
    const requestOpt = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location1: location1,
        location2: location2,
        location3: location3,
      }),
    };
    async function fetchFunc() {
      return await fetch("/locations", requestOpt)
        .then((response) => response.json())
        .catch((error) => console.log(error));
    }
    (async () => {
      let info = await fetchFunc();
      alert(JSON.stringify(info));
    })();
  };

  return (
    <form className="locationForm" onSubmit={handleSubmit}>
      <LocationBox label="First location" passLocation={setLocation1} />
      <LocationBox label="Second location" passLocation={setLocation2} />
      <LocationBox label="Third location" passLocation={setLocation3} />
      <button className="location button" type="submit">
        Submit
      </button>
    </form>
  );
}

export default Locations;

import { React, useState } from "react";
import LocationBox from "./LocationBox";

function Locations() {
  let location1 = { latitude: "", longitude: "" };
  let location2 = { latitude: "", longitude: "" };
  // let location3 = { latitude: "", longitude: "" };
  const [childData, setChildData] = useState("");

  // const newHandleChange = (location) => {
  //   setLocation3(location);
  // };

  const handleChange = (event, location, isLatitude) => {
    if (isLatitude) {
      location.latitude = event.target.value;
    } else location.longitude = event.target.value;
    console.log(`${location}: `, location);
  };

  const handleSubmit = (e) => {
    // location1.latitude = -33.93087933494542; -> eendrag
    // location1.longitude = 18.872240042486016;
    // location2.latitude = -33.93253245739606; -> neelsie
    // location2.longitude = 18.86538266947165;
    console.log(childData);
    e.preventDefault();
    const requestOpt = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location1: location1,
        location2: location2,
        // location3: location3,
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
    <form onSubmit={handleSubmit}>
      <div className="location container">
        <label>First location</label>
        <div className="location input">
          <input
            name="loc1lat"
            type="text"
            onChange={(event) => handleChange(event, location1, true)}
            placeholder="latitude"
            autoComplete="off"
          />
          <input
            name="loc1lon"
            type="text"
            onChange={(event) => handleChange(event, location1, false)}
            placeholder="longitude"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="location container">
        <label>Second location</label>
        <div className="location input">
          <input
            name="loc2lat"
            type="text"
            onChange={(event) => handleChange(event, location2, true)}
            placeholder="latitude"
            autoComplete="off"
          />
          <input
            name="loc2lon"
            type="text"
            onChange={(event) => handleChange(event, location2, false)}
            placeholder="longitude"
            autoComplete="off"
          />
        </div>
      </div>
      <LocationBox
        label="Third location"
        passChildData={setChildData}
      ></LocationBox>
      <button className="location button" type="submit">
        Submit
      </button>
    </form>
  );
}

export default Locations;

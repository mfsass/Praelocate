import { React, useState } from "react";

function LocationBox(props) {
  // eslint-disable-next-line
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleChange = (event, isLatitude) => {
    if (isLatitude) {
      setLatitude(event.target.value);
    } else {
      setLongitude(event.target.value);
    }
    setLocation({ latitude: latitude, longitude: longitude });
    props.passChildData(location);
  };

  return (
    <div className="location container">
      <label>{props.label}</label>
      <div className="location input">
        <input
          name="loc1lat"
          type="text"
          onChange={(event) => handleChange(event, true)}
          placeholder="latitude"
          autoComplete="off"
        />
        <input
          name="loc1lon"
          type="text"
          onChange={(event) => handleChange(event, false)}
          placeholder="longitude"
          autoComplete="off"
        />
      </div>
    </div>
  );
}

export default LocationBox;

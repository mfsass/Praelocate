import { React, useState } from "react";

import "./locationBox.css";

function LocationBox(props) {
  const [location, setLocation] = useState({
    latitude: "",
    longitude: "",
  });

  const handleChange = (event) => {
    event.target.style["background-color"] = "green";
    console.log("passing to parent");
    props.passLocation(location);
  };

  return (
    <div className="container">
      <label>{props.label}</label>
      <div className="inputWrapper">
        <input
          type="text"
          placeholder="eg: -34.067 (latitude)"
          autoComplete="off"
          onInput={(e) =>
            setLocation((previousState) => {
              return { ...previousState, latitude: e.target.value };
            })
          }
        />
        <input
          type="text"
          placeholder="eg: 18.85 (longitude)"
          autoComplete="off"
          onInput={(e) =>
            setLocation((previousState) => {
              return { ...previousState, longitude: e.target.value };
            })
          }
        />
        <button className="button" type="button" onClick={handleChange}>
          Accept values
        </button>
      </div>
    </div>
  );
}

export default LocationBox;

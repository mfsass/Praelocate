import { React } from "react";
import { StandaloneSearchBox } from "@react-google-maps/api";

import "./locationBox.css";

function LocationBox(props) {
  // const [location1, setLocation1] = useState({
  //   latitude: "",
  //   longitude: "",
  // });

  // const handleChange = (event) => {
  //   event.target.style["background-color"] = "green";
  //   console.log("passing to parent");
  //   props.passLocation(location1);
  // };

  return (
    <div className="box">
      <label>{props.label}</label>
      <StandaloneSearchBox>
        <input
          ref={props.locationStr}
          type="text"
          placeholder={props.placeholder}
          style={props.inputStyle}
        ></input>
      </StandaloneSearchBox>
      <button className="box button" type="button" onClick={props.handleChange}>
        Apply
      </button>
    </div>
  );
}

export default LocationBox;

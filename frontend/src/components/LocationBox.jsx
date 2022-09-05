import { React } from "react";
import { StandaloneSearchBox } from "@react-google-maps/api";

import "./locationBox.css";
import { forwardRef } from "react";

const LocationBox = forwardRef((props, ref) => {
  return (
    <div className="box" onClick={() => console.log("clicked")}>
      <label>{props.label}</label>
      <StandaloneSearchBox>
        <input
          ref={ref}
          type="text"
          placeholder={props.placeholder}
          style={props.inputStyle}
        ></input>
      </StandaloneSearchBox>
    </div>
  );
});

export default LocationBox;

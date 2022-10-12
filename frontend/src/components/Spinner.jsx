import React from "react";
import spinnericon from "./site-spinner.png";

import "./spinner.css";

function Spinner(props) {
  return (
    <>
      {props.type === "spinner" && (
        <img className="spinner" src={spinnericon} alt="spinner" />
      )}
      {props.type === "balls" && (
        <div className="loading">
          <div></div>
          <div></div>
          <div></div>
        </div>
      )}
    </>
  );
}

export default Spinner;

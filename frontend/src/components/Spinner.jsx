import React from "react";
import PropTypes from "prop-types";
import spinnericon from "./site-spinner.png";

import "./spinner.css";

// TODO: Refactor to use object destructuring for props
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

Spinner.propTypes = {
  type: PropTypes.oneOf(["spinner", "balls"]).isRequired,
};

export default Spinner;

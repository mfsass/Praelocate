import React from "react";

import "./testComponent.css";

const test_props = {
  label: "Work (WIP)",
};

function TestComponent() {
  return (
    <div className="box work">
      <label className="mainLabel">{test_props.label}</label>
      <input name="check" type="checkbox" readOnly />
      <div className="inputWrapper">
        <input type="text" placeholder="enter your search here" />
        <div className="bars">
          <input type="radio" name="bars" value="4" />
          <input type="radio" name="bars" value="3" />
          <input type="radio" name="bars" value="2" />
          <input type="radio" name="bars" value="1" />
        </div>
      </div>
    </div>
  );
}

export default TestComponent;

import React, { useState, forwardRef } from "react";
import { StandaloneSearchBox } from "@react-google-maps/api";

import "./testComponent.css";

const TestComponent = forwardRef((props, ref) => {
  const [shouldShow, setShouldShow] = useState(false);

  return (
    <div className="box work">
      <div className="input label">
        <label className="mainLabel">{props.label}</label>
        <input
          name="check"
          type="checkbox"
          readOnly
          onClick={() => setShouldShow(!shouldShow)}
        />
      </div>
      {shouldShow && (
        <div className="inputWrapper">
          <StandaloneSearchBox>
            <input
              ref={ref}
              type="text"
              placeholder={props.placeholder}
            ></input>
          </StandaloneSearchBox>
          <div className="bars">
            <input
              type="radio"
              name={"bars " + props.name}
              value="4"
              onClick={() => props.getRank(4, props.name)}
            />
            <input
              type="radio"
              name={"bars " + props.name}
              value="3"
              onClick={() => props.getRank(3, props.name)}
            />
            <input
              type="radio"
              name={"bars " + props.name}
              value="2"
              onClick={() => props.getRank(2, props.name)}
            />
            <input
              type="radio"
              name={"bars " + props.name}
              value="1"
              onClick={() => props.getRank(1, props.name)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default TestComponent;

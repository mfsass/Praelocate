import React from "react";
import { forwardRef } from "react";
import { useEffect } from "react";

const InputTest = forwardRef((props, ref) => {
  return (
    <>
      <label>Input here</label>
      <input type="text" ref={ref} />
    </>
  );
});

export default InputTest;

import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const getPlayerId = () =>
  new URLSearchParams(window.location.search).get("playerID") || "0";

ReactDOM.render(
  <React.StrictMode>
    {/* <App playerID={getPlayerId()} /> */}
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";  // 👈 this is critical
import 'katex/dist/katex.min.css'; // Import KaTeX CSS for math rendering

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline. Registered after load so it never competes with the first paint,
// and only in production because a service worker in front of the dev server
// serves stale modules and wastes an afternoon.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {
        // Offline is a bonus, not a requirement. A browser that refuses the
        // registration still gets the whole product.
      });
  });
}

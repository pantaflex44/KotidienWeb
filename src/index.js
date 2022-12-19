import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import "../tools";

import App from "./components/App";

const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, <App />);
} else {
    const root = createRoot(rootElement);
    root.render(<App />);
}

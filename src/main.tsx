import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppV1 from "./v1/App.tsx";
import AppV2 from "./v2/App.tsx";
import AppV3 from "./v3/App.tsx";
import AppV4 from "./v4/App.tsx";
import AppV5 from "./v5/App.tsx";
import { UISwitcher } from "./UISwitcher.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UISwitcher
      versions={{
        v1: () => <AppV1 />,
        // Initial
        // - Animate open and closed
        // - Can handle different sized content

        v2: () => <AppV2 />,
        // Basic draggable

        v3: () => <AppV3 />,
        // Draggable (with constraints)
        // - Can't be dragged too far up
        // - If dragged downwards, it will close
        // - Improved mounting and unmounting animation

        v4: () => <AppV4 />,
        // v4: Draggable with snap points

        v5: () => <AppV5 />,
        // The details
        // - Background scale
        // - Drag handle
        // - Drag intention refinements
        // - Elastic drag limits
      }}
      defaultVersion="v5"
      props={{}}
    />
  </StrictMode>
);

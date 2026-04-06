import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { ThemeProvider } from "./context/ThemeProvider";
import { AppWrapper } from "./components/admin_component/common/PageMeta.tsx";
import { UserProvider } from "./context/UserProvider";
import { CartProvider } from "./context/CartContext";

// simple-peer pulls in browser shims that still expect a Node-style global.
const browserGlobal = globalThis as typeof globalThis & {
  global?: typeof globalThis;
};

if (typeof browserGlobal.global === "undefined") {
  browserGlobal.global = globalThis;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <CartProvider>
        <ThemeProvider>
          <AppWrapper>
            <App />
          </AppWrapper>
        </ThemeProvider>
      </CartProvider>
    </UserProvider>
  </StrictMode>,
);

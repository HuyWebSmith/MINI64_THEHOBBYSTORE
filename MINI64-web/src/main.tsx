import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.tsx";

import { ThemeProvider } from "./context/ThemeProvider";
import { AppWrapper } from "./components/admin_component/common/PageMeta.tsx";
import { UserProvider } from "./context/UserProvider";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

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
      <WishlistProvider>
        <CartProvider>
          <ThemeProvider>
            <AppWrapper>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4500,
                  style: {
                    borderRadius: "16px",
                    background: "#111827",
                    color: "#fff",
                  },
                }}
              />
            </AppWrapper>
          </ThemeProvider>
        </CartProvider>
      </WishlistProvider>
    </UserProvider>
  </StrictMode>,
);

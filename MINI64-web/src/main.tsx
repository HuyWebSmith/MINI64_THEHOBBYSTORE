import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { ThemeProvider } from "./context/ThemeProvider";
import { AppWrapper } from "./components/admin_component/common/PageMeta.tsx";
import { UserProvider } from "./context/UserProvider";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <ThemeProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
      </ThemeProvider>
    </UserProvider>
  </StrictMode>,
);

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import các trang
import Home from "./layouts/Home";
import Login from "./pages/SignInPage";
import SignUp from "./pages/SignUpPage";

// Import các thành phần dùng chung
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<SignUp />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;

import { useState } from "react";

import "./App.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Category from "./components/Category";
import Types from "./components/Types";
import Services from "./components/Services";
import ProductsGrid from "./components/ProductsGrid";
import Banner from "./components/Banner";
import Reviews from "./components/Reviews";
import Insta from "./components/Insta";
import Footer from "./components/Footer";

function App() {
  useState(0);

  return (
    <>
      <Header />
      <Hero />
      <Category />
      <Types />
      <Services />
      <ProductsGrid />
      <Banner />
      <Reviews />
      <Insta />
      <Footer />
    </>
  );
}

export default App;

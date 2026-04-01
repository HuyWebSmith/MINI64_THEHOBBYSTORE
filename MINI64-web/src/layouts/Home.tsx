import { useState } from "react";
import Hero from "../components/Hero";
import Category from "../components/Category";
import Types from "../components/Types";
import Services from "../components/Services";
import ProductsGrid from "../components/ProductsGrid";
import Banner from "../components/Banner";
import Reviews from "../components/Reviews";
import Insta from "../components/Insta";

const Home = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | undefined
  >(undefined);

  return (
    <>
      <Hero />
      <Category
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(categoryId, categoryName) => {
          setSelectedCategoryId(categoryId);
          setSelectedCategoryName(categoryName);
        }}
      />
      <Types />
      <Services />
      <ProductsGrid
        selectedCategoryId={selectedCategoryId}
        selectedCategoryName={selectedCategoryName}
      />
      <Banner />
      <Reviews />
      <Insta />
    </>
  );
};

export default Home;

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Aos from "aos";
import "aos/dist/aos.css";
import cat1 from "../assets/cat1.png";
import cat2 from "../assets/cat2.jpg";
import cat3 from "../assets/cat3.jpg";
import cat4 from "../assets/cat4.png";
import cat5 from "../assets/cat5.jpg";
import { apiUrl } from "../utils/shop";

type CategoryItem = {
  _id: string;
  name: string;
  image?: string;
};

type CategoryProps = {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null, categoryName?: string) => void;
};

const fallbackImages = [cat1, cat2, cat3, cat4, cat5];

const Category = ({ selectedCategoryId, onSelectCategory }: CategoryProps) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    Aos.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/category/get-all`);
        setCategories(response.data?.data ?? []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCategories();
  }, []);

  const displayCategories = useMemo(
    () => categories.slice(0, 5),
    [categories],
  );

  const handleSelect = (category: CategoryItem | null) => {
    onSelectCategory(category?._id ?? null, category?.name);
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      id="category"
      className="flex w-full flex-col items-center justify-center gap-20 bg-gray-100 px-5 pb-[80px] pt-[130px] lg:flex-row lg:px-20"
    >
      <div
        data-aos="zoom-in"
        data-aos-delay="50"
        className="flex w-full flex-col items-center justify-center gap-[20px] lg:w-[15%] lg:items-start"
      >
        <h1 className="text-center text-xl font-semibold text-themePurple">
          Favorites Item
        </h1>
        <h1 className="text-center text-[42px] font-semibold leading-[50px] text-black lg:text-start">
          Popular Category
        </h1>
        <button
          onClick={() => handleSelect(null)}
          className="mt-[20px] rounded-lg bg-themePurple px-8 py-3 font-semibold text-white transition hover:bg-themeYellow hover:text-black lg:mt-[60px]"
        >
          VIEW ALL
        </button>
      </div>
      <div className="grid w-full grid-cols-1 justify-center items-start gap-10 lg:w-[85%] lg:grid-cols-5">
        {displayCategories.map((category, index) => {
          const isActive = selectedCategoryId === category._id;

          return (
            <button
              key={category._id}
              type="button"
              data-aos="zoom-in"
              data-aos-delay={`${(index + 1) * 100}`}
              onClick={() => handleSelect(category)}
              className={`flex flex-col items-center justify-center gap-6 rounded-[28px] px-3 py-4 text-center transition ${
                isActive
                  ? "bg-white shadow-lg ring-2 ring-themePurple"
                  : "hover:-translate-y-1"
              }`}
            >
              <img
                src={category.image || fallbackImages[index % fallbackImages.length]}
                alt={category.name}
                className="h-[200px] w-[200px] rounded-full object-cover"
              />
              <h1
                className={`text-xl font-semibold ${
                  isActive ? "text-themePurple" : "text-black"
                }`}
              >
                {category.name}
              </h1>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Category;

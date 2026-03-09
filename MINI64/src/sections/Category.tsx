import React, { useEffect } from "react";
import cat1 from "../assets/cat1.png";
import cat2 from "../assets/cat2.jpg";
import cat3 from "../assets/cat3.jpg";
import cat4 from "../assets/cat4.png";
import cat5 from "../assets/cat5.jpg";
import Aos from "aos";
import "aos/dist/aos.css";
const Category = () => {
  useEffect(() => {
    Aos.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });
  }, []);
  return (
    <div
      id="category"
      className="w-full bg-gray-100 lg:px-20 px-5 pt-[130px] 
    pb-[80px] flex lg:flex-row flex-col justify-center items-center gap-20"
    >
      <div
        data-aos="zoom-in"
        data-aos-delay="50"
        className="lg:w-[15%] w-full flex
      flex-col justify-center lg:items-start items-center gap-[20px]"
      >
        <h1 className="tex-themePurple tex-xl front-semibold text-center">
          Favorites Item
        </h1>
        <h1
          className="text-black font-semibold text-[42px] leading-[50px]
        lg:text-start text-center"
        >
          Popular Category
        </h1>
        <button
          className="bg-themePurple hover:bg-themeYellow text-white 
        hover:text-black px-8 py-3 rounded-lg front-semibold mt-[60px]"
        >
          VIEW ALL
        </button>
      </div>
      <div
        className="lg:w-[85%] w-full grid lg:grid-cols-5 grid-cols-1
      justify-center items-start gap-10"
      >
        <div
          data-aos="zoom-in"
          data-aos-delay="100"
          className="flex flex-col
        justify-center items-center gap-6"
        >
          <img src={cat1} alt="" className="rounded-full cursor-pointer" />
          <h1
            className="text-black text-xl font-semibold hover:text-themePurple 
          cursor-pointer"
          >
            1:64 CAR
          </h1>
        </div>

        <div
          data-aos="zoom-in"
          data-aos-delay="200"
          className="flex flex-col
        justify-center items-center gap-6"
        >
          <img src={cat2} alt="" className="rounded-full cursor-pointer" />
          <h1
            className="text-black text-xl font-semibold hover:text-themePurple 
          cursor-pointer"
          >
            1:64 FIGURE
          </h1>
        </div>

        <div
          data-aos="zoom-in"
          data-aos-delay="300"
          className="flex flex-col
        justify-center items-center gap-6"
        >
          <img src={cat3} alt="" className="rounded-full cursor-pointer " />
          <h1
            className="text-black text-xl font-semibold hover:text-themePurple 
          cursor-pointer"
          >
            DIORAMA
          </h1>
        </div>

        <div
          data-aos="zoom-in"
          data-aos-delay="400"
          className="flex flex-col
        justify-center items-center gap-6"
        >
          <img src={cat4} alt="" className="rounded-full cursor-pointer" />
          <h1
            className="text-black text-xl font-semibold hover:text-themePurple 
          cursor-pointer"
          >
            BOX MICA
          </h1>
        </div>

        <div
          data-aos="zoom-in"
          data-aos-delay="500"
          className="flex flex-col
        justify-center items-center gap-6"
        >
          <img src={cat5} alt="" className="rounded-full cursor-pointer" />
          <h1
            className="text-black text-xl font-semibold hover:text-themePurple 
          cursor-pointer"
          >
            Portable Speaker
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Category;

import React, { useEffect } from "react";
import insta1 from "../assets/insta-1.jpg";
import insta2 from "../assets/insta-2.jpg";
import insta3 from "../assets/insta-3.jpg";
import insta4 from "../assets/insta-4.jpg";
import insta5 from "../assets/insta-5.jpg";
import insta6 from "../assets/insta-6.jpg";
import AOS from "aos";
import "aos/dist/aos.css";

const Insta = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });
    AOS.refresh();
  }, []);

  const instaImages = [insta1, insta2, insta3, insta4, insta5, insta6];

  return (
    <div className="w-full lg:px-20 px-5 py-20 bg-white flex flex-col justify-center items-center gap-4">
      {/* Subheading */}
      <h1
        data-aos="zoom-in"
        data-aos-delay="100"
        className="text-purple-500 text-xl font-semibold capitalize"
      >
        Our Instagram Shop
      </h1>

      {/* Main Heading */}
      <h1
        data-aos="zoom-in"
        data-aos-delay="200"
        className="text-black font-semibold lg:text-[42px] text-[32px] lg:leading-[50px] leading-[40px] text-center capitalize"
      >
        Follow us on Instagram
      </h1>

      {/* Instagram Grid */}
      <div
        data-aos="zoom-in"
        data-aos-delay="300"
        className="w-full grid lg:grid-cols-6 md:grid-cols-3 grid-cols-2 gap-6 mt-8"
      >
        {instaImages.map((img, index) => (
          <div
            key={index}
            className="relative group overflow-hidden rounded-lg"
          >
            <img
              src={img}
              alt={`instagram-${index}`}
              className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110 cursor-pointer"
            />
            {/* Lớp phủ khi hover (tùy chọn) */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Instagram Button */}
      <button
        data-aos="zoom-in"
        data-aos-delay="400"
        className="bg-purple-500 hover:bg-yellow-500 text-white hover:text-black font-bold px-10 py-4 rounded-lg mt-12 uppercase transition-all duration-300 shadow-md"
      >
        #ElectraShop
      </button>
    </div>
  );
};

export default Insta;

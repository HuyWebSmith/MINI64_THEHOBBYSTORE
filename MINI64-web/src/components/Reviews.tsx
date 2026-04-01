import { useEffect } from "react";
import Slider from "react-slick";
import { FaStar, FaQuoteLeft } from "react-icons/fa";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import AOS from "aos";
import "aos/dist/aos.css";

import { reviewdata } from "../export";

// 👉 Define type cho data
type Review = {
  img: string;
  para: string;
  name: string;
  post: string;
};

const Reviews = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,

    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
        },
      },
    ],

    beforeChange: () => {
      const elements = document.querySelectorAll("#testimonials [data-aos]");
      elements.forEach((el) => {
        el.classList.remove("aos-animate");
      });
    },

    afterChange: () => {
      AOS.refresh();
    },
  };

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });

    AOS.refresh();
  }, []);

  return (
    <div
      id="testimonials"
      className="w-full lg:px-20 px-5 py-[80px] bg-gray-100 flex flex-col justify-center items-center gap-4"
    >
      {/* Title */}
      <h1
        data-aos="zoom-in"
        data-aos-delay="100"
        className="text-purple-500 text-xl font-semibold"
      >
        1300+ Customer Reviews
      </h1>

      <h1
        data-aos="zoom-in"
        data-aos-delay="200"
        className="text-black font-semibold text-[42px] leading-[50px] text-center capitalize"
      >
        Our Customer Love
      </h1>

      {/* Slider */}
      <div data-aos="zoom-in" data-aos-delay="300" className="w-full mt-10">
        <Slider className="w-full" {...settings}>
          {(reviewdata as Review[]).map((item, index) => (
            <div key={index}>
              <div className="w-full flex flex-col justify-center items-center gap-4 lg:p-10 p-3">
                {/* Avatar */}
                <img
                  src={item.img}
                  alt={item.name}
                  className="rounded-full w-[100px] m-auto"
                />

                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-purple-500" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-center text-gray-500 text-lg">{item.para}</p>

                {/* Info */}
                <div className="flex items-center gap-5">
                  <FaQuoteLeft className="text-purple-500 size-16" />
                  <div>
                    <h1 className="text-black text-xl font-semibold capitalize">
                      {item.name}
                    </h1>
                    <h1 className="text-gray-500 capitalize">{item.post}</h1>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Reviews;

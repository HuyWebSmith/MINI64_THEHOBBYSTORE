import { useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import earbuds from "../assets/earbuds.jpg";
import dslr from "../assets/dslr.jpg";
import r34 from "../assets/R34 nisan skyline.png";
import lamborghini from "../assets/redbull.png";
import AOS from "aos";
import "aos/dist/aos.css";

const Hero = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,

    beforeChange: () => {
      const elements = document.querySelectorAll("#hero [data-aos]");
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
      id="hero"
      className="w-full flex justify-center 
    items-center lg:h-[700px] h-[600px]"
    >
      <Slider className="w-full" {...settings}>
        <div>
          <div
            className="w-full lg:px-20 px-5 lg:h-[700px] h-[600px] flex
          flex-col justify-center items-start gap-10 bg-cover bg-center "
            style={{ backgroundImage: `url(${r34})` }}
          >
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-[#f5e60d] border rounded-lg border-themeYellow px-6 py-2 text-xl"
            >
              Get up to Discounts 30% Off
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white lg:txt-[120px] text-[60px] 
              uppercase font-bold lg:leading-[120px] leading-[70px]"
            >
              R34 FAST AND FURIOUS <br />
              NISSAN SKYLINE
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white text-2xl "
            >
              100% trusted{" "}
              <span className="text-themeYellow font-semibold ">
                Electronics Gadgets
              </span>
            </h1>
            <button
              data-aos="zoom-in"
              data-aos-delay="200"
              className="bg-themeYellow px-6 py-3 rounded-lg
            text-black font-semibold"
            >
              ONLINE COLLECTIONS
            </button>
          </div>
        </div>
        <div>
          <div
            className="w-full lg:px-20 px-5 lg:h-[700px] h-[600px] flex
          flex-col justify-center items-start gap-10 bg-contain bg-center "
            style={{ backgroundImage: `url(${lamborghini})` }}
          >
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-[#f5e60d] border rounded-lg border-themeYellow px-6 py-2 text-xl"
            >
              Get up to Discounts 30% Off
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white lg:txt-[120px] text-[60px] 
              uppercase font-bold lg:leading-[120px] leading-[70px]"
            >
              LAMBORGHINI <br />
              REDBULL
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white text-2xl "
            >
              100% trusted{" "}
              <span className="text-themeYellow font-semibold ">
                Electronics Gadgets
              </span>
            </h1>
            <button
              data-aos="zoom-in"
              data-aos-delay="200"
              className="bg-themeYellow px-6 py-3 rounded-lg
            text-black font-semibold"
            >
              ONLINE COLLECTIONS
            </button>
          </div>
        </div>
        <div>
          <div
            className="w-full lg:px-20 px-5 lg:h-[700px] h-[600px] flex
          flex-col justify-center items-start gap-10 bg-cover bg-center "
            style={{ backgroundImage: `url(${earbuds})` }}
          >
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-[#f5e60d] border rounded-lg border-themeYellow px-6 py-2 text-xl"
            >
              Get up to Discounts 30% Off
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white lg:txt-[120px] text-[60px] 
              uppercase font-bold lg:leading-[120px] leading-[70px]"
            >
              DSLR 360 <br />
              Camera
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white text-2xl "
            >
              100% trusted{" "}
              <span className="text-themeYellow font-semibold ">
                Electronics Gadgets
              </span>
            </h1>
            <button
              data-aos="zoom-in"
              data-aos-delay="200"
              className="bg-themeYellow px-6 py-3 rounded-lg
            text-black font-semibold"
            >
              ONLINE COLLECTIONS
            </button>
          </div>
        </div>
        <div>
          <div
            className="w-full lg:px-20 px-5 lg:h-[700px] h-[600px] flex
          flex-col justify-center items-start gap-10 bg-cover bg-center "
            style={{ backgroundImage: `url(${dslr})` }}
          >
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-[#f5e60d] border rounded-lg border-themeYellow px-6 py-2 text-xl"
            >
              Get up to Discounts 30% Off
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white lg:txt-[120px] text-[60px] 
              uppercase font-bold lg:leading-[120px] leading-[70px]"
            >
              DSLR 360 <br />
              Camera
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white text-2xl "
            >
              100% trusted{" "}
              <span className="text-themeYellow font-semibold ">
                Electronics Gadgets
              </span>
            </h1>
            <button
              data-aos="zoom-in"
              data-aos-delay="200"
              className="bg-themeYellow px-6 py-3 rounded-lg
            text-black font-semibold"
            >
              ONLINE COLLECTIONS
            </button>
          </div>
        </div>
        <div>
          <div
            className="w-full lg:px-20 px-5 lg:h-[700px] h-[600px] flex
          flex-col justify-center items-start gap-10 bg-cover bg-center "
            style={{ backgroundImage: `url(${dslr})` }}
          >
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-[#f5e60d] border rounded-lg border-themeYellow px-6 py-2 text-xl"
            >
              Get up to Discounts 30% Off
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white lg:txt-[120px] text-[60px] 
              uppercase font-bold lg:leading-[120px] leading-[70px]"
            >
              DSLR 360 <br />
              Camera
            </h1>
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              className="text-white text-2xl "
            >
              100% trusted{" "}
              <span className="text-themeYellow font-semibold ">
                Electronics Gadgets
              </span>
            </h1>
            <button
              data-aos="zoom-in"
              data-aos-delay="200"
              className="bg-themeYellow px-6 py-3 rounded-lg
            text-black font-semibold"
            >
              ONLINE COLLECTIONS
            </button>
          </div>
        </div>
      </Slider>
    </div>
  );
};

export default Hero;

import React, { useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
// @ts-ignore
import { reviewdata } from "../export";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaQ } from "react-icons/fa6";

const Reviews = () => {
  const settings = {
      dots: true,
      infinite: true,
      speed: 600,
      slidesToShow: 2,
      slidesToScroll: 1,
      arrows: false,
      responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 2
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1, 
          slidesToScroll: 1
        }
      }
    ],
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
    <div id='testimonials' className='w-full lg:px20 px-5 py-[80px] bg-gray-100
    flex flex-col justify-center items-center gap-4'>
      <h1 data-aos="zoom-in" data-aos-delay="100" className='text-purple-500 
      text-xl font-semibold'>1300+ Customer Reviews</h1>
      <h1 data-aos="zoom-in" data-aos-delay="200" className='text-black
      font-semibold text-[42px] leading-[50px] text-center capitalize'>Our Customer Love</h1>

      <div data-aos="zoom-in" data-aos-delay="300" className='w-full mt-10'>
        <Slider className='w-full' {...settings}>
          {
            (reviewdata as any[]).map((item: any, index: number) => (
              <div>
                <div key={index} className='w-full flex flex-col justify-center
                items-center gap-4 lg:p-10 p-3'>
                  <img src={item.img} alt="" className='rounded-full w-[100px]
                  m-auto' />
                  <div className='flex justify-center items-center gap-1'>
                    <FaStar className='text-purple-500' />
                    <FaStar className='text-purple-500' />
                    <FaStar className='text-purple-500' />
                    <FaStar className='text-purple-500' />
                    <FaStar className='text-purple-500' />
                  </div>
                  <p className='text-center text-gray-500 text-lg'>{item.para}</p>
                  <div className='flex justify-center items-center gap-5'>
                    <FaQuoteLeft className='text-purple-500 size-16' />
                    <div className='w-full flex flex-col justify-center items-start'>
                      <h1 className='text-black text-xl capitalize font-semibold'>
                        {item.name}</h1>
                      <h1 className='text-gray-500 capitalize'>{item.post}</h1>
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </Slider>
      </div>
    </div>
  )
}

export default Reviews

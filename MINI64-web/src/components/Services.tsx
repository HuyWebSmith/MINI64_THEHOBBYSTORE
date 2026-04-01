import { useEffect } from "react";
import payment from "../assets/payment.png";
import shipping from "../assets/shipping.png";
import refund from "../assets/return.png";
import gift from "../assets/gift.png";
import AOS from "aos";
import "aos/dist/aos.css";
const Services = () => {
  
  useEffect(() => {
      AOS.init({
        duration: 800,
        easing: "ease-in-out",
        once: false,
      });
  
      AOS.refresh();
    }, []);
  
  return (
    <div className="w-full lg:px-20 px-5 pt-[0px] pb-[80px] grid lg:grid-cols-4 
    grid-cols-1 justify-center items-center gap-10 ">
      <div data-apps="zoom-in" data-aos-delay="100" className="flex flex-col justify-center items-center gap-2">
        <img src={shipping} alt="" className="mb-[20px] w-[60px]" />
        <h1 className='text-x1 text-black font-semibold'>Worldwide Shipping</h1>
        <p className="text-[17px] text-gray-500 ">Lorem ipsum dolor sit amet.</p>
      </div>
      <div data-apps="zoom-in" data-aos-delay="100" className="flex flex-col justify-center items-center gap-2">
        <img src={payment} alt="" className="mb-[20px] w-[60px]" />
        <h1 className='text-x1 text-black font-semibold'>100% Secure Payment</h1>
        <p className="text-[17px] text-gray-500 ">Lorem ipsum dolor sit amet.</p>
      </div>
      <div data-apps="zoom-in" data-aos-delay="100" className="flex flex-col justify-center items-center gap-2">
        <img src={refund} alt="" className="mb-[20px] w-[60px]" />
        <h1 className='text-x1 text-black font-semibold'>Easy Returns</h1>
        <p className="text-[17px] text-gray-500 ">Lorem ipsum dolor sit amet.</p>
      </div>
      <div data-apps="zoom-in" data-aos-delay="100" className="flex flex-col justify-center items-center gap-2">
        <img src={gift} alt="" className="mb-[20px] w-[60px]" />
        <h1 className='text-x1 text-black font-semibold'>Gift Cards</h1>
        <p className="text-[17px] text-gray-500 ">Lorem ipsum dolor sit amet.</p>
      </div>
    </div>
  )
};



export default Services;

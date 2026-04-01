import { useEffect } from "react";
import client1 from "../assets/client1.png";
import client2 from "../assets/client2.png";
import client3 from "../assets/client3.png";
import client4 from "../assets/client4.png";
import client5 from "../assets/client5.png";
import client6 from "../assets/client6.png";
import google from "../assets/google.jpg";
import apple from "../assets/apple.jpg";
import pay1 from "../assets/pay-1.jpg";
import pay2 from "../assets/pay-2.jpg";
import pay3 from "../assets/pay-3.jpg";
import pay4 from "../assets/pay-4.jpg";

import { FaArrowUp } from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";

const Footer = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });
  }, []);

  const footerLinks = ["Home", "About Us", "Services", "Projects", "Contact"];

  return (
    <div id="contact" className="w-full flex flex-col">
      {/* 1st Box: Clients Logo */}
      <div
        data-aos="zoom-in"
        className="w-full bg-purple-500 lg:px-20 px-10 py-12 grid lg:grid-cols-6 grid-cols-2 gap-10 justify-items-center items-center"
      >
        {[client1, client2, client3, client4, client5, client6].map(
          (client, index) => (
            <img
              key={index}
              src={client}
              alt="client"
              className="w-[120px] opacity-70 cursor-pointer hover:opacity-100 transition-opacity duration-300"
            />
          ),
        )}
      </div>

      {/* 2nd Box: Main Footer Links */}
      <div className="w-full lg:px-20 px-10 py-16 bg-gray-100 grid lg:grid-cols-5 md:grid-cols-2 grid-cols-1 gap-12">
        {/* Brand Section */}
        <div data-aos="fade-up" className="flex flex-col gap-6 lg:col-span-1">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold text-purple-500 underline italic cursor-pointer">
              Electra Shop
            </h1>
            <p className="text-gray-500 leading-relaxed text-justify">
              Chuyên cung cấp các thiết bị điện tử chất lượng cao với giá cả
              cạnh tranh nhất thị trường.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-black text-lg font-semibold uppercase">
              Download our app
            </h1>
            <div className="flex gap-3">
              <img
                src={google}
                alt="google play"
                className="w-32 cursor-pointer border rounded-md"
              />
              <img
                src={apple}
                alt="app store"
                className="w-32 cursor-pointer border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Links Sections */}
        {[1, 2, 3, 4].map((item) => (
          <div key={item} data-aos="fade-up" data-aos-delay={item * 100}>
            <h1 className="text-black text-xl font-semibold capitalize mb-6">
              Useful Links
            </h1>
            <ul className="flex flex-col gap-3">
              {footerLinks.map((link, idx) => (
                <li
                  key={idx}
                  className="text-gray-500 cursor-pointer hover:text-purple-500 transition-colors"
                >
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 3rd Box: Newsletter & Payment */}
      <div className="w-full lg:px-20 px-10 py-10 bg-gray-100 border-t border-gray-300">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
          {/* Newsletter */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-1/2">
            <h1 className="text-black font-semibold text-xl whitespace-nowrap">
              Subscribe Newsletter
            </h1>
            <div className="flex w-full max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="p-3 rounded-l-lg w-full outline-none border border-gray-300"
              />
              <button className="bg-purple-500 text-white px-6 py-3 rounded-r-lg hover:bg-black transition-all">
                Join
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-4">
            <img
              src={pay1}
              alt="pay"
              className="w-12 h-8 object-cover rounded shadow-sm border border-white"
            />
            <img
              src={pay2}
              alt="pay"
              className="w-12 h-8 object-cover rounded shadow-sm border border-white"
            />
            <img
              src={pay3}
              alt="pay"
              className="w-12 h-8 object-cover rounded shadow-sm border border-white"
            />
            <img
              src={pay4}
              alt="pay"
              className="w-12 h-8 object-cover rounded shadow-sm border border-white"
            />
          </div>
        </div>

        <p className="text-center mt-10 text-gray-400 text-sm">
          © 2024 Electra Shop. All rights reserved.
        </p>
      </div>

      {/* Back to top button (Optional) */}
      <button className="fixed bottom-6 right-6 bg-purple-500 p-3 rounded-full text-white hover:scale-110 transition-transform">
        <FaArrowUp />
      </button>
    </div>
  );
};

export default Footer;

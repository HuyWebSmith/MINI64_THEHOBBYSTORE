import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Search, ShoppingCart } from "lucide-react";
import { UserContext } from "../context/UserContext";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // State cho Search và Cart dropdown
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_info");
    localStorage.removeItem("access_token");
    setUser(null);
    setIsMenuOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { name: "SHOP", href: "#" },
    { name: "CAR", href: "#" },
    { name: "GUIDE", href: "#" },
    { name: "BLOG", href: "#" },
    { name: "CONTACT", href: "#" },
  ];

  const textColor = isScrolled ? "text-gray-800" : "text-white";
  const iconColor = isScrolled
    ? "text-gray-600 hover:text-indigo-600"
    : "text-white hover:text-themeYellow";

  return (
    <header
      className={`fixed w-full z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-md py-3"
          : "bg-black/20 backdrop-blur-sm py-5"
      }`}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
              <img
                src="https://res.cloudinary.com/speedwares/image/upload/v1659284687/windframe-logo-main_daes7r.png"
                alt="Logo"
                className="h-6 w-auto brightness-0 invert"
              />
            </div>
            <span
              className={`text-xl font-bold hidden sm:block ${isScrolled ? "text-indigo-900" : "text-white"}`}
            >
              MINI64
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`${textColor} font-medium transition-colors relative group`}
            >
              {link.name}
              <span
                className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? "bg-indigo-600" : "bg-themeYellow"} transition-all group-hover:w-full`}
              ></span>
            </a>
          ))}
        </div>

        {/* Right Section (Search, Cart, Auth) */}
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* SEARCH ICON & DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsCartOpen(false);
              }}
              className={`p-2 rounded-full transition-colors ${iconColor}`}
            >
              <Search size={22} />
            </button>

            {isSearchOpen && (
              <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm mô hình..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={16}
                  />
                </div>
              </div>
            )}
          </div>

          {/* CART ICON & DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCartOpen(!isCartOpen);
                setIsSearchOpen(false);
              }}
              className={`p-2 rounded-full transition-colors relative ${iconColor}`}
            >
              <ShoppingCart size={22} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            {isCartOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <h3 className="text-gray-800 font-bold mb-4">
                  Giỏ hàng của bạn
                </h3>
                <div className="flex flex-col items-center py-6 text-gray-400">
                  <ShoppingCart size={40} className="mb-2 opacity-20" />
                  <p className="text-sm">Chưa có sản phẩm nào</p>
                </div>
                <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                  Xem giỏ hàng
                </button>
              </div>
            )}
          </div>

          {/* Auth Section Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-full ${isScrolled ? "bg-indigo-100 text-indigo-600" : "bg-white/20 text-white"}`}
                  >
                    <User size={18} />
                  </div>
                  <span
                    className={`font-semibold ${isScrolled ? "text-gray-900" : "text-white"}`}
                  >
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-red-500 font-bold hover:text-red-700 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`font-semibold ${textColor} hover:text-indigo-600 transition-colors`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${isScrolled ? "text-indigo-600" : "text-white"}`}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl transition-all duration-300 transform ${
          isMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col p-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-medium text-gray-800 hover:text-indigo-600"
            >
              {link.name}
            </a>
          ))}

          <div className="flex flex-col space-y-3 pt-4 border-t">
            {user ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <span className="font-bold text-gray-900 text-lg">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 text-center text-indigo-600 font-bold border border-indigo-600 rounded-xl"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 text-center bg-indigo-600 text-white font-bold rounded-xl shadow-md"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

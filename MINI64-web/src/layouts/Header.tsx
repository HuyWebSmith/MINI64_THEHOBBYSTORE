import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ CÁCH SỬA: Khởi tạo state trực tiếp từ localStorage (Lazy Initializer)
  // Cách này giúp React lấy tên user ngay lập tức mà không cần đợi render xong mới chạy useEffect
  const [userName, setUserName] = useState<string | null>(() => {
    const userData = localStorage.getItem("user_info");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.name;
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    // useEffect giờ đây chỉ lo việc xử lý sự kiện bên ngoài (Scroll)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_info");
    localStorage.removeItem("access_token");
    setUserName(null);
    setIsMenuOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#" },
    { name: "Testimonials", href: "#" },
    { name: "Blog", href: "#" },
  ];

  const textColor = isScrolled ? "text-gray-800" : "text-white";
  const hoverColor = isScrolled
    ? "hover:text-indigo-600"
    : "hover:text-themeYellow";

  return (
    <header
      className={`fixed w-full z-[100] transition-all duration-300 ${
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
              className={`${textColor} ${hoverColor} font-medium transition-colors relative group`}
            >
              {link.name}
              <span
                className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? "bg-indigo-600" : "bg-themeYellow"} transition-all group-hover:w-full`}
              ></span>
            </a>
          ))}
        </div>

        {/* Auth Section */}
        <div className="hidden md:flex items-center space-x-4">
          {userName ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-full ${isScrolled ? "bg-indigo-100 text-indigo-600" : "bg-white/20 text-white"}`}
                >
                  <User size={18} />
                </div>
                <span
                  className={`font-semibold ${isScrolled ? "text-gray-900" : "text-white"}`}
                >
                  {userName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-1.5 font-bold transition-colors ${
                  isScrolled
                    ? "text-red-500 hover:text-red-700"
                    : "text-white hover:text-red-300"
                }`}
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`${isScrolled ? "text-gray-900" : "text-white"} font-semibold hover:text-indigo-600 transition-colors`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`${isScrolled ? "bg-indigo-600 text-white" : "bg-themeYellow text-black"} px-6 py-2.5 rounded-full font-semibold hover:opacity-90 transition-all shadow-sm`}
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg transition-colors ${isScrolled ? "text-indigo-600" : "text-white"}`}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
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
            {userName ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <span className="font-bold text-gray-900 text-lg">
                    {userName}
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

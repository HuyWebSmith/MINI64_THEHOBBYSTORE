import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Radio, ShoppingCart, User, X } from "lucide-react";
import axios from "axios";
import { UserContext } from "../context/UserContext";

const apiUrl = import.meta.env.VITE_API_URL;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const getUserFromStorage = () => {
    const userData = localStorage.getItem("user_info");

    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const fetchCartCount = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}/api/cart/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const items = response.data?.data?.items ?? [];
      const totalItems = items.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      );

      setCartCount(totalItems);
    } catch (error) {
      console.error(error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncHeaderState = () => {
      setUser(getUserFromStorage());
      fetchCartCount();
    };

    syncHeaderState();
    window.addEventListener("storage", syncHeaderState);
    window.addEventListener("auth-changed", syncHeaderState);
    window.addEventListener("cart-changed", syncHeaderState);

    return () => {
      window.removeEventListener("storage", syncHeaderState);
      window.removeEventListener("auth-changed", syncHeaderState);
      window.removeEventListener("cart-changed", syncHeaderState);
    };
  }, [location.pathname, setUser]);

  const handleLogout = () => {
    localStorage.removeItem("user_info");
    localStorage.removeItem("access_token");
    setUser(null);
    setCartCount(0);
    setIsMenuOpen(false);
    window.dispatchEvent(new Event("auth-changed"));
    window.dispatchEvent(new Event("cart-changed"));
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
  const hoverColor = isScrolled
    ? "hover:text-indigo-600"
    : "hover:text-themeYellow";

  return (
    <header
      className={`fixed z-[100] w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white py-3 shadow-md"
          : "bg-black/20 py-5 backdrop-blur-sm"
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-6">
        <div className="flex items-center">
          <Link to="/" className="group flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 transition-transform group-hover:rotate-6">
              <img
                src="https://res.cloudinary.com/speedwares/image/upload/v1659284687/windframe-logo-main_daes7r.png"
                alt="Logo"
                className="h-6 w-auto brightness-0 invert"
              />
            </div>
            <span
              className={`hidden text-xl font-bold sm:block ${
                isScrolled ? "text-indigo-900" : "text-white"
              }`}
            >
              MINI64
            </span>
          </Link>
        </div>

        <div className="hidden items-center space-x-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`${textColor} ${hoverColor} group relative font-medium transition-colors`}
            >
              {link.name}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 w-0 ${
                  isScrolled ? "bg-indigo-600" : "bg-themeYellow"
                } transition-all group-hover:w-full`}
              ></span>
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/live"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${
              isScrolled
                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Radio size={16} />
            Live
          </Link>

          <Link
            to="/live"
            className={`relative inline-flex items-center justify-center rounded-full border p-3 transition ${
              isScrolled
                ? "border-gray-200 text-gray-800 hover:border-indigo-500 hover:text-indigo-600"
                : "border-white/20 text-white hover:bg-white/10"
            }`}
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-themeYellow px-1 text-xs font-bold text-black">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-full p-1.5 ${
                    isScrolled
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-white/20 text-white"
                  }`}
                >
                  <User size={18} />
                </div>
                <span
                  className={`font-semibold ${
                    isScrolled ? "text-gray-900" : "text-white"
                  }`}
                >
                  {user.name}
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
                className={`${
                  isScrolled ? "text-gray-900" : "text-white"
                } font-semibold transition-colors hover:text-indigo-600`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`${
                  isScrolled
                    ? "bg-indigo-600 text-white"
                    : "bg-themeYellow text-black"
                } rounded-full px-6 py-2.5 font-semibold shadow-sm transition-all hover:opacity-90`}
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`rounded-lg p-2 transition-colors ${
              isScrolled ? "text-indigo-600" : "text-white"
            }`}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      <div
        className={`absolute left-0 top-full w-full transform border-t border-gray-100 bg-white shadow-xl transition-all duration-300 md:hidden ${
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col space-y-4 p-6">
          <Link
            to="/live"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600"
          >
            <Radio size={18} />
            Livestream Shopping
          </Link>

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

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span className="font-semibold text-gray-800">Gio hang live</span>
            <span className="rounded-full bg-themeYellow px-3 py-1 text-sm font-bold text-black">
              {cartCount}
            </span>
          </div>

          <div className="flex flex-col space-y-3 border-t pt-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <User size={20} />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 font-bold text-red-600"
                >
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-xl border border-indigo-600 py-3 text-center font-bold text-indigo-600"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-center font-bold text-white shadow-md"
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

import { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  User,
  Package,
  Search,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserContext } from "../context/UserContext";
import { useCart } from "../context/CartContext";

const FREE_SHIPPING_THRESHOLD = 20;

const formatCurrency = (price: number) => `${price.toLocaleString("vi-VN")}đ`;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLiveHeaderVisible, setIsLiveHeaderVisible] = useState(false);

  // State cho Search và Cart dropdown
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [flyItem, setFlyItem] = useState<{
    image: string;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);

  const { user, setUser } = useContext(UserContext);
  const {
    cartItems,
    cartCount,
    subtotal,
    hasUnavailableItems,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const isLivePage = location.pathname === "/live";
  const shippingShortfall = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100),
  );
  const ensureCartAccess = () => {
    if (user) {
      return true;
    }

    toast.error("Vui lòng đăng nhập để xem giỏ hàng.");
    navigate("/login");
    return false;
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isLivePage) {
      setIsLiveHeaderVisible(false);
    }
  }, [isLivePage]);

  useEffect(() => {
    const handleCartFly = (
      event: Event & {
        detail?: {
          image: string;
          startX: number;
          startY: number;
          width: number;
          height: number;
        };
      },
    ) => {
      if (!ensureCartAccess()) {
        return;
      }

      if (!event.detail) {
        return;
      }

      setFlyItem(event.detail);
      setIsCartOpen(true);
      window.setTimeout(() => setFlyItem(null), 700);
    };

    const handleCartOpen = () => {
      if (!ensureCartAccess()) {
        return;
      }

      setIsCartOpen(true);
    };

    window.addEventListener("mini64:cart-fly", handleCartFly as EventListener);
    window.addEventListener("mini64:cart-open", handleCartOpen);

    return () => {
      window.removeEventListener(
        "mini64:cart-fly",
        handleCartFly as EventListener,
      );
      window.removeEventListener("mini64:cart-open", handleCartOpen);
    };
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.removeItem("user_info");
    localStorage.removeItem("access_token");
    setUser(null);
    setIsMenuOpen(false);
    setIsCartOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { name: "SHOP", to: "/shop" },
    { name: "LIVE", to: "/live" },
    { name: "SUPPORT", to: "/support" },
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
    <>
      {isLivePage && (
        <div
          className="fixed inset-x-0 top-0 z-40 h-6"
          onMouseEnter={() => setIsLiveHeaderVisible(true)}
        />
      )}

      <header
        onMouseEnter={() => {
          if (isLivePage) {
            setIsLiveHeaderVisible(true);
          }
        }}
        onMouseLeave={() => {
          if (isLivePage) {
            setIsLiveHeaderVisible(false);
          }
        }}
        className={`fixed w-full z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white shadow-md py-3"
            : "bg-black/20 backdrop-blur-sm py-5"
        } ${
          isLivePage
            ? isLiveHeaderVisible
              ? "translate-y-0"
              : "-translate-y-[calc(100%-24px)]"
            : "translate-y-0"
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
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                className={`${textColor} font-medium transition-colors relative group`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 ${isScrolled ? "bg-indigo-600" : "bg-themeYellow"} transition-all group-hover:w-full`}
                ></span>
              </Link>
            ) : (
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
            )
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
              id="mini64-cart-trigger"
              onClick={() => {
                if (!ensureCartAccess()) {
                  return;
                }

                setIsCartOpen(!isCartOpen);
                setIsSearchOpen(false);
              }}
              className={`p-2 rounded-full transition-colors relative ${iconColor}`}
            >
              <ShoppingCart size={22} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {false && isCartOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <h3 className="text-gray-800 font-bold mb-4">
                  Giỏ hàng của bạn
                </h3>
                {cartItems.length > 0 && (
                  <>
                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                      {cartItems.map((item) => (
                        <Link
                          key={item.productId}
                          to={`/products/${item.productId}`}
                          onClick={() => setIsCartOpen(false)}
                          className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition hover:bg-gray-100"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-800">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.amount} x {formatCurrency(item.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-semibold text-gray-700">
                      <span>Tạm tính</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  </>
                )}
                <div
                  className={`${cartItems.length === 0 ? "flex" : "hidden"} flex-col items-center py-6 text-gray-400`}
                >
                  <ShoppingCart size={40} className="mb-2 opacity-20" />
                  <p className="text-sm">Chưa có sản phẩm nào</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate("/cart");
                  }}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                >
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
                  <Link
                    to="/profile"
                    className={`font-semibold transition-colors ${isScrolled ? "text-gray-900 hover:text-indigo-600" : "text-white hover:text-themeYellow"}`}
                  >
                    Hồ sơ
                  </Link>
                  <Link
                    to="/my-orders"
                    title="My orders" aria-label="My orders"
                    className={`rounded-full p-2 transition-colors ${isScrolled ? "text-gray-900 hover:bg-indigo-50 hover:text-indigo-600" : "text-white hover:bg-white/10 hover:text-themeYellow"}`}
                  ><Package size={18} />
                  </Link>
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
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-medium text-gray-800 hover:text-indigo-600"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-medium text-gray-800 hover:text-indigo-600"
              >
                {link.name}
              </a>
            )
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
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 text-center text-indigo-600 font-bold border border-indigo-600 rounded-xl"
                >
                  Hồ sơ
                </Link>
                <Link
                  to="/my-orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 text-center text-indigo-600 font-bold border border-indigo-600 rounded-xl flex items-center justify-center gap-2"
                ><Package size={18} /> Orders
                </Link>
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

      <AnimatePresence>
        {isCartOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]"
              onClick={() => setIsCartOpen(false)}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
                    Mini64 Cart
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Your Side Cart
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Truck size={16} className="text-emerald-500" />
                  {shippingShortfall > 0
                    ? `Add ${formatCurrency(shippingShortfall)} more for Free Ship`
                    : "Free Shipping unlocked"}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {hasUnavailableItems ? (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    Có sản phẩm trong giỏ đã hết hàng hoặc vượt quá số lượng tồn kho. Vui lòng kiểm tra lại trước khi thanh toán.
                  </div>
                ) : null}

                {cartItems.length > 0 ? (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.productId}-${item.scale}`}
                        className="rounded-[24px] border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 rounded-2xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/products/${item.productId}`}
                              onClick={() => setIsCartOpen(false)}
                              className="line-clamp-2 font-semibold text-slate-900"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.brand} • {item.scale}
                            </p>
                            <p className="mt-2 font-bold text-indigo-700">
                              {formatCurrency(item.price)}
                            </p>
                            {item.stock <= 0 ? (
                              <p className="mt-2 text-sm font-semibold text-rose-600">
                                Sản phẩm hiện đã hết hàng
                              </p>
                            ) : item.amount > item.stock ? (
                              <p className="mt-2 text-sm font-semibold text-amber-600">
                                Chỉ còn {item.stock} sản phẩm trong kho
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1">
                            <button
                              type="button"
                              onClick={() =>
                                item.amount <= 1
                                  ? removeFromCart(item.productId)
                                  : updateQuantity(item.productId, item.amount - 1)
                              }
                              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="min-w-10 text-center font-semibold text-slate-900">
                              {item.amount}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, item.amount + 1)
                              }
                              disabled={item.stock <= 0}
                              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                    <ShoppingCart size={42} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold text-slate-600">
                      Your cart is empty
                    </p>
                    <p className="mt-2 text-sm">
                      Quick Add from any product card and it will show up here.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-5">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!ensureCartAccess()) {
                        return;
                      }

                      setIsCartOpen(false);
                      navigate("/cart");
                    }}
                    className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    View Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasUnavailableItems) {
                        setIsCartOpen(false);
                        navigate("/cart");
                        return;
                      }

                      if (!ensureCartAccess()) {
                        return;
                      }

                      setIsCartOpen(false);
                      navigate("/checkout");
                    }}
                    className="rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={cartItems.length === 0}
                  >
                    {hasUnavailableItems ? "Kiểm tra giỏ hàng" : "Checkout"}
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {flyItem ? (
          <motion.img
            src={flyItem.image}
            alt=""
            initial={{
              x: flyItem.startX,
              y: flyItem.startY,
              width: flyItem.width,
              height: flyItem.height,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: window.innerWidth - 72,
              y: 18,
              width: 28,
              height: 28,
              opacity: 0.2,
              scale: 0.4,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="pointer-events-none fixed z-[70] rounded-xl object-cover shadow-2xl"
          />
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Header;


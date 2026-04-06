import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaRegHeart, FaStar } from "react-icons/fa";
import { MdAddShoppingCart, MdOutlineRemoveRedEye } from "react-icons/md";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";
import { useCart } from "../context/CartContext";

const apiUrl = import.meta.env.VITE_API_URL;

interface ProductItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  stock: number;
  category?: {
    _id: string;
    name: string;
  } | null;
  brand?: {
    _id: string;
    name: string;
  } | null;
}

const ProductsGrid = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${apiUrl}/api/product/get-all`, {
        params: {
          limit: 8,
          page: 0,
        },
      });

      setProducts(response.data?.data ?? []);
    } catch (err) {
      setError("Khong the tai san pham tu database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: false,
    });

    fetchProducts();
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [products, loading]);

  const renderStars = (rating: number) => {
    const fullStars = Math.max(0, Math.min(5, Math.round(rating)));

    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={`${rating}-${index}`}
        className={index < fullStars ? "text-themepurple" : "text-gray-300"}
      />
    ));
  };

  return (
    <div
      id="products"
      className="w-full bg-gray-100 px-5 py-[80px] lg:px-20 flex flex-col items-center justify-center gap-4"
    >
      <h1
        data-aos="zoom-in"
        data-aos-delay="100"
        className="text-xl font-semibold text-themepurple"
      >
        Browse Collections
      </h1>
      <h1
        data-aos="zoom-in"
        data-aos-delay="200"
        className="text-center text-[42px] font-semibold leading-[50px] text-black"
      >
        Trending Products
      </h1>

      {loading ? (
        <div
          data-aos="zoom-in"
          data-aos-delay="300"
          className="mt-10 w-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-sm text-gray-500"
        >
          Dang tai san pham tu database...
        </div>
      ) : error ? (
        <div
          data-aos="zoom-in"
          data-aos-delay="300"
          className="mt-10 w-full rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600"
        >
          <p>{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 rounded-lg bg-themepurple px-5 py-2 font-semibold text-white transition hover:bg-themeYellow hover:text-black"
          >
            Thu tai lai
          </button>
        </div>
      ) : (
        <>
          <div
            data-aos="zoom-in"
            data-aos-delay="300"
            className="mt-10 grid w-full grid-cols-1 gap-10 lg:grid-cols-4"
          >
            {products.map((item) => (
              <div
                id="product-box"
                key={item._id}
                className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-[220px] w-full rounded-lg object-cover"
                />
                <div
                  id="icons"
                  className="absolute top-[20px] flex items-center justify-center gap-3"
                >
                  <Link
                    to={`/products/${item._id}`}
                    aria-label={`Xem chi tiết ${item.name}`}
                    className="rounded-full bg-purple-500 p-3 text-white transition hover:bg-yellow-400 hover:text-black"
                  >
                    <MdOutlineRemoveRedEye />
                  </Link>
                  <div className="rounded-full bg-purple-500 p-3 text-white hover:bg-yellow-400 hover:text-black">
                    <FaRegHeart />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        productId: item._id,
                        name: item.name,
                        image: item.image,
                        price: item.price,
                        amount: 1,
                        scale: "1:64",
                        brand: item.brand?.name ?? "Mini64",
                        stock: item.stock,
                      })
                    }
                    className="rounded-full bg-purple-500 p-3 text-white hover:bg-yellow-400 hover:text-black"
                    aria-label={`Thêm ${item.name} vào giỏ`}
                  >
                    <MdAddShoppingCart />
                  </button>
                </div>
                <h1 className="text-lg font-semibold text-gray-400">
                  {item.category?.name ?? "Danh muc"}
                </h1>
                <h1 className="text-center text-xl font-semibold text-black">
                  {item.name}
                </h1>
                <h1 className="text-lg font-semibold text-themepurple">
                  {item.price.toLocaleString("vi-VN")}đ
                </h1>
                <div className="mt-2 w-full">
                  <hr />
                  <div className="mt-3 flex items-center justify-between gap-6">
                    <div className="flex items-center justify-start gap-1">
                      {renderStars(item.rating)}
                    </div>
                    <button className="rounded-lg bg-green-500 px-4 py-2 text-[13px] font-semibold text-white">
                      {item.stock > 0 ? `Con ${item.stock}` : "Het hang"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            data-aos="zoom-in"
            data-aos-delay="400"
            className="mt-8 rounded-lg bg-purple-500 px-8 py-3 font-semibold text-white hover:bg-yellow-500 hover:text-black"
          >
            VIEW MORE
          </button>
        </>
      )}
    </div>
  );
};

export default ProductsGrid;

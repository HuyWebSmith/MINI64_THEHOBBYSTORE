import { Link, useLocation } from "react-router-dom";
import { CircleCheckBig } from "lucide-react";

function OrderSuccessPage() {
  const location = useLocation();
  const orderId = location.state?.orderId as string | undefined;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <div className="rounded-[36px] border border-gray-100 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-gray-900 sm:px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CircleCheckBig className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">
            Cảm ơn bạn, đơn hàng đang được xử lý
          </h1>
          <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
            Chúng tôi đã ghi nhận đơn COD của bạn và sẽ liên hệ xác nhận sớm.
          </p>
          {orderId ? (
            <p className="mt-4 text-sm font-semibold text-indigo-600 dark:text-brand-400">
              Mã đơn hàng: {orderId}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-themeYellow hover:text-black"
            >
              Mua thêm sản phẩm
            </Link>
            <Link
              to="/"
              className="rounded-2xl border border-gray-200 px-5 py-3 font-bold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:text-gray-200 dark:hover:border-brand-500 dark:hover:text-brand-400"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OrderSuccessPage;

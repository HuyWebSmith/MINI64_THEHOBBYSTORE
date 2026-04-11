import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";
import type { ReactElement } from "react";

// Import các trang
import Home from "./layouts/Home";
import AdminDashboardHome from "./pages/Dashboard/Home";
import Login from "./pages/SignInPage";
import SignUp from "./pages/SignUpPage";

// Import các thành phần dùng chung
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import NotFound from "./pages/OtherPage/NotFound";
import BarChart from "./pages/Charts/BarChart";
import LineChart from "./pages/Charts/LineChart";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Buttons from "./pages/UiElements/Buttons";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Alerts from "./pages/UiElements/Alerts";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import Calendar from "./pages/Calendar";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layouts/AppLayout";
import { ScrollToTop } from "./components/admin_component/common/ScrollToTop";
import ProtectedRoute from "./components/admin_component/auth/ProtectedRoute";
import ProductManagement from "./pages/ProductManagementPage/ProductManagement";
import BrandManagement from "./pages/BrandManagementPage/BrandManagement";
import CategoryManagement from "./pages/CategoryManagementPage/CategoryManagement";
import OrderManagement from "./pages/OrderManagementPage/OrderManagement";
import ProductDetail from "./pages/ProductDetail";
import ProductListingPage from "./pages/ProductListingPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import MyOrdersPage from "./pages/MyOrdersTabsPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import LiveStreamAdminPage from "./pages/LiveStreamAdminPage";
import LiveStreamPlayerPage from "./pages/LiveStreamPlayerPage";
import WishlistPage from "./pages/WishlistShowcasePage";
import UserProfilePage from "./pages/UserProfileMotionPage";
import { UserContext } from "./context/UserContext";
import SupportChatPage from "./pages/SupportChatPage";
import AdminChatPage from "./pages/AdminChatPage";

const getStoredUserRole = () => {
  const savedUserData = localStorage.getItem("user_info");

  if (!savedUserData) {
    return null;
  }

  try {
    return JSON.parse(savedUserData).role?.toString().trim().toLowerCase();
  } catch {
    return null;
  }
};

const AdminAwareIndex = () => {
  const { user } = useContext(UserContext);
  const role = user?.role?.toString().trim().toLowerCase() ?? getStoredUserRole();

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Home />;
};

const GuestOnlyAuthRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useContext(UserContext);
  const role = user?.role?.toString().trim().toLowerCase() ?? getStoredUserRole();

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* CHỈ DÙNG 1 THẺ ROUTES DUY NHẤT
       */}
      <Routes>
        {/* --- NHÓM 1: TRANG DÀNH CHO KHÁCH (Có Header/Footer khách) --- */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <Outlet />
              <Footer />
            </>
          }
        >
          <Route index element={<AdminAwareIndex />} />
          <Route
            path="login"
            element={
              <GuestOnlyAuthRoute>
                <Login />
              </GuestOnlyAuthRoute>
            }
          />
          <Route
            path="signup"
            element={
              <GuestOnlyAuthRoute>
                <SignUp />
              </GuestOnlyAuthRoute>
            }
          />
          <Route path="signin" element={<Navigate to="/login" replace />} />
          <Route path="shop" element={<ProductListingPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="my-orders" element={<MyOrdersPage />} />
          <Route path="my-orders/:id" element={<OrderTrackingPage />} />
          <Route path="order-success" element={<OrderSuccessPage />} />
          <Route path="track-order" element={<OrderTrackingPage />} />
          <Route path="live" element={<LiveStreamPlayerPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="support" element={<SupportChatPage />} />
          <Route path="products/:id" element={<ProductDetail />} />
        </Route>

        {/* --- NHÓM 2: TRANG DASHBOARD ADMIN --- */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          {/* Đặt path="/admin" ở AppLayout */}
          <Route path="/admin" element={<AppLayout />}>
            <Route index element={<AdminDashboardHome />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="brands" element={<BrandManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="live" element={<LiveStreamAdminPage />} />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="profile" element={<UserProfiles />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="form-elements" element={<FormElements />} />
            <Route path="basic-tables" element={<BasicTables />} />
            <Route path="blank" element={<Blank />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />
          </Route>
        </Route>
        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
export default App;

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

// Import các trang
import Home from "./layouts/Home";
import Login from "./pages/SignInPage";
import SignUp from "./pages/SignUpPage";

// Import các thành phần dùng chung
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import NotFound from "./pages/OtherPage/NotFound";
import SignIn from "./pages/AuthPages/SignIn";
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
function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* CHỈ DÙNG 1 THẺ ROUTES DUY NHẤT
       */}
      <Routes>
        {/* --- NHÓM 1: TRANG DÀNH CHO KHÁCH (Có Header/Footer khách) --- */}
        <Route
          element={
            <>
              <Header />
              <Outlet /> {/* Nơi hiển thị Home, Login, Signup */}
              <Footer />
            </>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
        </Route>

        {/* --- NHÓM 2: TRANG DASHBOARD ADMIN --- */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          {/* Đặt path="/admin" ở AppLayout */}
          <Route path="/admin" element={<AppLayout />}>
            <Route index element={<Blank />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="profile" element={<UserProfiles />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="form-elements" element={<FormElements />} />
            <Route path="basic-tables" element={<BasicTables />} />
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

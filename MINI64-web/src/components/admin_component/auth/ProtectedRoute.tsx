import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRole }: { allowedRole: string }) => {
  const savedUserData = localStorage.getItem("user_info");
  const token = localStorage.getItem("access_token");

  // ĐOẠN NÀY ĐỂ CHECK XEM CÓ DATA KHÔNG
  console.log("--- BẮT ĐẦU CHECK BẢO VỆ ---");
  console.log("Dữ liệu trong máy:", savedUserData);

  if (!token || !savedUserData || token === "undefined") {
    console.error("Bị đá vì không có Token hoặc UserInfo!");
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(savedUserData);
    const userRole = user.role?.toString().trim().toLowerCase();
    const requiredRole = allowedRole.toLowerCase();

    console.log("Role của Huy:", userRole);
    console.log("Role yêu cầu:", requiredRole);

    if (userRole !== requiredRole) {
      console.warn("SAI ROLE! ĐANG ĐUỔI VỀ TRANG CHỦ.");
      return <Navigate to="/" replace />;
    }

    console.log("✅ OK! CHO VÀO ADMIN.");
    return <Outlet />;
  } catch (error) {
    console.error("Lỗi đọc dữ liệu JSON:", error);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;

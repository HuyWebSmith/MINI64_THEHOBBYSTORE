import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const navigate = useNavigate(); // Đã khai báo
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Giả lập logic check admin
    if (email && password) {
      console.log("Huy đang login với:", email);
      // ✅ Sửa lỗi 'unused': Gọi navigate ở đây!
      navigate("/admin");
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500">
          {/* ✅ Sửa lỗi className: Bọc icon lại nếu Icon không nhận class */}
          <span className="size-5">
            <ChevronLeftIcon />
          </span>
          Back to Home
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label>
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              placeholder="info@gmail.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
          </div>

          <div>
            <Label>
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {/* ✅ Sửa lỗi className cho EyeIcon */}
                <span className="size-5">
                  {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                </span>
              </span>
            </div>
          </div>

          {/* ✅ Tạm thời xóa type="submit" nếu Button.tsx chưa hỗ trợ property này */}
          <Button className="w-full" size="sm">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}

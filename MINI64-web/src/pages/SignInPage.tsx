import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react"; // Fix lỗi Verbatim
import { Link } from "react-router-dom";
import axios, { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { GoogleLogin } from "@react-oauth/google";
const apiUrl = import.meta.env.VITE_API_URL;
const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { setUser } = useContext(UserContext);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/api/auth/sign-in`, formData);
      if (res.status === 200) {
        localStorage.setItem("access_token", res.data.access_token);

        localStorage.setItem("user_info", JSON.stringify(res.data.data));
        setUser(res.data.data);
        const userRole = res.data.data.role;
        if (userRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential?: string) => {
    if (!credential) {
      setError("Google login không hợp lệ. Vui lòng thử lại.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${apiUrl}/api/auth/google`, {
        credential,
      });

      if (res.status === 200) {
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("user_info", JSON.stringify(res.data.data));
        setUser(res.data.data);
        const userRole = res.data.data.role;
        if (userRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Google login failed");
      } else {
        setError("Google login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 text-red-500 text-center text-sm">{error}</div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                onChange={handleChange}
                className="mt-1 appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {googleClientId ? (
            <>
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  hoặc
                </span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(credentialResponse) =>
                    handleGoogleLogin(credentialResponse.credential)
                  }
                  onError={() => setError("Google login không thành công.")}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SignInPage;

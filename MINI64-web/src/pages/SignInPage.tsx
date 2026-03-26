import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react"; // Fix lỗi Verbatim
import { Link } from "react-router-dom";
import axios, { isAxiosError } from "axios";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
=======
>>>>>>> 4c3c65fe9bc37a04c538a71bdce2c0d9b15f67d7
const apiUrl = import.meta.env.VITE_API_URL;
const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
<<<<<<< HEAD
  const navigate = useNavigate();
=======

>>>>>>> 4c3c65fe9bc37a04c538a71bdce2c0d9b15f67d7
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
<<<<<<< HEAD
      const res = await axios.post(`${apiUrl}/api/auth/sign-in`, formData);
=======
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/sign-in`,
        formData,
      );
>>>>>>> 4c3c65fe9bc37a04c538a71bdce2c0d9b15f67d7
      if (res.status === 200) {
        localStorage.setItem("access_token", res.data.access_token);

        localStorage.setItem("user_info", JSON.stringify(res.data.data));
<<<<<<< HEAD
        const userRole = res.data.data.role;
        if (userRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
=======

        window.location.href = "/";
>>>>>>> 4c3c65fe9bc37a04c538a71bdce2c0d9b15f67d7
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
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
        </div>
      </div>
    </div>
  );
};

export default SignInPage;

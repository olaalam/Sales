import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setUser } from "../../Store/authSlice";
import { loginAuth } from "../../Auth/Login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const localUser = localStorage.getItem("user");
    if (localUser) {
      toast.info("You are already logged in");
      navigate("/users", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      toast.error("Email/Username and password are required");
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginAuth(emailOrUsername, password);
      const userWithRoles = {
        ...data.admin,
        token: data.data.token,
      };
      toast.success(data.message || "Login successful");
      dispatch(setUser(userWithRoles));
      localStorage.setItem("token", data.data.token);

      const redirectTo = new URLSearchParams(location.search).get("redirect");
      navigate(redirectTo || '/');
    } catch (error) {
      const msg = error?.response?.data?.message || "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-100 to-blue-100 !p-4">
      <Card className="w-full max-w-md shadow-lg border-none bg-white/90 backdrop-blur-sm">
        <CardContent className="!p-8">
          <div className="text-center !mb-8">
            <h2 className="text-3xl font-bold text-teal-800">Welcome Back</h2>
            <p className="text-sm text-gray-600 !mt-2">Log in to your account</p>
          </div>
          <form onSubmit={handleLogin} className="!space-y-6">
            <div>
              <Input
                type="text"
                placeholder="Email or Username"
                className="w-full !ps-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                className="w-full !ps-2 rounded-lg border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold !py-3 transition-all duration-200 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 !mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </Button>
          </form>

        </CardContent>
      </Card>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;
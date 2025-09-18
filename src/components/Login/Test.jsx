import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Test = ({ setRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const users = [
      { email: "super@gmail.com", password: "1", role: "leader" },
      { email: "2@gmail.com", password: "2", role: "seller" },
    ];

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      setRole(user.role);
      toast.success("✅ Login successful!");
      if (user.role === "leader") navigate("/leader/overview");
      if (user.role === "seller") navigate("/seller/overview");
    } else {
      toast.error("❌ Invalid email or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-one px-4">
      <form
        onSubmit={handleLogin}
        className="bg-seven p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md border border-eight transition-all duration-300 hover:shadow-white/30"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
          Login
        </h1>
        <p className="text-gray-400 text-center text-xs sm:text-sm mt-2 mb-6 sm:mb-8">
          Enter your credentials to login to your account
        </p>

        <label className="block text-gray-300 text-sm mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-seven text-white rounded-full py-3 px-4 mb-4 outline-none border border-gray-600 focus:border-green-500 transition-all"
        />

        <label className="block text-gray-300 text-sm mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-seven text-white rounded-full py-3 px-4 mb-6 outline-none border border-gray-600 focus:border-green-500 transition-all"
        />

        <button
          type="submit"
          className="w-full bg-white text-gray-900 font-bold py-3 rounded-full shadow hover:bg-gray-200 transition-all"
        >
          Login
        </button>
      </form>

      {/* Toast container */}
      <ToastContainer />
    </div>
  );
};

export default Test;
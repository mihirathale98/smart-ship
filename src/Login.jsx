import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      localStorage.setItem("isLoggedIn", "true");
      navigate("/dashboard");
    } else {
      setError("Please enter both email and password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Login</h2>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          Log In
        </button>
      </form>
    </div>
  );
}

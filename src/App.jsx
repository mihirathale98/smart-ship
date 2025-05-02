import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CreateShipmentForm from "./CreateShipmentForm";
import Dashboard from "./Dashboard";
import Login from "./Login";
import './App.css';

function RequireAuth({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const location = useLocation();
  if (!isLoggedIn) {
    // Allow access to /login, redirect all else
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
  }
  // If logged in and on /login, redirect to /dashboard
  if (isLoggedIn && location.pathname === "/login") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <RequireAuth>
            <Login />
          </RequireAuth>
        } />
        <Route path="/dashboard" element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } />
        <Route path="/create" element={
          <RequireAuth>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <CreateShipmentForm />
            </div>
          </RequireAuth>
        } />
        {/* Redirect all other routes to /dashboard if logged in, else /login */}
        <Route path="*" element={<RequireAuth><Navigate to="/dashboard" replace /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

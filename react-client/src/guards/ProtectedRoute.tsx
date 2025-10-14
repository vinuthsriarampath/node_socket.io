import { Navigate, Outlet } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAuth } from "../services/AuthService";

export default function ProtectedRoute() {
  const { isLoggedIn, initializing } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (initializing) return;
      const res = await isLoggedIn();
      setIsAuthenticated(res);
    };
    checkAuthentication();
  }, [initializing, isLoggedIn]);

  if (initializing || isAuthenticated === null) {
    return <div>Loading...</div>; // Or a more styled loading spinner/component
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
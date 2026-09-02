/**
 * ProtectedRoute — wraps pages that require authentication.
 *
 * If the user isn't logged in, redirect to /login.
 * If they are, render the child component.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

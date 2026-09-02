/**
 * App — the root component.
 *
 * Sets up routing:
 * - /login, /register — public pages
 * - /, /analyze, /cv, /tailor/:id — protected pages (require auth)
 *
 * AuthProvider wraps everything so any component can use useAuth().
 * Sidebar layout wraps protected pages.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BoardPage from "./pages/BoardPage";
import AnalyzePage from "./pages/AnalyzePage";
import MyCVPage from "./pages/MyCVPage";
import TailorPage from "./pages/TailorPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes with sidebar layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="app-main">
                    <BoardPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="app-main">
                    <AnalyzePage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cv"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="app-main">
                    <MyCVPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tailor/:id"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="app-main">
                    <TailorPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/new"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="app-main">
                    <ApplicationFormPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

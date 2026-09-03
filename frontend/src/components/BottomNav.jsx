/**
 * BottomNav — fixed bottom navigation bar using LimelightNav.
 *
 * Replaces the left sidebar. Maps app routes to nav items and
 * syncs the active tab with the current URL.
 */

import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Search, PlusCircle, FileText, LogOut } from "lucide-react";
import { LimelightNav } from "./ui/limelight-nav";

const ROUTES = ["/", "/analyze", "/applications/new", "/cv"];

export default function BottomNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active index from current path
  const activeIndex = (() => {
    const idx = ROUTES.indexOf(location.pathname);
    return idx >= 0 ? idx : 0;
  })();

  const navItems = [
    { id: "board", icon: <Home />, label: "Applications Board", onClick: () => navigate("/") },
    { id: "analyze", icon: <Search />, label: "Analyze Job Description", onClick: () => navigate("/analyze") },
    { id: "new", icon: <PlusCircle />, label: "Add Application", onClick: () => navigate("/applications/new") },
    { id: "cv", icon: <FileText />, label: "My CV", onClick: () => navigate("/cv") },
    { id: "logout", icon: <LogOut />, label: "Sign Out", onClick: logout },
  ];

  return (
    <div className="bottomnav-container">
      <LimelightNav
        items={navItems}
        activeIndex={activeIndex}
        className="bottomnav-bar"
      />
    </div>
  );
}

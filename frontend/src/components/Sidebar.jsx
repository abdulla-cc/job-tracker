/**
 * Sidebar — dark navigation panel on the left.
 *
 * Matches the Stitch mockup: dark bg, brown active state, icon + label nav items.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/", label: "Board", icon: "📋" },
  { to: "/analyze", label: "Analyze JD", icon: "🔍" },
  { to: "/cv", label: "My CV", icon: "📄" },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🏠</span>
          <div>
            <div className="sidebar-logo-text">JobTracker</div>
            <div className="sidebar-logo-subtitle">Career Manager</div>
          </div>
        </div>
      </div>

      <button className="sidebar-new-btn" onClick={() => navigate("/applications/new")}>+ New Application</button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">A</div>
          <div>
            <div className="sidebar-user-name">Abdullah</div>
            <div className="sidebar-user-role">Free Plan</div>
          </div>
        </div>
        <button className="sidebar-settings-btn" onClick={logout} title="Log out">
          ⚙️
        </button>
      </div>
    </aside>
  );
}

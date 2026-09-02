/**
 * ApplicationCard — one card in a kanban column.
 *
 * Shows company, role, date, status badge, and a "Tailor CV" button.
 * Clicking "Tailor CV" navigates to the tailor page with the application ID.
 */

import { useNavigate } from "react-router-dom";
import "./ApplicationCard.css";

const STATUS_LABELS = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export default function ApplicationCard({ application }) {
  const navigate = useNavigate();
  const { id, company, role, status, date_applied } = application;

  const formattedDate = new Date(date_applied).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="application-card">
      <div className="card-header">
        <div>
          <div className="card-company">{company}</div>
          <div className="card-role">{role}</div>
        </div>
        <button className="card-menu-btn" title="More options">⋯</button>
      </div>

      <div className="card-meta">
        <span className="card-date">📅 {formattedDate}</span>
        <span className={`badge badge-${status}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      <button
        className="card-tailor-btn"
        onClick={() => navigate(`/tailor/${id}`)}
      >
        ✨ Tailor CV
      </button>
    </div>
  );
}

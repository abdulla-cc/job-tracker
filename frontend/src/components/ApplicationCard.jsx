/**
 * ApplicationCard — one card in a kanban column.
 *
 * Shows company, role, date, status badge, and a "Tailor CV" button.
 * Clicking "Tailor CV" navigates to the tailor page with the application ID.
 */

import { useNavigate } from "react-router-dom";
import { Button as MovingBorderCard } from "@/components/ui/moving-border";
import "./ApplicationCard.css";

const STATUS_LABELS = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_BEAM_COLORS = {
  applied: "bg-[radial-gradient(#8B5E3C_45%,transparent_70%)]",
  interviewing: "bg-[radial-gradient(#8B5E3C_60%,transparent_70%)]",
  offer: "bg-[radial-gradient(#4CAF50_60%,transparent_70%)]",
  rejected: "bg-[radial-gradient(#999999_35%,transparent_70%)]",
};

export default function ApplicationCard({ application }) {
  const navigate = useNavigate();
  const { id, company, role, status, date_applied } = application;

  const formattedDate = new Date(date_applied).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <MovingBorderCard
      as="div"
      borderRadius="0.75rem"
      duration={3600}
      borderClassName={STATUS_BEAM_COLORS[status] || STATUS_BEAM_COLORS.applied}
      containerClassName="application-card-wrapper w-full"
      className="application-card"
    >
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
    </MovingBorderCard>
  );
}

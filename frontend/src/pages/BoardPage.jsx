/**
 * BoardPage — the main kanban board with 4 status columns.
 *
 * Fetches applications on mount, groups them by status,
 * and renders a StatusColumn for each.
 */

import { useState, useEffect } from "react";
import { api } from "../api/client";
import ApplicationCard from "../components/ApplicationCard";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import "./BoardPage.css";

const COLUMNS = [
  { status: "applied", label: "Applied", dot: "🟤" },
  { status: "interviewing", label: "Interviewing", dot: "🟤" },
  { status: "offer", label: "Offer", dot: "🟢" },
  { status: "rejected", label: "Rejected", dot: "⚫" },
];

export default function BoardPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await api("/applications");
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group applications by status
  const grouped = {};
  COLUMNS.forEach((col) => {
    grouped[col.status] = applications.filter((app) => app.status === col.status);
  });

  const totalApplied = applications.length;
  const interviewingCount = applications.filter((app) => app.status === "interviewing").length;
  const offerCount = applications.filter((app) => app.status === "offer").length;
  const offerRate = totalApplied > 0 ? Math.round((offerCount / totalApplied) * 100) : 0;
  const tailoredReady = applications.filter((app) => Boolean(app.job_description)).length;

  if (loading) {
    return (
      <div className="board-page">
        <div className="board-loading">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="board-page">
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.25}
        duration={3.5}
        repeatDelay={1}
        className="[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] stroke-[#8B5E3C]/12 fill-[#8B5E3C]/15"
      />

      <div className="board-header">
        <div>
          <h1 className="board-title">My Pipeline</h1>
          <p className="board-subtitle">Manage and track your active job applications.</p>
        </div>
      </div>

      {error && <div className="board-error">{error}</div>}

      <div className="board-columns">
        {COLUMNS.map((col) => (
          <div key={col.status} className="board-column">
            <div className="column-header">
              <span className="column-dot">{col.dot}</span>
              <span className="column-label">{col.label}</span>
              <span className="column-count">{grouped[col.status].length}</span>
            </div>

            <div className="column-cards">
              {grouped[col.status].length === 0 ? (
                <div className="column-empty">No applications</div>
              ) : (
                grouped[col.status].map((app) => (
                  <ApplicationCard key={app.id} application={app} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

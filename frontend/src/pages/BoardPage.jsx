/**
 * BoardPage — the main kanban board with 4 status columns.
 *
 * Fetches applications on mount, groups them by status,
 * and renders a StatusColumn for each.
 */

import { useState, useEffect } from "react";
import { api } from "../api/client";
import ApplicationCard from "../components/ApplicationCard";
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

  if (loading) {
    return (
      <div className="board-page">
        <div className="board-loading">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="board-page">
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

import { useNavigate } from "react-router-dom";
import { Briefcase, Plus, Search, Sparkles } from "lucide-react";
import "./EmptyPipelineHero.css";

export default function EmptyPipelineHero() {
  const navigate = useNavigate();

  return (
    <div className="empty-hero-container">
      <div className="empty-hero-card">
        {/* Top Icon Badge */}
        <div className="empty-hero-icon-wrapper">
          <Briefcase className="empty-hero-icon" size={32} />
        </div>

        {/* Text Content */}
        <h2 className="empty-hero-title">Your pipeline is empty</h2>
        <p className="empty-hero-subtitle">
          Start tracking your job search by adding your first application or analyzing a job posting with AI.
        </p>

        {/* Action Buttons */}
        <div className="empty-hero-actions">
          <button
            className="empty-hero-btn primary"
            onClick={() => navigate("/applications/new")}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Application</span>
          </button>

          <button
            className="empty-hero-btn secondary"
            onClick={() => navigate("/analyze")}
          >
            <Search size={17} strokeWidth={2} />
            <span>Analyze a Job Description</span>
          </button>
        </div>

        {/* AI Tip Callout */}
        <div className="empty-hero-tip">
          <Sparkles size={16} className="empty-hero-tip-icon" />
          <p className="empty-hero-tip-text">
            <strong>Tip:</strong> Paste any job posting and our AI will extract requirements and tailor your CV.
          </p>
        </div>
      </div>
    </div>
  );
}


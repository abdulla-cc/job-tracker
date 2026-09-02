/**
 * TailorPage — tailors your CV to a specific job application.
 *
 * Loads the application (to get the JD), then calls POST /tailor-cv.
 * Shows the tailored result: summary, reordered skills, rewritten bullets.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import "./TailorPage.css";

export default function TailorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const data = await api(`/applications/${id}`);
      setApplication(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async () => {
    if (!application.job_description) {
      setError("No job description saved for this application. Edit the application to add one first.");
      return;
    }

    setTailoring(true);
    setError(null);

    try {
      const data = await api("/tailor-cv", {
        method: "POST",
        body: JSON.stringify({ job_description: application.job_description }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setTailoring(false);
    }
  };

  if (loading) {
    return (
      <div className="tailor-page">
        <div className="tailor-loading">Loading application...</div>
      </div>
    );
  }

  return (
    <div className="tailor-page">
      <div className="tailor-header">
        <button className="btn btn-outline" onClick={() => navigate("/")}>
          ← Back to Board
        </button>
        <h1 className="tailor-title">
          Tailor CV for {application?.company || "Application"}
        </h1>
        {application && (
          <p className="tailor-subtitle">{application.role}</p>
        )}
      </div>

      {error && <div className="tailor-error">{error}</div>}

      {!result && !tailoring && (
        <div className="tailor-action">
          <p className="tailor-desc">
            {application?.job_description
              ? "Click below to generate a tailored version of your CV for this role."
              : "No job description saved for this application. Edit it to add one."}
          </p>
          <button
            className="btn btn-primary"
            onClick={handleTailor}
            disabled={!application?.job_description}
          >
            ✨ Generate Tailored CV
          </button>
        </div>
      )}

      {tailoring && (
        <div className="tailor-loading">
          <p>Tailoring your CV...</p>
          <p className="tailor-loading-sub">The AI is rewriting your bullets to match this role.</p>
        </div>
      )}

      {result && (
        <div className="tailor-result">
          <div className="result-section">
            <h3 className="result-label">Summary</h3>
            <p className="result-text">{result.summary}</p>
          </div>

          <div className="result-section">
            <h3 className="result-label">Skills (reordered)</h3>
            <div className="tag-list">
              {result.skills.map((skill, i) => (
                <span key={i} className="tag tag-primary">{skill}</span>
              ))}
            </div>
          </div>

          <div className="result-section">
            <h3 className="result-label">Experience (tailored)</h3>
            {result.experience.map((exp, i) => (
              <div key={i} className="tailor-exp-item">
                <div className="tailor-exp-header">
                  <strong>{exp.title}</strong> at {exp.company}
                </div>
                <ul className="tailor-bullets">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="result-section">
            <h3 className="result-label">Projects (tailored)</h3>
            {result.projects.map((proj, i) => (
              <div key={i} className="tailor-exp-item">
                <div className="tailor-exp-header">
                  <strong>{proj.name}</strong>
                  {proj.description && ` — ${proj.description}`}
                </div>
                <ul className="tailor-bullets">
                  {proj.bullets.map((bullet, j) => (
                    <li key={j}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

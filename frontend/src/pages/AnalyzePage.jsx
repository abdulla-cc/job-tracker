/**
 * AnalyzePage — paste a job description, get AI analysis.
 *
 * Two-column layout: textarea on left, results on right.
 * Calls POST /analyze with the JD text.
 */

import { useState } from "react";
import { api } from "../api/client";
import "./AnalyzePage.css";

export default function AnalyzePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (jobDescription.length < 20) {
      setError("Job description must be at least 20 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api("/analyze", {
        method: "POST",
        body: JSON.stringify({ job_description: jobDescription }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyze-page">
      <div className="analyze-header">
        <h1 className="analyze-title">Analyze Job Description</h1>
        <p className="analyze-subtitle">
          Paste a job posting to see how well you fit and what to emphasize.
        </p>
      </div>

      <div className="analyze-content">
        <div className="analyze-input-panel">
          <label className="label">Job Description</label>
          <textarea
            className="input analyze-textarea"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <button
            className="btn btn-primary analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || jobDescription.length < 20}
          >
            {loading ? "Analyzing..." : "🔍 Analyze"}
          </button>
        </div>

        <div className="analyze-results-panel">
          {error && <div className="analyze-error">{error}</div>}

          {!result && !error && !loading && (
            <div className="analyze-empty">
              <p>Paste a job description and click Analyze to see results.</p>
            </div>
          )}

          {result && (
            <>
              <div className="result-section">
                <h3 className="result-label">Fit Score</h3>
                <div className={`fit-score ${getFitClass(result.fit_score)}`}>
                  {result.fit_score}%
                </div>
              </div>

              <div className="result-section">
                <h3 className="result-label">Requirements</h3>
                <div className="tag-list">
                  {result.requirements.map((req, i) => (
                    <span key={i} className="tag tag-primary">{req}</span>
                  ))}
                </div>
              </div>

              <div className="result-section">
                <h3 className="result-label">Nice to Haves</h3>
                <div className="tag-list">
                  {result.nice_to_haves.map((item, i) => (
                    <span key={i} className="tag tag-secondary">{item}</span>
                  ))}
                </div>
              </div>

              <div className="result-section">
                <h3 className="result-label">Why This Score</h3>
                <p className="result-text">{result.fit_reasoning}</p>
              </div>

              <div className="result-section">
                <h3 className="result-label">Emphasize in Your CV</h3>
                <ul className="result-list">
                  {result.emphasize.map((item, i) => (
                    <li key={i}>✨ {item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getFitClass(score) {
  if (score >= 70) return "fit-good";
  if (score >= 40) return "fit-medium";
  return "fit-low";
}

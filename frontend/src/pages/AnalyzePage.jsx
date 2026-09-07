/**
 * AnalyzePage — paste a job description, get AI analysis.
 *
 * Two-column layout: textarea on left, results on right.
 * Calls POST /analyze with the JD text.
 */

import { useState } from "react";
import { api } from "../api/client";
import { AIAssistantCard } from "@/components/ui/ai-assistant-card";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { Target, Sparkles, CheckCircle2, ListChecks } from "lucide-react";
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
      <AnimatedGridPattern
        numSquares={35}
        maxOpacity={0.2}
        duration={3.5}
        repeatDelay={1}
        className="[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] stroke-[#8B5E3C]/12 fill-[#8B5E3C]/15"
      />

      <div className="analyze-header">
        <h1 className="analyze-title">Analyze Job Description</h1>
        <p className="analyze-subtitle">
          Paste a job posting to see how well you fit and what to emphasize.
        </p>
      </div>

      <div className="analyze-content">
        <AIAssistantCard
          value={jobDescription}
          onChange={setJobDescription}
          onAnalyze={handleAnalyze}
          loading={loading}
        />

        <div className="analyze-results-panel">
          {error && <div className="analyze-error">{error}</div>}

          {loading && (
            <div className="analyze-loading-state">
              <div className="analyze-spinner" />
              <p className="analyze-loading-title">Analyzing Job Description...</p>
              <p className="analyze-loading-subtitle">
                Extracting core requirements and scoring fit via Llama 3.1
              </p>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="analyze-empty-preview">
              <div className="preview-header">
                <span className="preview-badge">AI Analysis Output</span>
                <h3 className="preview-title">What You'll Receive</h3>
                <p className="preview-subtitle">
                  Our AI evaluates the job posting to generate clear, actionable guidance:
                </p>
              </div>

              <div className="preview-cards">
                <div className="preview-card">
                  <div className="preview-card-icon">
                    <Target size={18} />
                  </div>
                  <div>
                    <h4 className="preview-card-title">Match Fit Score</h4>
                    <p className="preview-card-desc">
                      An objective rating showing how closely your profile fits the role.
                    </p>
                  </div>
                </div>

                <div className="preview-card">
                  <div className="preview-card-icon">
                    <ListChecks size={18} />
                  </div>
                  <div>
                    <h4 className="preview-card-title">Extracted Requirements</h4>
                    <p className="preview-card-desc">
                      Must-have qualifications cleanly separated from nice-to-have bonuses.
                    </p>
                  </div>
                </div>

                <div className="preview-card">
                  <div className="preview-card-icon">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="preview-card-title">CV Tailoring Tips</h4>
                    <p className="preview-card-desc">
                      Specific skills, terminology, and keywords to highlight in your CV.
                    </p>
                  </div>
                </div>
              </div>
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

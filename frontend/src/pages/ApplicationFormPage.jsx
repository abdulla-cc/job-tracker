/**
 * ApplicationFormPage — add a new job application.
 *
 * Form fields: company, role, status, date_applied, job_link, notes, job_description.
 * POST /applications on submit, then redirect to board.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import ApplicationCard from "../components/ApplicationCard";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { Eye, Sparkles, Building2, Briefcase, ExternalLink, Calendar, Lightbulb, Clock, UserCheck } from "lucide-react";
import "./ApplicationFormPage.css";

export default function ApplicationFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "applied",
    date_applied: "",
    job_link: "",
    notes: "",
    job_description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and Role are required");
      return;
    }

    setSaving(true);
    try {
      await api("/applications", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          date_applied: form.date_applied || undefined,
          job_link: form.job_link || undefined,
          notes: form.notes || undefined,
          job_description: form.job_description || undefined,
        }),
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewData = {
    id: 0,
    company: form.company.trim() || "Acme Corp",
    role: form.role.trim() || "Senior Software Engineer",
    status: form.status,
    date_applied: form.date_applied || new Date().toISOString().split("T")[0],
  };

  return (
    <div className="form-page">
      <AnimatedGridPattern
        numSquares={35}
        maxOpacity={0.2}
        duration={3.5}
        repeatDelay={1}
        className="[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] stroke-[#8B5E3C]/12 fill-[#8B5E3C]/15"
      />

      <div className="form-page-header">
        <button className="btn btn-outline" onClick={() => navigate("/")}>
          ← Back to Board
        </button>
        <h1 className="form-page-title">New Application</h1>
        <p className="form-page-subtitle">Add a job application to your pipeline.</p>
      </div>

      {error && <div className="form-page-error">{error}</div>}

      <div className="form-page-layout">
        {/* Left Side: Form */}
        <form className="application-form" onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label className="label">Company *</label>
              <input
                className="input"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="e.g. Google"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Role *</label>
              <input
                className="input"
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                placeholder="e.g. Backend Engineer"
                required
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Date Applied</label>
              <input
                className="input"
                type="date"
                value={form.date_applied}
                onChange={(e) => handleChange("date_applied", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Job Link</label>
              <input
                className="input"
                type="url"
                value={form.job_link}
                onChange={(e) => handleChange("job_link", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Job Description</label>
            <textarea
              className="input"
              value={form.job_description}
              onChange={(e) => handleChange("job_description", e.target.value)}
              placeholder="Paste the full job description here. This is used by the AI to tailor your CV."
              rows={8}
            />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              className="input"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any notes about this application..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Application"}
            </button>
          </div>
        </form>

        {/* Right Side: Live Card Preview & Application Checklist */}
        <div className="preview-sidebar">
          <div className="preview-panel">
            <div className="preview-panel-header">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#8B5E3C]" />
                <span className="preview-panel-title">Live Board Preview</span>
              </div>
              <span className="preview-live-badge">Real-time</span>
            </div>

            <p className="preview-panel-subtitle">
              How this application will appear as a card inside your Kanban pipeline:
            </p>

            <div className="preview-card-wrapper">
              <ApplicationCard application={previewData} isPreview={true} />
            </div>

            {/* AI Tailoring Readiness Status Box */}
            <div className="preview-features-box">
              <div className="preview-feature-item">
                <div
                  className={`preview-feature-dot ${
                    form.job_description.trim() ? "active" : ""
                  }`}
                />
                <div className="preview-feature-content">
                  <span className="preview-feature-name">AI CV Tailoring</span>
                  <p className="preview-feature-desc">
                    {form.job_description.trim()
                      ? `Job description detected (${form.job_description.length} chars) — ready to tailor with Groq AI!`
                      : "Paste a job description to unlock AI tailoring for your CV."}
                  </p>
                </div>
              </div>

              {form.job_link.trim() && (
                <div className="preview-feature-item">
                  <div className="preview-feature-dot active" />
                  <div className="preview-feature-content">
                    <span className="preview-feature-name">Direct Job Posting</span>
                    <p className="preview-feature-desc truncate max-w-[260px]">
                      {form.job_link}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Checklist & Tips Card to balance heights */}
          <div className="preview-checklist-card">
            <div className="checklist-card-header">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#8B5E3C]" />
                <span className="checklist-card-title">Application Checklist</span>
              </div>
              <span className="checklist-badge">Pro Tips</span>
            </div>

            <ul className="checklist-list">
              <li className="checklist-item">
                <div className="checklist-icon-box">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5E3C]" />
                </div>
                <div>
                  <span className="checklist-item-title">Tailor Before Applying</span>
                  <p className="checklist-item-desc">
                    Run this JD through our AI Tailor tool to match key resume bullet points.
                  </p>
                </div>
              </li>

              <li className="checklist-item">
                <div className="checklist-icon-box">
                  <Clock className="w-3.5 h-3.5 text-[#8B5E3C]" />
                </div>
                <div>
                  <span className="checklist-item-title">7-Day Follow-Up</span>
                  <p className="checklist-item-desc">
                    Set a calendar nudge to check back if you don't receive an update in a week.
                  </p>
                </div>
              </li>

              <li className="checklist-item">
                <div className="checklist-icon-box">
                  <UserCheck className="w-3.5 h-3.5 text-[#8B5E3C]" />
                </div>
                <div>
                  <span className="checklist-item-title">Log Recruiter Contacts</span>
                  <p className="checklist-item-desc">
                    Store interviewer names and referral notes in the Notes field for easy recall.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

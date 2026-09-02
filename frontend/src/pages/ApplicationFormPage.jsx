/**
 * ApplicationFormPage — add a new job application.
 *
 * Form fields: company, role, status, date_applied, job_link, notes, job_description.
 * POST /applications on submit, then redirect to board.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
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

  return (
    <div className="form-page">
      <div className="form-page-header">
        <button className="btn btn-outline" onClick={() => navigate("/")}>
          ← Back to Board
        </button>
        <h1 className="form-page-title">New Application</h1>
        <p className="form-page-subtitle">Add a job application to your pipeline.</p>
      </div>

      {error && <div className="form-page-error">{error}</div>}

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
    </div>
  );
}

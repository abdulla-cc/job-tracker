/**
 * MyCVPage — save/edit your base CV.
 *
 * Form with fields for: full name, email, phone, education (JSON),
 * skills (JSON), experience (JSON), projects (JSON).
 * GET /cv to load, POST /cv to save (upsert).
 */

import { useState, useEffect } from "react";
import { api } from "../api/client";
import "./MyCVPage.css";

const EMPTY_CV = {
  full_name: "",
  email: "",
  phone: "",
  education: '[{"school": "", "degree": "", "dates": ""}]',
  skills: '["Python", "FastAPI"]',
  experience: '[{"title": "", "company": "", "bullets": [""]}]',
  projects: '[{"name": "", "description": "", "bullets": [""]}]',
};

export default function MyCVPage() {
  const [cv, setCv] = useState(EMPTY_CV);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadCV();
  }, []);

  const loadCV = async () => {
    try {
      const data = await api("/cv");
      setCv({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || "",
        education: data.education,
        skills: data.skills,
        experience: data.experience,
        projects: data.projects,
      });
    } catch (err) {
      if (err.status !== 404) {
        setMessage({ type: "error", text: err.message });
      }
      // 404 means no CV yet — show empty form
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api("/cv", {
        method: "POST",
        body: JSON.stringify(cv),
      });
      setMessage({ type: "success", text: "CV saved successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setCv({ ...cv, [field]: value });
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="cv-page">
        <div className="cv-loading">Loading your CV...</div>
      </div>
    );
  }

  return (
    <div className="cv-page">
      <div className="cv-header">
        <div>
          <h1 className="cv-title">My CV</h1>
          <p className="cv-subtitle">
            Save your base CV. The AI will use this to create tailored versions for each job.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "💾 Save CV"}
        </button>
      </div>

      {message && (
        <div className={`cv-message cv-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="cv-form">
        <div className="cv-form-row">
          <div className="form-group">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={cv.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={cv.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input
              className="input"
              value={cv.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+60123456789"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Skills (JSON array)</label>
          <textarea
            className="input"
            value={cv.skills}
            onChange={(e) => handleChange("skills", e.target.value)}
            placeholder='["Python", "FastAPI", "SQL"]'
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="label">Education (JSON array)</label>
          <textarea
            className="input"
            value={cv.education}
            onChange={(e) => handleChange("education", e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="label">Experience (JSON array)</label>
          <textarea
            className="input"
            value={cv.experience}
            onChange={(e) => handleChange("experience", e.target.value)}
            rows={5}
          />
        </div>

        <div className="form-group">
          <label className="label">Projects (JSON array)</label>
          <textarea
            className="input"
            value={cv.projects}
            onChange={(e) => handleChange("projects", e.target.value)}
            rows={5}
          />
        </div>
      </div>
    </div>
  );
}

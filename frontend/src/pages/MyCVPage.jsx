/**
 * MyCVPage — structured master CV profile builder.
 *
 * Saves base CV used by AI for job description matching and resume tailoring.
 * GET /cv to load, POST /cv to save (upsert).
 */

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Wrench,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Plus,
  Trash2,
  X,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import { api } from "../api/client";
import "./MyCVPage.css";

const EMPTY_STRUCTURED_CV = {
  full_name: "",
  email: "",
  phone: "",
  skills: ["Python", "FastAPI"],
  education: [{ school: "", degree: "", dates: "" }],
  experience: [{ title: "", company: "", bullets: [""] }],
  projects: [{ name: "", description: "", bullets: [""] }],
};

const SAMPLE_PROFILE = {
  full_name: "Abdullah",
  email: "abdullah@example.com",
  phone: "+60123456789",
  skills: [
    "Python",
    "FastAPI",
    "SQLModel",
    "SQLite",
    "Docker",
    "Git",
    "React 19",
    "Tailwind CSS",
    "Pytest",
    "Groq AI",
    "REST APIs"
  ],
  education: [
    {
      school: "Multimedia University (MMU)",
      degree: "BSc (Hons) Computer Science (Artificial Intelligence)",
      dates: "2023 – 2027"
    }
  ],
  experience: [
    {
      title: "Full-Stack AI Developer",
      company: "Job Application Tracker",
      bullets: [
        "Engineered an automated job tracker with FastAPI, SQLite, and SQLModel with 53 passing automated tests",
        "Integrated Groq Llama 3.1 70B inference engine for real-time JD parsing and CV tailoring",
        "Crafted a responsive React 19 Kanban board frontend styled with Tailwind CSS v4 and Framer Motion"
      ]
    }
  ],
  projects: [
    {
      name: "Agentic Research Assistant",
      description: "Autonomous multi-agent research pipeline",
      bullets: [
        "Implemented arXiv paper retrieval and RAG synthesis with custom prompt workflows",
        "Streamed real-time AI responses to frontend client with sub-second latency"
      ]
    }
  ]
};

const POPULAR_SKILLS = [
  "Python",
  "FastAPI",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "SQL",
  "Docker",
  "Git",
  "Machine Learning",
  "PyTorch"
];

const parseJsonSafely = (str, fallback) => {
  if (!str) return fallback;
  try {
    const parsed = typeof str === "string" ? JSON.parse(str) : str;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch (err) {
    console.warn("Could not parse JSON field:", err);
    return fallback;
  }
};

export default function MyCVPage() {
  const [cv, setCv] = useState(EMPTY_STRUCTURED_CV);
  const [skillInput, setSkillInput] = useState("");
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
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        skills: parseJsonSafely(data.skills, ["Python", "FastAPI"]),
        education: parseJsonSafely(data.education, [{ school: "", degree: "", dates: "" }]),
        experience: parseJsonSafely(data.experience, [{ title: "", company: "", bullets: [""] }]),
        projects: parseJsonSafely(data.projects, [{ name: "", description: "", bullets: [""] }]),
      });
    } catch (err) {
      if (err.status !== 404) {
        setMessage({ type: "error", text: err.message });
      }
      // 404 means no CV yet — empty template remains
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setCv(SAMPLE_PROFILE);
    setMessage({
      type: "success",
      text: "Sample CV profile loaded! Click 'Save Master CV' when ready to store it."
    });
  };

  const handleSave = async () => {
    if (!cv.full_name.trim()) {
      setMessage({ type: "error", text: "Please provide your Full Name." });
      return;
    }
    if (!cv.email.trim()) {
      setMessage({ type: "error", text: "Please provide your Email address." });
      return;
    }

    setSaving(true);
    setMessage(null);

    // Prepare payload with valid JSON strings satisfying backend minimum length checks
    const cleanedSkills = cv.skills.length > 0 ? cv.skills : ["General"];
    const cleanedEducation = cv.education.length > 0 ? cv.education : [{ school: "", degree: "", dates: "" }];
    const cleanedExperience = cv.experience.length > 0 ? cv.experience : [{ title: "", company: "", bullets: [""] }];
    const cleanedProjects = cv.projects.length > 0 ? cv.projects : [{ name: "", description: "", bullets: [""] }];

    const payload = {
      full_name: cv.full_name.trim(),
      email: cv.email.trim(),
      phone: cv.phone?.trim() || null,
      skills: JSON.stringify(cleanedSkills),
      education: JSON.stringify(cleanedEducation),
      experience: JSON.stringify(cleanedExperience),
      projects: JSON.stringify(cleanedProjects),
    };

    try {
      await api("/cv", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage({ type: "success", text: "CV profile saved successfully! Ready for AI tailoring." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // --- Skills Handlers ---
  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;
    if (cv.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setCv((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setSkillInput("");
    setMessage(null);
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const handleRemoveSkill = (indexToRemove) => {
    setCv((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove),
    }));
    setMessage(null);
  };

  // --- Education Handlers ---
  const handleEducationChange = (index, field, value) => {
    setCv((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
    setMessage(null);
  };

  const handleAddEducation = () => {
    setCv((prev) => ({
      ...prev,
      education: [...prev.education, { school: "", degree: "", dates: "" }],
    }));
  };

  const handleRemoveEducation = (index) => {
    setCv((prev) => {
      const filtered = prev.education.filter((_, idx) => idx !== index);
      return {
        ...prev,
        education: filtered.length > 0 ? filtered : [{ school: "", degree: "", dates: "" }],
      };
    });
  };

  // --- Experience Handlers ---
  const handleExperienceChange = (index, field, value) => {
    setCv((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
    setMessage(null);
  };

  const handleExperienceBulletChange = (expIdx, bulletIdx, value) => {
    setCv((prev) => {
      const updated = [...prev.experience];
      const bullets = [...(updated[expIdx].bullets || [""])];
      bullets[bulletIdx] = value;
      updated[expIdx] = { ...updated[expIdx], bullets };
      return { ...prev, experience: updated };
    });
  };

  const handleAddExperienceBullet = (expIdx) => {
    setCv((prev) => {
      const updated = [...prev.experience];
      const bullets = [...(updated[expIdx].bullets || []), ""];
      updated[expIdx] = { ...updated[expIdx], bullets };
      return { ...prev, experience: updated };
    });
  };

  const handleRemoveExperienceBullet = (expIdx, bulletIdx) => {
    setCv((prev) => {
      const updated = [...prev.experience];
      const bullets = (updated[expIdx].bullets || [""]).filter((_, idx) => idx !== bulletIdx);
      updated[expIdx] = {
        ...updated[expIdx],
        bullets: bullets.length > 0 ? bullets : [""],
      };
      return { ...prev, experience: updated };
    });
  };

  const handleAddExperience = () => {
    setCv((prev) => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", bullets: [""] }],
    }));
  };

  const handleRemoveExperience = (index) => {
    setCv((prev) => {
      const filtered = prev.experience.filter((_, idx) => idx !== index);
      return {
        ...prev,
        experience: filtered.length > 0 ? filtered : [{ title: "", company: "", bullets: [""] }],
      };
    });
  };

  // --- Projects Handlers ---
  const handleProjectChange = (index, field, value) => {
    setCv((prev) => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
    setMessage(null);
  };

  const handleProjectBulletChange = (projIdx, bulletIdx, value) => {
    setCv((prev) => {
      const updated = [...prev.projects];
      const bullets = [...(updated[projIdx].bullets || [""])];
      bullets[bulletIdx] = value;
      updated[projIdx] = { ...updated[projIdx], bullets };
      return { ...prev, projects: updated };
    });
  };

  const handleAddProjectBullet = (projIdx) => {
    setCv((prev) => {
      const updated = [...prev.projects];
      const bullets = [...(updated[projIdx].bullets || []), ""];
      updated[projIdx] = { ...updated[projIdx], bullets };
      return { ...prev, projects: updated };
    });
  };

  const handleRemoveProjectBullet = (projIdx, bulletIdx) => {
    setCv((prev) => {
      const updated = [...prev.projects];
      const bullets = (updated[projIdx].bullets || [""]).filter((_, idx) => idx !== bulletIdx);
      updated[projIdx] = {
        ...updated[projIdx],
        bullets: bullets.length > 0 ? bullets : [""],
      };
      return { ...prev, projects: updated };
    });
  };

  const handleAddProject = () => {
    setCv((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: "", description: "", bullets: [""] }],
    }));
  };

  const handleRemoveProject = (index) => {
    setCv((prev) => {
      const filtered = prev.projects.filter((_, idx) => idx !== index);
      return {
        ...prev,
        projects: filtered.length > 0 ? filtered : [{ name: "", description: "", bullets: [""] }],
      };
    });
  };

  if (loading) {
    return (
      <div className="cv-page">
        <div className="cv-loading">
          <div className="cv-spinner"></div>
          <span>Loading your CV profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-page">
      <div className="cv-container">
        {/* Header */}
        <div className="cv-header">
          <div>
            <div className="cv-badge-header">
              <FileText size={14} /> Master Profile
            </div>
            <h1 className="cv-title">My CV</h1>
            <p className="cv-subtitle">
              Save your base credentials once. Our AI will reference this profile to analyze job requirements and generate targeted resumes.
            </p>
          </div>
          <div className="cv-header-actions">
            <button
              type="button"
              className="cv-btn-secondary"
              onClick={handleLoadSample}
              title="Load demo profile data"
            >
              <Sparkles size={15} />
              <span>Load Sample</span>
            </button>
            <button
              type="button"
              className="btn btn-primary cv-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? "Saving..." : "Save Master CV"}</span>
            </button>
          </div>
        </div>

        {/* Feedback notification */}
        {message && (
          <div className={`cv-alert cv-alert-${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle2 size={18} className="cv-alert-icon" />
            ) : (
              <AlertCircle size={18} className="cv-alert-icon" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="cv-sections-stack">
          {/* Section 1: Personal Info */}
          <div className="cv-card">
            <div className="cv-card-header">
              <div className="cv-section-icon">
                <User size={18} />
              </div>
              <div>
                <h2 className="cv-section-title">Personal Information</h2>
                <p className="cv-section-desc">Your contact details displayed at the top of your resume.</p>
              </div>
            </div>

            <div className="cv-card-body">
              <div className="cv-grid-3">
                <div className="cv-field">
                  <label className="label">
                    Full Name <span className="cv-required">*</span>
                  </label>
                  <div className="cv-input-wrapper">
                    <User size={15} className="cv-input-icon" />
                    <input
                      className="input cv-input-with-icon"
                      value={cv.full_name}
                      onChange={(e) => {
                        setCv({ ...cv, full_name: e.target.value });
                        setMessage(null);
                      }}
                      placeholder="e.g. Abdullah"
                    />
                  </div>
                </div>

                <div className="cv-field">
                  <label className="label">
                    Email <span className="cv-required">*</span>
                  </label>
                  <div className="cv-input-wrapper">
                    <Mail size={15} className="cv-input-icon" />
                    <input
                      className="input cv-input-with-icon"
                      type="email"
                      value={cv.email}
                      onChange={(e) => {
                        setCv({ ...cv, email: e.target.value });
                        setMessage(null);
                      }}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="cv-field">
                  <label className="label">Phone Number</label>
                  <div className="cv-input-wrapper">
                    <Phone size={15} className="cv-input-icon" />
                    <input
                      className="input cv-input-with-icon"
                      value={cv.phone}
                      onChange={(e) => {
                        setCv({ ...cv, phone: e.target.value });
                        setMessage(null);
                      }}
                      placeholder="+60123456789"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Skills */}
          <div className="cv-card">
            <div className="cv-card-header">
              <div className="cv-section-icon">
                <Wrench size={18} />
              </div>
              <div className="cv-section-header-content">
                <div>
                  <h2 className="cv-section-title">Skills & Proficiencies</h2>
                  <p className="cv-section-desc">
                    Add tech stack tools, languages, and core abilities. Press Enter to add.
                  </p>
                </div>
                <span className="cv-count-badge">{cv.skills.length} skills</span>
              </div>
            </div>

            <div className="cv-card-body">
              {/* Tag Badges Container */}
              <div className="cv-tags-container">
                {cv.skills.map((skill, idx) => (
                  <span key={`${skill}-${idx}`} className="cv-skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="cv-tag-remove"
                      onClick={() => handleRemoveSkill(idx)}
                      title={`Remove ${skill}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                {cv.skills.length === 0 && (
                  <p className="cv-empty-hint">No skills added yet. Type below to add your first skill.</p>
                )}
              </div>

              {/* Add Skill Input */}
              <div className="cv-add-skill-row">
                <input
                  className="input cv-skill-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  placeholder="Type a skill (e.g. Python, Docker, PyTorch) and press Enter"
                />
                <button
                  type="button"
                  className="btn btn-secondary cv-btn-add-skill"
                  onClick={() => handleAddSkill(skillInput)}
                >
                  <Plus size={15} /> Add
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="cv-skill-suggestions">
                <span className="cv-suggestions-label">Quick Suggestions:</span>
                <div className="cv-suggestions-list">
                  {POPULAR_SKILLS.filter(
                    (s) => !cv.skills.some((exist) => exist.toLowerCase() === s.toLowerCase())
                  )
                    .slice(0, 6)
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="cv-suggestion-chip"
                        onClick={() => handleAddSkill(suggestion)}
                      >
                        + {suggestion}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Education */}
          <div className="cv-card">
            <div className="cv-card-header">
              <div className="cv-section-icon">
                <GraduationCap size={18} />
              </div>
              <div className="cv-section-header-content">
                <div>
                  <h2 className="cv-section-title">Education</h2>
                  <p className="cv-section-desc">Degrees, certifications, and academic background.</p>
                </div>
                <span className="cv-count-badge">{cv.education.length} entries</span>
              </div>
            </div>

            <div className="cv-card-body cv-stack-gap">
              {cv.education.map((edu, idx) => (
                <div key={idx} className="cv-item-card">
                  <div className="cv-item-card-header">
                    <span className="cv-item-title">
                      {edu.degree || edu.school ? (
                        <>
                          <strong>{edu.degree || "Degree"}</strong>
                          {edu.school ? ` — ${edu.school}` : ""}
                        </>
                      ) : (
                        `Education #${idx + 1}`
                      )}
                    </span>
                    {cv.education.length > 1 && (
                      <button
                        type="button"
                        className="cv-btn-icon-danger"
                        onClick={() => handleRemoveEducation(idx)}
                        title="Delete this education entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="cv-grid-3">
                    <div className="cv-field">
                      <label className="label">School / Institution</label>
                      <input
                        className="input"
                        value={edu.school}
                        onChange={(e) => handleEducationChange(idx, "school", e.target.value)}
                        placeholder="e.g. Multimedia University"
                      />
                    </div>
                    <div className="cv-field">
                      <label className="label">Degree / Field</label>
                      <input
                        className="input"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(idx, "degree", e.target.value)}
                        placeholder="e.g. BSc Computer Science (AI)"
                      />
                    </div>
                    <div className="cv-field">
                      <label className="label">Years / Dates</label>
                      <input
                        className="input"
                        value={edu.dates}
                        onChange={(e) => handleEducationChange(idx, "dates", e.target.value)}
                        placeholder="e.g. 2023 – 2027"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="cv-btn-add-section"
                onClick={handleAddEducation}
              >
                <Plus size={16} /> Add Another Education
              </button>
            </div>
          </div>

          {/* Section 4: Work Experience */}
          <div className="cv-card">
            <div className="cv-card-header">
              <div className="cv-section-icon">
                <Briefcase size={18} />
              </div>
              <div className="cv-section-header-content">
                <div>
                  <h2 className="cv-section-title">Work Experience</h2>
                  <p className="cv-section-desc">
                    Internships, full-time jobs, freelance, or student roles.
                  </p>
                </div>
                <span className="cv-count-badge">{cv.experience.length} roles</span>
              </div>
            </div>

            <div className="cv-card-body cv-stack-gap">
              {cv.experience.map((exp, expIdx) => (
                <div key={expIdx} className="cv-item-card">
                  <div className="cv-item-card-header">
                    <span className="cv-item-title">
                      {exp.title || exp.company ? (
                        <>
                          <strong>{exp.title || "Role"}</strong>
                          {exp.company ? ` at ${exp.company}` : ""}
                        </>
                      ) : (
                        `Experience #${expIdx + 1}`
                      )}
                    </span>
                    {cv.experience.length > 1 && (
                      <button
                        type="button"
                        className="cv-btn-icon-danger"
                        onClick={() => handleRemoveExperience(expIdx)}
                        title="Delete this role"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="cv-grid-2">
                    <div className="cv-field">
                      <label className="label">Job Title</label>
                      <input
                        className="input"
                        value={exp.title}
                        onChange={(e) => handleExperienceChange(expIdx, "title", e.target.value)}
                        placeholder="e.g. Software Engineer Intern"
                      />
                    </div>
                    <div className="cv-field">
                      <label className="label">Company / Organization</label>
                      <input
                        className="input"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(expIdx, "company", e.target.value)}
                        placeholder="e.g. Google / Startup"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="cv-bullets-block">
                    <label className="cv-bullets-label">Responsibilities & Achievements</label>
                    <div className="cv-bullets-list">
                      {(exp.bullets || [""]).map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="cv-bullet-row">
                          <span className="cv-bullet-dot">•</span>
                          <input
                            className="input cv-bullet-input"
                            value={bullet}
                            onChange={(e) =>
                              handleExperienceBulletChange(expIdx, bulletIdx, e.target.value)
                            }
                            placeholder="e.g. Built automated API pipelines reducing latency by 30%"
                          />
                          {(exp.bullets || []).length > 1 && (
                            <button
                              type="button"
                              className="cv-btn-bullet-remove"
                              onClick={() => handleRemoveExperienceBullet(expIdx, bulletIdx)}
                              title="Delete bullet"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="cv-btn-add-bullet"
                      onClick={() => handleAddExperienceBullet(expIdx)}
                    >
                      <Plus size={13} /> Add Bullet Point
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="cv-btn-add-section"
                onClick={handleAddExperience}
              >
                <Plus size={16} /> Add Another Experience
              </button>
            </div>
          </div>

          {/* Section 5: Projects */}
          <div className="cv-card">
            <div className="cv-card-header">
              <div className="cv-section-icon">
                <FolderGit2 size={18} />
              </div>
              <div className="cv-section-header-content">
                <div>
                  <h2 className="cv-section-title">Projects</h2>
                  <p className="cv-section-desc">
                    Personal, academic, or open-source projects demonstrating your hands-on ability.
                  </p>
                </div>
                <span className="cv-count-badge">{cv.projects.length} projects</span>
              </div>
            </div>

            <div className="cv-card-body cv-stack-gap">
              {cv.projects.map((proj, projIdx) => (
                <div key={projIdx} className="cv-item-card">
                  <div className="cv-item-card-header">
                    <span className="cv-item-title">
                      {proj.name ? (
                        <strong>{proj.name}</strong>
                      ) : (
                        `Project #${projIdx + 1}`
                      )}
                    </span>
                    {cv.projects.length > 1 && (
                      <button
                        type="button"
                        className="cv-btn-icon-danger"
                        onClick={() => handleRemoveProject(projIdx)}
                        title="Delete this project"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div className="cv-grid-2">
                    <div className="cv-field">
                      <label className="label">Project Name</label>
                      <input
                        className="input"
                        value={proj.name}
                        onChange={(e) => handleProjectChange(projIdx, "name", e.target.value)}
                        placeholder="e.g. Job Tracker AI"
                      />
                    </div>
                    <div className="cv-field">
                      <label className="label">Tagline / Tech Highlights</label>
                      <input
                        className="input"
                        value={proj.description}
                        onChange={(e) => handleProjectChange(projIdx, "description", e.target.value)}
                        placeholder="e.g. Full-stack RAG pipeline with FastAPI & Groq"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="cv-bullets-block">
                    <label className="cv-bullets-label">Project Highlights & Impact</label>
                    <div className="cv-bullets-list">
                      {(proj.bullets || [""]).map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="cv-bullet-row">
                          <span className="cv-bullet-dot">•</span>
                          <input
                            className="input cv-bullet-input"
                            value={bullet}
                            onChange={(e) =>
                              handleProjectBulletChange(projIdx, bulletIdx, e.target.value)
                            }
                            placeholder="e.g. Integrated Groq Llama 3.1 70B for real-time resume adaptation"
                          />
                          {(proj.bullets || []).length > 1 && (
                            <button
                              type="button"
                              className="cv-btn-bullet-remove"
                              onClick={() => handleRemoveProjectBullet(projIdx, bulletIdx)}
                              title="Delete bullet"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="cv-btn-add-bullet"
                      onClick={() => handleAddProjectBullet(projIdx)}
                    >
                      <Plus size={13} /> Add Bullet Point
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="cv-btn-add-section"
                onClick={handleAddProject}
              >
                <Plus size={16} /> Add Another Project
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="cv-footer-actions">
          <button
            type="button"
            className="cv-btn-secondary"
            onClick={handleLoadSample}
          >
            <Sparkles size={15} /> Load Sample
          </button>
          <button
            type="button"
            className="btn btn-primary cv-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? "Saving Changes..." : "Save Master CV"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

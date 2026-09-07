"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ClipboardPaste,
  FlaskConical,
  RotateCcw,
  CheckCircle2,
  FileText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE_JD = `Senior Full Stack Developer
Company: TechNova Solutions
Location: Remote (Malaysia / Asia-Pacific)

About the Role:
We are looking for an experienced Full Stack Developer to build and scale our web applications. You will collaborate closely with product and AI teams to deliver high-performance user interfaces and resilient backend microservices.

Key Requirements:
- 3+ years experience with React, TypeScript, and modern CSS
- Solid backend experience in Python (FastAPI) or Node.js
- Experience with RESTful APIs, relational databases, and SQLite/PostgreSQL
- Familiarity with AI/LLM API integrations (Groq, OpenAI, Llama)
- Strong understanding of Git workflows and automated testing

Nice to Have:
- Experience with Vite and responsive UI design systems
- Familiarity with prompt engineering or tailoring CVs to job requirements`;

interface AIAssistantCardProps {
  value?: string;
  onChange?: (value: string) => void;
  onAnalyze?: () => void;
  loading?: boolean;
}

export function AIAssistantCard({
  value = "",
  onChange,
  onAnalyze,
  loading = false,
}: AIAssistantCardProps) {
  const [internalText, setInternalText] = useState(value);
  const [copiedNotification, setCopiedNotification] = useState("");
  const currentText = onChange ? value : internalText;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (onChange) {
      onChange(text);
    } else {
      setInternalText(text);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (onChange) onChange(text);
        else setInternalText(text);
        setCopiedNotification("Pasted!");
        setTimeout(() => setCopiedNotification(""), 2000);
      }
    } catch {
      setCopiedNotification("Access denied");
      setTimeout(() => setCopiedNotification(""), 2000);
    }
  };

  const handleSampleJD = () => {
    if (onChange) onChange(SAMPLE_JD);
    else setInternalText(SAMPLE_JD);
    setCopiedNotification("Sample loaded!");
    setTimeout(() => setCopiedNotification(""), 2000);
  };

  const handleClear = () => {
    if (onChange) onChange("");
    else setInternalText("");
  };

  const charCount = currentText.length;
  const isReady = charCount >= 20;

  return (
    <Card className="flex h-full w-full flex-col justify-between border-[#e8e0d8] bg-white shadow-[0_8px_30px_rgba(139,94,60,0.05)] rounded-2xl overflow-hidden p-0">
      {/* Spacious Header with Title and Quick Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e0d8] bg-[#faf8f5]/60"
        style={{ padding: "1rem 1.25rem" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5E3C]/10 border border-[#8B5E3C]/20 flex items-center justify-center flex-shrink-0 text-[#8B5E3C]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1a1a1a] tracking-tight">
              Job Description
            </h2>
            <p className="text-xs text-[#666666]">
              Paste posting to evaluate CV match & requirements
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          {copiedNotification && (
            <span className="text-xs text-[#8B5E3C] font-semibold mr-1 transition-all">
              ✓ {copiedNotification}
            </span>
          )}

          <button
            type="button"
            onClick={handlePasteClipboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B5E3C] bg-[#f5f0eb] hover:bg-[#8B5E3C] hover:text-white border border-[#e8e0d8] rounded-lg transition-colors cursor-pointer"
            style={{ padding: "0.4rem 0.75rem" }}
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          <button
            type="button"
            onClick={handleSampleJD}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B5E3C] bg-[#f5f0eb] hover:bg-[#8B5E3C] hover:text-white border border-[#e8e0d8] rounded-lg transition-colors cursor-pointer"
            style={{ padding: "0.4rem 0.75rem" }}
            title="Load a sample job description"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Sample JD</span>
          </button>

          {charCount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#666666] hover:text-[#1a1a1a] hover:bg-[#e8e0d8]/50 rounded-lg transition-colors cursor-pointer"
              style={{ padding: "0.4rem 0.6rem" }}
              title="Clear text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea Area - Spacious and Uncramped */}
      <CardContent className="flex flex-1 flex-col p-0" style={{ padding: 0 }}>
        <Textarea
          placeholder="Paste the full job posting here (Title, Responsibilities, Tech Stack, Qualifications)..."
          value={currentText}
          onChange={handleTextChange}
          className="flex-1 w-full bg-transparent border-none resize-none text-sm leading-relaxed text-[#1a1a1a] placeholder:text-[#999999] focus-visible:ring-0 focus-visible:outline-none"
          style={{
            padding: "1.25rem 1.5rem",
            minHeight: "260px",
            lineHeight: 1.65,
          }}
        />
      </CardContent>

      {/* Bottom Bar: Character status on left, Analyze button on right */}
      <div
        className="flex items-center justify-between border-t border-[#e8e0d8] bg-[#faf8f5]/60"
        style={{ padding: "0.85rem 1.25rem" }}
      >
        {/* Character Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isReady ? "bg-[#4CAF50]" : "bg-[#999999]"
            }`}
          />
          <span className="text-xs text-[#666666]">
            {charCount === 0 ? (
              "Min 20 characters required"
            ) : isReady ? (
              <span className="text-[#1a1a1a] font-medium">
                {charCount.toLocaleString()} characters entered
              </span>
            ) : (
              <span className="text-[#e74c3c]">
                {charCount} / 20 min characters
              </span>
            )}
          </span>
        </div>

        {/* Big, Spacious Analyze Button */}
        <Button
          onClick={onAnalyze}
          disabled={loading || !isReady}
          size="default"
          className="h-10 gap-2 text-sm font-semibold bg-[#8B5E3C] text-white hover:bg-[#724C30] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          style={{ padding: "0 1.5rem" }}
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Analyzing..." : "Analyze Match"}
        </Button>
      </div>
    </Card>
  );
}

export const Component = AIAssistantCard;
export default AIAssistantCard;

"use client";

import { useState } from "react";
import JobDescriptionForm from "./components/JobDescriptionForm";
import PdfPreview from "./components/PdfPreview";

const MY_LOCATION = "Hanoi, Vietnam";

interface JobInfo {
  location: string;
  remote: string;
}

interface Usage {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

function locationMatches(jobLocation: string): boolean {
  const job = jobLocation.toLowerCase();
  const keywords = ["hanoi", "vietnam", "ha noi", "hà nội"];
  return keywords.some((k) => job.includes(k));
}

async function htmlToPdfBlob(html: string): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  container.style.fontSize = "11pt";
  container.style.lineHeight = "1.5";
  container.style.color = "#222";
  document.body.appendChild(container);

  try {
    const blob: Blob = await html2pdf()
      .set({
        margin: [20, 18, 20, 18],
        filename: "tailored-cv.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .outputPdf("blob");
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateSkill, setTemplateSkill] = useState<string | null>(null);
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  async function handleGenerate(jobDescription: string) {
    setError(null);
    setPdfUrl(null);
    setTemplateSkill(null);
    setJobInfo(null);
    setUsage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status})`);
      }

      setTemplateSkill(data.templateSkill);
      setJobInfo(data.jobInfo);
      setUsage(data.usage);

      const blob = await htmlToPdfBlob(data.html);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isRemote = jobInfo?.remote === "Remote";
  const isLocationMatch = jobInfo ? locationMatches(jobInfo.location) : false;
  const locationOk = isRemote || isLocationMatch;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 font-sans">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">CV Generator</h1>
      <p className="text-gray-500 mb-6">
        Paste a job description and generate a tailored, ATS-friendly CV.
      </p>

      <div className="flex gap-6 items-start">
        <div className="w-[420px] shrink-0">
          <JobDescriptionForm onGenerate={handleGenerate} loading={loading} />
          {error && (
            <p className="mt-3 text-red-600 font-semibold">{error}</p>
          )}
        </div>
        <div className="flex-1 min-h-[600px]">
          {loading && (
            <p className="text-gray-500 italic">Generating your CV...</p>
          )}

          {templateSkill && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">
                Template: <strong className="text-gray-900">{templateSkill}</strong>
              </span>
              <a
                href={`/api/template?skill=${encodeURIComponent(templateSkill)}`}
                download
                className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Download Original
              </a>
            </div>
          )}

          {jobInfo && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-600">
                Location: <strong className="text-gray-900">{jobInfo.location}</strong>
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isRemote
                  ? "bg-green-100 text-green-700"
                  : jobInfo.remote === "Hybrid"
                    ? "bg-yellow-100 text-yellow-700"
                    : jobInfo.remote === "On-site"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
              }`}>
                {jobInfo.remote}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                locationOk
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {locationOk
                  ? `Matches ${MY_LOCATION}`
                  : `Does not match ${MY_LOCATION}`}
              </span>
            </div>
          )}

          {usage && (
            <div className="mb-3 flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <span>
                Cost: <strong className="text-gray-900">${usage.cost.toFixed(4)}</strong>
              </span>
              <span>
                Tokens: <strong className="text-gray-900">{usage.inputTokens.toLocaleString()}</strong> in / <strong className="text-gray-900">{usage.outputTokens.toLocaleString()}</strong> out
              </span>
            </div>
          )}

          {pdfUrl && <PdfPreview url={pdfUrl} />}
        </div>
      </div>
    </div>
  );
}

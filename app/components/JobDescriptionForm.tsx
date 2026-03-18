"use client";

import { useState } from "react";

interface Props {
  onGenerate: (jobDescription: string) => void;
  loading: boolean;
}

export default function JobDescriptionForm({ onGenerate, loading }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 20) return;
    onGenerate(text.trim());
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="jd" className="block font-semibold mb-1.5 text-sm">
        Job Description
      </label>
      <textarea
        id="jd"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the full job description here..."
        rows={18}
        className="w-full p-3 text-sm border border-gray-300 rounded-md resize-y font-[inherit] focus:outline-none focus:ring-2 focus:ring-slate-700"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || text.trim().length < 20}
        className="mt-3 w-full py-2.5 px-6 text-[15px] font-semibold text-white bg-slate-700 rounded-md cursor-pointer hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate CV"}
      </button>
    </form>
  );
}

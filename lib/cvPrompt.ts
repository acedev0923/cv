function getLastMonth(): string {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${monthNames[month - 1]} ${year}`;
}

export function buildSelectTemplateMessages(
  skills: string[],
  jobDescription: string
): { role: "system" | "user"; content: string }[] {
  const skillList = skills.map((s, i) => `${i + 1}. ${s}`).join("\n");

  return [
    {
      role: "system",
      content: `You are a recruitment expert. Given a list of CV template categories and a job description, select the single BEST matching template category. Reply with ONLY the exact category name, nothing else.`,
    },
    {
      role: "user",
      content: `Available template categories:\n${skillList}\n\n---\n\nJob description:\n${jobDescription}\n\nWhich template category is the best match?`,
    },
  ];
}

export function buildMessages(
  sampleCVText: string,
  jobDescription: string
): { role: "system" | "user"; content: string }[] {
  const lastMonth = getLastMonth();

  return [
    {
      role: "system",
      content: `You are an expert CV writer specializing in ATS-optimized resumes.

RULES:
- ONLY use information from the provided sample CV. NEVER fabricate experience, companies, education, certifications, or skills.
- Reorder and emphasize content to match the job description's keywords and priorities.
- IMPORTANT: Update the end date of the most recent work experience to "${lastMonth}" to show the candidate is currently employed up to last month.
- Output clean, semantic HTML suitable for PDF rendering. Use a single-column layout.
- Use standard HTML tags: h1, h2, p, ul, li, strong, em. No tables, no columns, no images.
- For the Skills section, preserve the same category groupings as the sample CV (e.g. "Frontend:", "Backend:", "Database:", "DevOps:", etc.). List each category on its own line with its skills as comma-separated text. Do NOT merge all skills into a single flat list.
- Target 1-2 pages when printed on A4.
- Include these sections in order: Name & Contact, Professional Summary, Skills, Work Experience, Education, Certifications (if any).
- Use concise bullet points for achievements. Start with action verbs.
- Incorporate keywords from the job description naturally into the summary and experience bullets.
- Output ONLY the HTML body content (no <html>, <head>, or <body> tags). Start with the candidate's name as an <h1>.`,
    },
    {
      role: "user",
      content: `Here is the candidate's base CV:\n\n${sampleCVText}\n\n---\n\nHere is the job description to tailor the CV for:\n\n${jobDescription}\n\nGenerate the tailored CV as clean HTML now.`,
    },
  ];
}

export function buildExtractJobInfoMessages(
  jobDescription: string
): { role: "system" | "user"; content: string }[] {
  return [
    {
      role: "system",
      content: `Extract the job location and remote policy from the job description. Reply with ONLY a JSON object with two fields:
- "location": the city/country or "Not specified" if not mentioned
- "remote": one of "Remote", "On-site", "Hybrid", or "Not specified"

Classification rules for "remote":
- "Remote": if the job says "remote", "remote work available", "work from anywhere", "fully remote", or any indication that the candidate CAN work remotely full-time
- "Hybrid": ONLY if the job explicitly says "hybrid" or requires a mix of office and remote days
- "On-site": if the job explicitly requires being in the office full-time with no remote option
- "Not specified": if nothing about remote/on-site is mentioned

No markdown, no code fences, no explanation, just the raw JSON object.`,
    },
    {
      role: "user",
      content: jobDescription,
    },
  ];
}

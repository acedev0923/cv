import OpenAI from "openai";
import { buildSelectTemplateMessages, buildMessages, buildExtractJobInfoMessages } from "./cvPrompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GPT-4o pricing per 1M tokens
const INPUT_COST_PER_M = 2.5;
const OUTPUT_COST_PER_M = 10;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

function calcCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

export interface SelectTemplateResult {
  skill: string;
  usage: TokenUsage;
}

export async function selectTemplate(
  skills: string[],
  jobDescription: string
): Promise<SelectTemplateResult> {
  const messages = buildSelectTemplateMessages(skills, jobDescription);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No response from OpenAI when selecting template");
  }

  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;

  const match = skills.find((s) => content.includes(s));
  return {
    skill: match || skills[0],
    usage: { inputTokens, outputTokens, cost: calcCost(inputTokens, outputTokens) },
  };
}

export interface GenerateCVResult {
  html: string;
  usage: TokenUsage;
}

export async function generateCVHtml(
  sampleCVText: string,
  jobDescription: string
): Promise<GenerateCVResult> {
  const messages = buildMessages(sampleCVText, jobDescription);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;

  return {
    html: content.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim(),
    usage: { inputTokens, outputTokens, cost: calcCost(inputTokens, outputTokens) },
  };
}

export interface JobInfo {
  location: string;
  remote: string;
}

export interface ExtractJobInfoResult {
  jobInfo: JobInfo;
  usage: TokenUsage;
}

export async function extractJobInfo(jobDescription: string): Promise<ExtractJobInfoResult> {
  const messages = buildExtractJobInfoMessages(jobDescription);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content?.trim();
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;

  let jobInfo: JobInfo = { location: "Unknown", remote: "Unknown" };
  try {
    const cleaned = (content || "{}").replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
    jobInfo = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse job info:", content);
  }

  return {
    jobInfo,
    usage: { inputTokens, outputTokens, cost: calcCost(inputTokens, outputTokens) },
  };
}

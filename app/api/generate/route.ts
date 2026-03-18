import { NextRequest, NextResponse } from "next/server";
import { getTemplateSkills, getTemplateText } from "@/lib/templateReader";
import { selectTemplate, generateCVHtml, extractJobInfo, TokenUsage } from "@/lib/aiGenerator";
import { renderPdf } from "@/lib/pdfRenderer";

export async function POST(req: NextRequest) {
  try {
    const { jobDescription } = await req.json();

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a job description (at least 20 characters)." },
        { status: 400 }
      );
    }

    const trimmed = jobDescription.trim();

    // Run template selection and job info extraction in parallel
    const skills = getTemplateSkills();
    const [templateResult, jobInfoResult] = await Promise.all([
      selectTemplate(skills, trimmed),
      extractJobInfo(trimmed),
    ]);

    console.log(`Selected template: ${templateResult.skill}`);

    const cvText = await getTemplateText(templateResult.skill);
    const cvResult = await generateCVHtml(cvText, trimmed);
    const pdfBuffer = await renderPdf(cvResult.html);

    const totalCost =
      templateResult.usage.cost + cvResult.usage.cost + jobInfoResult.usage.cost;
    const totalInput =
      templateResult.usage.inputTokens + cvResult.usage.inputTokens + jobInfoResult.usage.inputTokens;
    const totalOutput =
      templateResult.usage.outputTokens + cvResult.usage.outputTokens + jobInfoResult.usage.outputTokens;

    return NextResponse.json({
      pdf: Buffer.from(pdfBuffer).toString("base64"),
      templateSkill: templateResult.skill,
      jobInfo: jobInfoResult.jobInfo,
      usage: {
        inputTokens: totalInput,
        outputTokens: totalOutput,
        cost: totalCost,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate CV";
    console.error("Generate error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

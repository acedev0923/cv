import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TEMPLATES_DIR = path.resolve(process.cwd(), "templates");

export async function GET(req: NextRequest) {
  const skill = req.nextUrl.searchParams.get("skill");

  if (!skill) {
    return NextResponse.json({ error: "Missing skill parameter" }, { status: 400 });
  }

  const skillDir = path.join(TEMPLATES_DIR, skill);

  if (!fs.existsSync(skillDir)) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const files = fs.readdirSync(skillDir).filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (files.length === 0) {
    return NextResponse.json({ error: "No PDF found in template folder" }, { status: 404 });
  }

  const filePath = path.join(skillDir, files[0]);
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${files[0]}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

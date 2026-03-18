import fs from "fs";
import path from "path";
import { extractText } from "./extractText";

const TEMPLATES_DIR = path.resolve(process.cwd(), "templates");
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export function getTemplateSkills(): string[] {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    throw new Error("No templates found. Place sample CVs in templates/");
  }

  const dirs = fs
    .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (dirs.length === 0) {
    throw new Error("No template subfolders found in templates/");
  }

  return dirs;
}

export async function getTemplateText(skill: string): Promise<string> {
  const skillDir = path.join(TEMPLATES_DIR, skill);

  if (!fs.existsSync(skillDir)) {
    throw new Error(`Template folder not found: ${skill}`);
  }

  const files = fs
    .readdirSync(skillDir)
    .filter((f) => SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    throw new Error(`No CV files found in template folder: ${skill}`);
  }

  const texts: string[] = [];
  for (const file of files) {
    const text = await extractText(path.join(skillDir, file));
    texts.push(text.trim());
  }

  return texts.join("\n\n");
}

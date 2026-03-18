import puppeteer, { type Browser } from "puppeteer-core";

const FULL_HTML_TEMPLATE = (bodyHtml: string) => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #222;
    padding: 0;
  }
  h1 { font-size: 20pt; margin-bottom: 4px; color: #1a1a1a; }
  h2 {
    font-size: 13pt;
    margin-top: 14px;
    margin-bottom: 6px;
    color: #2c3e50;
    border-bottom: 1px solid #ccc;
    padding-bottom: 2px;
  }
  p { margin-bottom: 6px; }
  ul { margin-left: 18px; margin-bottom: 8px; }
  li { margin-bottom: 3px; }
  strong { color: #1a1a1a; }
  a { color: #2c3e50; text-decoration: none; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true as boolean,
    });
  }

  // Local development: use full puppeteer's bundled Chrome
  const localPuppeteer = (await import("puppeteer")).default;
  return localPuppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as unknown as Browser;
}

export async function renderPdf(bodyHtml: string): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(FULL_HTML_TEMPLATE(bodyHtml), {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

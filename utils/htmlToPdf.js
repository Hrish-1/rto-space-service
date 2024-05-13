import puppeteer from "puppeteer";

export const generatePdf = async (file, options) => {
  const finalHtml = encodeURIComponent(file.content);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(`data:text/html;charset=UTF-8,${finalHtml}`, {
    waitUntil: "networkidle0",
  });

  const opts = { ...options, path: file.path }
  await page.pdf(opts);
  await browser.close();
};

export const generatePdfs = async (files, options) => {

  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true,
  });

  for (const file of files) {
    const finalHtml = encodeURIComponent(file.content);

    const page = await browser.newPage();
    await page.goto(`data:text/html;charset=UTF-8,${finalHtml}`, {
      waitUntil: "networkidle0",
    });

    const opts = { ...options, path: file.path }
    await page.pdf(opts);
  }

  await browser.close();
};

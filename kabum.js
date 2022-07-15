const puppeteer = require("puppeteer");
const readlineSync = require("readline-sync");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  let sitePages = 1;
  const list = [];

  let search = readlineSync.question("Informe sua pesquisa:");
  const page = await browser.newPage();
  await page.goto(`https://www.kabum.com.br/`);

  await page.type("#input-busca", search);
  await Promise.all([page.waitForNavigation(), page.keyboard.press("Enter")]);

  console.log("iniciando busca por produtos");

  const links = await page.$$eval(".productCard > a", (el) =>
    el.map((link) => link.href).slice(0, 10)
  );

  for (const link of links) {
    await page.goto(link);

    await page.waitForSelector(".container-purchase");

    const title = await page.$eval("h1", (element) => element.innerText);

    const price = await page.$eval(
      ".finalPrice",
      (element) => element.innerText
    );

    const obj = {};
    obj.title = title;
    obj.price = price;
    obj.link = link;
    list.push(obj);
    console.log("pagina:", sitePages);
    sitePages++;
  }

  fs.writeFile("kabum.json", JSON.stringify(list, null, 2), (err) => {
    if (err) {
      throw new Error("something went wrong");
    }
    console.log("finished");
  });

  await page.waitForTimeout(3000);
  await browser.close();
})();

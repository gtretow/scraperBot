const puppeteer = require("puppeteer");
const readlineSync = require("readline-sync");
const { Cluster } = require("puppeteer-cluster");
const fs = require("fs");

console.log("Informe o que você deseja fazer");

readlineSync.promptCLLoop({
  currencyConverter: async function () {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const moedaBase =
      readlineSync.question("Informe uma moeda base:") || "dolar";
    const moedaFinal =
      readlineSync.question("Informe a moeda desejada:") || "real";
    const url = `https://www.google.com/search?q=${moedaBase}+para+${moedaFinal}&oq=${moedaBase}+para+${moedaFinal}&aqs=chrome.0.69i59j0l7.1726j0j4&sourceid=chrome&ie=UTF-8`;
    await page.goto(url);

    const resultado = await page.evaluate(() => {
      return document.querySelector(".a61j6.vk_gy.vk_sh.Hg3mWc").value;
    });

    console.log(
      `O valor de 1 ${moedaBase} em ${moedaFinal} é ${resultado} na data ${new Date()}`
    );
    await browser.close();
    console.log("fim do processo");
  },
  instagram: async function () {
    const browser = await puppeteer.launch();

    let profile = readlineSync.question("Informe a conta a ser pesquisada:");
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${profile}`);

    const imgList = await page.evaluate(() => {
      const nodeList = document.querySelectorAll("article img");
      const imgArray = [...nodeList];
      const imgList = imgArray.map(({ src }) => ({
        src: `https://cors-anywhere.herokuapp.com/${src}`,
      }));

      return imgList;
    });

    fs.writeFile("items.json", JSON.stringify(imgList, null, 2), (err) => {
      if (err) {
        throw new Error("something went wrong");
      }

      console.log("finished");
    });

    await browser.close();
  },
  mercadoLivre: async function () {
    const browser = await puppeteer.launch();
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: 10,
    });

    let sitePages = 1;
    const list = [];

    let search = readlineSync.question("Informe sua pesquisa:");
    const page = await browser.newPage();
    await page.goto(`https://www.mercadolivre.com.br/`);

    await page.waitForSelector("#cb1-edit");

    await page.type(".nav-search-input", search);

    await Promise.all([
      page.waitForNavigation(),
      page.click(".nav-search-btn"),
    ]);

    console.log("iniciando busca por produtos");

    const links = await page.$$eval(".ui-search-result__image > a", (el) =>
      el.map((link) => link.href).slice(0, 10)
    );

    cluster.on("taskerror", (err, data) => {
      console.log(`error crawling ${data}: ${err.message}`);
    });
    await cluster.task(async ({ page, data: url }) => {
      await page.goto(url);

      await page.waitForSelector(".ui-pdp-title");
      const title = await page.$eval(
        ".ui-pdp-title",
        (element) => element.innerText
      );

      const price = await page.$eval(
        ".andes-money-amount__fraction",
        (element) => element.innerText
      );

      const seller = await page.evaluate(() => {
        const el = document.querySelector(".ui-pdp-seller__link-trigger");
        if (!el) {
          return null;
        }
        return el.innerText;
      });

      const obj = {};
      obj.title = title;
      obj.price = price;
      seller ? (obj.seller = seller) : "";
      obj.link = url;
      list.push(obj);
      console.log("pagina:", sitePages);
      sitePages++;
    });

    for (const url of links) {
      await cluster.queue(url);
    }

    await cluster.idle();
    await cluster.close();

    fs.writeFile("values.json", JSON.stringify(list, null, 2), (err) => {
      if (err) {
        throw new Error("something went wrong");
      }
      console.log("finished");
    });

    await page.waitForTimeout(3000);
    await browser.close();
  },
  bye: function () {
    console.log("bye");
    return;
  },
});

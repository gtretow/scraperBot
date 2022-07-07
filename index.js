const puppeteer = require("puppeteer");
const readlineSync = require("readline-sync");
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
  adidas: async function () {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://www.adidas.com.br/");
    await page.screenshot({ path: "example.png" });

    await browser.close();
  },
  bye: function () {
    console.log("bye");
    return;
  },
});

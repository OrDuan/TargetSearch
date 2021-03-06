const puppeteer = require('puppeteer');
const chai = require('chai');
const expect = chai.expect;

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
// couldn't use the native searchElm.click() it's just didn't work for most of the links
const click = async (page, selector) => {
  await page.evaluate(selector => {
    document.querySelector(selector).click();
  }, selector);
};

async function searchAndScroll(page, targetUrl, targetSelector) {
  let searchResults = await page.$$('.rc');
  for (let searchElm of searchResults) {
    let url = await page.evaluate(e => e.innerText, await searchElm.$(targetSelector));
    if (url === targetUrl) {
      await click(page, `a[data-target-search-url="${url}"]`);
      break;
    }
  }
  await page.waitForSelector('.targetsearch-icon-sm');
  await sleep(100); // Scrolling has some delay

  let scrollTop = await page.evaluate(() => window.scrollY);
  let targetElement = await page.evaluate(() => document.querySelectorAll('.targetsearch-icon-sm').length);
  return {scrollTop, targetElement};
}

describe('Extension', function () {
  let browser;
  before(async function () {
    browser = await puppeteer.launch({
      headless: false, //process.env.NODE_ENV === 'ci-testing' extension not working with headless. Yet?
      args: [
        '--disable-extensions-except=build/',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
  });

  after(async function () {
    await browser.close();
  });

  beforeEach(function () {
    setTimeout(async () => {
      let pages = await browser.pages();
      // The first page will have the welcome page, we don't need it.
      pages.forEach(page => {
        if (page.url().includes('welcome.html')) {
          page.close();
        }
      });

    }, 1000); // This is because we have delay until the welcome page opens
  });

  describe('Search', function () {
    this.timeout(13000);
    it('Should scroll to the target', async function () {
      const page = await browser.newPage();
      await page.goto('https://www.google.co.il/search?q=random+text&oq=random+text&aqs=chrome..69i57j69i60j0j69i59j0l2.1392j0j9&sourceid=chrome&ie=UTF-8');
      let {scrollTop, targetElement} = await searchAndScroll(page, 'https://www.lipsum.com/', '._Rm');

      expect(scrollTop).to.be.above(0);
      expect(targetElement).to.be.equal(1);
    });

    it('Should scroll to the target in english template', async function () {
      const page = await browser.newPage();
      await page.goto('https://google.co.il');

      let englishBtn = await page.$$('#_eEe a[href*="setpref"]');
      await englishBtn[1].click();
      await page.waitForNavigation();

      let isEnglish = await page.evaluate(() => document.documentElement.textContent.indexOf('Sign in') > -1);
      expect(isEnglish).to.be.true;

      await page.goto('https://www.google.co.il/search?q=random+text&oq=random+text&aqs=chrome..69i57j69i60j0j69i59j0l2.1392j0j9&sourceid=chrome&ie=UTF-8');
      let {scrollTop, targetElement} = await searchAndScroll(page, 'https://www.lipsum.com/', '._Rm');

      expect(scrollTop).to.be.above(0);
      expect(targetElement).to.be.equal(1);
    });

    it('Should scroll to the target with featured element', async function () {
      const page = await browser.newPage();

      await page.goto('https://google.co.il');

      let isEnglish = await page.evaluate(() => document.documentElement.textContent.indexOf('Sign in') > -1);
      if (!isEnglish) {
        let englishBtn = await page.$('#_eEe a[href*="setpref"][dir="ltr"]');
        await englishBtn.click();
        await page.waitForNavigation();
        isEnglish = await page.evaluate(() => document.documentElement.textContent.indexOf('Sign in') > -1);
        expect(isEnglish).to.be.true;
      }

      await page.goto('https://www.google.co.il/search?q=what+js+node&oq=what+&aqs=chrome.0.69i59j69i60l4j69i65.1242j0j7&sourceid=chrome&ie=UTF-8');
      let {scrollTop, targetElement} = await searchAndScroll(page, 'https://www.tutorialspoint.com/nodejs/nodejs_introduction.htm', '._Rm');

      expect(scrollTop).to.be.above(0);
      expect(targetElement).to.be.equal(1);
    });

    it('should close the share menu');
    it('should copy link from share menu');
    it('should copy link from popup menu');
    it('should count the section clicks');
    it('should rank the extension with bad rank');
    it('should rank the extension with best rank');
  });
});

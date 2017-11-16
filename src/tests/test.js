const puppeteer = require('puppeteer')
const chai = require('chai')
const expect = chai.expect

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
// couldn't use the native searchElm.click() it's just didn't work for most of the links
const click = async (page, selector) => {
  await page.evaluate(selector => {
    document.querySelector(selector).click()
  }, selector)
}

describe('Extension', function () {
  describe('Search', function () {
    it('Should scroll to the target', async function () {
      this.timeout(10000)
      const browser = await puppeteer.launch({
        headless: false,
        args: [
          '--disable-extensions-except=build/',
        ],
      })
      const page = await browser.newPage()
      await page.goto('https://www.google.co.il/search?q=random+text&oq=random+text&aqs=chrome..69i57j69i60j0j69i59j0l2.1392j0j9&sourceid=chrome&ie=UTF-8')
      let searchResults = await page.$$('.rc')
      for (let searchElm of searchResults) {
        let url = await page.evaluate(e => e.innerText, await searchElm.$('._Rm'))
        let grayLine = await searchElm.$('a[data-target-search-url]')
        if (url === 'https://www.lipsum.com/') {
          console.log(await page.evaluate(e => e.getAttribute('data-target-search-url'), await grayLine))

          await click(page, `a[data-target-search-url="${url}"]`)
          break
        }
      }
      await page.waitForSelector('.targetsearch-icon-sm')
      await sleep(100) // Scrolling has some delay

      let scrollTop = await page.evaluate(() => window.scrollY)
      let targetElement = await page.evaluate(() => document.querySelectorAll('.targetsearch-icon-sm').length)

      expect(scrollTop).to.be.above(0)
      expect(targetElement).to.be.equal(1)
      await browser.close()


    })
  })
})

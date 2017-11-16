const puppeteer = require('puppeteer')
const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-extensions-except=../../build',
    ],
  })
  const page = await browser.newPage()
  await page.goto('https://www.google.com/search?q=game+of+thrones&oq=game&aqs=chrome.1.69i57j0l5.1815j0j4&sourceid=chrome&ie=UTF-8')
  let searchResults = await page.$$('.rc')
  for (let searchElm of searchResults) {
    let url = await page.evaluate(e => e.innerText, await searchElm.$('._Rm'))
    let grayLine = await searchElm.$('a[data-target-search-url]')
    if (url === 'https://en.wikipedia.org/wiki/Game_of_Thrones') {
      console.log(await page.evaluate(e => e.getAttribute('data-target-search-url'), await grayLine))

      // couldn't use the native searchElm.click() it's just didn't work for most of the links
      await page.evaluate(url=>{document.querySelector(`a[data-target-search-url="${url}"]`).click()}, url)
    }
  }
  await sleep(10000)
  await browser.close()
})()

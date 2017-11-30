// @flow

import Clipboard from 'clipboard'
import StorageManager from '../storage-manager'
import * as URL from 'url'
import * as settings from '../settings'
import {ga, setRaven} from '../analytices-manager'
import * as Raven from 'raven-js'

setRaven()

let isRTL

function extractSearchText(text: string): string {
  // Check for this wired middle dot, mostly a janner or a category
  text = text.split('·')[1] || text.split('·')[0]

  // Remove any spaces
  text = text.trim()

  // Sometimes they add a wired dot or comma in the end or start
  if (['.', ','].includes(text.slice(-1))) {
    text = text.slice(0, -1)
  }

  if (['.', ','].includes(text.slice(0, 1))) {
    text = text.slice(1, -1)
  }

  text = text.replace(/"/g, '\\"')  // TODO This is changed, might break stuff

  return text.trim()
}

function getTextFromSearchResult(elm: JQuery) {
  elm.find('span:contains("Jump")').remove() // Remove redundant "jump to" tags etc
  return elm.html()
}

function getCleanTextFromSearchResult(elm) {
  if (isRTL) {
    elm.find('span').not('[dir="ltr"]').remove()
  } else {
    elm.find('span').not('[dir="rtl"]').remove()
  }

  return elm.text()
}

async function onClickSection() {
  let userData = await StorageManager.getUserData()
  let url = decodeURI(this.getAttribute('data-target-search-url'))
  let text = decodeURI(this.getAttribute('data-target-search-text'))
  console.log(`section clicked: ${url}`)
  StorageManager.set({
    ...userData,
    'userData.shareMenuCount': userData['userData.shareMenuCount'] + 1,
    [url]: text,
  })
}

function attachLink(section, url, text) {
  return `<a class="targetsearch-section-link" href="${url}" data-target-search-url="${encodeURI(url)}" data-target-search-text="${encodeURI(text)}">${section}</a>`
}

function setUpParagraph(url, $paragraph: JQuery): boolean {
  let newSections = []
  let paragraphPosition = 0

  // No support for pdf
  if (url.slice(-4) === '.pdf') {
    return false
  }

  // For related search result we might have a redundant $elm
  if (!$paragraph.length) {
    return false
  }

  // We might have paragraph elm, but it is has no text
  if (!$paragraph.html()) {
    return false
  }

  let paragraphText = getTextFromSearchResult($paragraph)
  let paragraphCleanText = getCleanTextFromSearchResult($paragraph)
  for (let section of paragraphText.split('...')) {
    if (!section) {
      continue
    }
    newSections.push(attachLink(section, url, paragraphCleanText.split('...')[paragraphPosition]))
    paragraphPosition++
  }
  $paragraph.html(newSections.join('...'))
  return true
}

function setUpLinks() {
  console.log('Setting links')

  // When google finds the best result, it features it on top of the search paragraphs
  let $featuredElms = $('.xpdopen')
  let url, $paragraph

  isRTL = $('html').attr('dir') === 'rtl'

  $featuredElms = $featuredElms || []
  $featuredElms.each((i, featuredElm) => {
    let $featuredElm = $(featuredElm)
    // Featured elements on the right side has no real links,
    // just a general maps/photos/website links
    if ($featuredElm.find('.kp-header').length) {
      return
    }

    if ($featuredElm.length) {
      url = $featuredElm.find('h3 a').attr('href')
      $paragraph = $featuredElm.find('._Tgc')

      // In rtl template we might have `xpdopen` so we need more validation
      if (url && url.length && $paragraph.length) {
        setUpParagraph(url, $paragraph)
      }
    }
  })

  // Normal search paragraphs
  for (let elm of document.getElementsByClassName('rc')) {
    $paragraph = $(elm).find('span.st')
    url = $(elm).find('h3 a').attr('href')
    setUpParagraph(url, $paragraph)
  }

  // Setup the onclick event to trigger window open
  // The `mouseup` is for middle mouse click that doesn't work with `click`
  $('a[data-target-search-url]').on('click mouseup', onClickSection)

}

function handleUI($obj) {
  let iconUrl = chrome.runtime.getURL('assets/media/icons/icon16.png')
  let originBackgroundcolor = $obj.css('background-color')
  $obj.prepend(`<img class="targetsearch-icon-sm targetsearch-icon-flash" alt="TargetSearch" src="${iconUrl}"> `)

  $obj.animate({
    // $FlowFixMe
    backgroundColor: $.Color('#abcdef'),
  }, 100)

  $obj.animate({
    // $FlowFixMe
    backgroundColor: $.Color(originBackgroundcolor),
  }, 1500)
}

function scrollToElement($obj) {
  const scroll = () => {
    console.log('scrolling to element...')
    let body = $('html, body')
    let elOffset = $obj.offset().top
    let elHeight = $obj.height()
    let windowHeight = $(window).height()
    let offset

    if (elHeight < windowHeight) {
      offset = elOffset - ((windowHeight / 2) - (elHeight / 2))
    }
    else {
      offset = elOffset
    }

    body.animate({scrollTop: offset}, settings.SCROLLING_SPEED)
    handleUI($obj)
  }

  console.log('Element found!')
  if (!document.hidden) {
    scroll()
  } else {
    $(window).one('focus', scroll)
  }
}

function findText(storageText: string): boolean {
  let extractedText = extractSearchText(storageText)
  let text = extractedText
  console.log('Got data', text)
  while (text.split(' ').length > settings.MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`)
    if (obj.length) {
      ga('send', 'event', 'findingAlgo', 'algo1')
      scrollToElement(obj)
      return true
    }
    text = text.split(' ').slice(0, -1).join(' ')
  }

  // Try this again but this time cut from the beginning
  text = extractedText
  while (text.split(' ').length > settings.MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`)
    if (obj.length) {
      ga('send', 'event', 'findingAlgo', 'algo1')
      scrollToElement(obj)
      return true
    }
    text = text.split(' ').slice(1).join(' ')
  }

  // Last time, now trying to remove from both sides at the same time
  text = extractedText
  while (text.split(' ').length > settings.MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`)
    if (obj.length) {
      ga('send', 'event', 'findingAlgo', 'algo1')
      scrollToElement(obj)
      return true
    }
    text = text.split(' ').slice(1).slice(0, -1).join(' ')
  }
  return false
}


async function getTextFromStorage(): Promise<string | null> {
  let currentUrl = window.location.href
  let url = await StorageManager.get(currentUrl)
  if (!$.isEmptyObject(url)) {
    chrome.storage.local.remove(window.location.href)
    return url[currentUrl]
  }

  // If we couldn't find the url in the list, it means we redirected 302/301, let's try to find if the hostname
  // is in our storage, if it does we guessing it is the right one.
  // TODO Don't get just the first one, order them by rank and pick the winner
  let allUrls = await StorageManager.get(null)
  for (let url in allUrls) {
    let hostname = URL.parse(url).hostname
    let currentHostname = URL.parse(currentUrl).hostname
    if (hostname === currentHostname) {
      // Remove the url key, but with a delay, this way if the user open the same tab twice we'll still
      // find it on both pages and not just on the first one.
      setTimeout(() => chrome.storage.local.remove(url), settings.TIME_BEFORE_DELETING_URL)

      ga('send', 'event', 'textFromStorage', 'foundAsHost')
      return allUrls[url]
    }
  }

  return null
}

async function onNoneGooglePageLoad() {
  let text = await getTextFromStorage()
  if (text === null) {
    console.log('Could not find any text for this page.')
    return
  }

  ga('send', 'pageview')

  // If could't find the text on the first time, try again in X time, so ajax/js render will run first.
  if (!findText(text)) {
    setTimeout(() => {
      // $FlowFixMe TODO No idea why it error about the text
      if (!findText(text)) {
        ga('send', 'event', 'findingAlgo', 'cantFind')
        console.log("Can't find the target text.")
      }
    }, settings.TIME_BEFORE_RETRY_TO_SEARCH_TEXT)
  }
}

async function shouldShowShareMenu() {
  let userData = await StorageManager.getUserData()
  if (userData['userData.disableShareMenu'] === true) {
    return false
  }

  if (userData['userData.shareMenuCount'] < settings.MIN_CLICKS_BEFORE_SHOWING_SHARE_MENU) {
    return false
  }

  if (userData['userData.shareMenuCount'] > settings.MAX_CLICKS_BEFORE_DISABLING_SHARE_MENU) {
    return false
  }

  return true
}

async function setUpShareMenu() {
  if (!await shouldShowShareMenu()) {
    return
  }

  let iconUrl = chrome.runtime.getURL('assets/media/icons/icon48.png')
  let copyMenu = chrome.runtime.getURL('assets/media/copy_link_menu.png')
  $('body').append(`
    <div class="targetsearch-share-menu" data-clipboard-text="${settings.CHROME_STORE_LINK}">
    <div class="disable-btn">X</div>
      <div class="targetsearch-share-menu-context">
        <img class="targetsearch-icon-md targetsearch-icon" alt="TargetSearch" src="${iconUrl}">
        <div class="targetsearch-share-menu-default">
          <span>Help spread the word about TargetSearch!</span>
        </div>
        <div class="targetsearch-share-menu-hover">
            Click to copy chrome store link :) Thanks! ♥
        </div>
        <div class="targetsearch-share-menu-on-copy-success">
          <h3>Link copied!</h3>
          <p>
            You can always share the link through the extension menu:
            <img src="${copyMenu}" class="targetsearch-share-menu-copy">
          </p>
        </div>
      </div>
    </div>
`)
  $('.targetsearch-share-menu')
    .mouseenter(() => {
      $('.targetsearch-share-menu-default').hide()
      $('.targetsearch-share-menu-hover').show()
    })
    .mouseleave(() => {
      $('.targetsearch-share-menu-hover').hide()
      $('.targetsearch-share-menu-default').show()
    })

  let cb = new Clipboard('.targetsearch-share-menu')
  cb.on('success', () => {
    ga('send', 'event', 'shareMenu', 'click')
    $('.targetsearch-share-menu-hover').remove()
    $('.targetsearch-share-menu-default').remove()
    $('.targetsearch-share-menu .disable-btn').remove()
    $('.targetsearch-share-menu-on-copy-success').fadeIn()
    setTimeout(()=>$('.targetsearch-share-menu').fadeOut(), 8000)
  })

  const $targetsearch = $('.targetsearch-share-menu .disable-btn')
  $targetsearch.hover(e => {
    e.stopPropagation()
  })

  $targetsearch.on('click', async (e) => {
    e.stopPropagation()
    if (confirm("Are you sure you don't want to share the extension's link? Help other people by sharing it!")) {
      await StorageManager.set({'userData.disableShareMenu': true})
      ga('send', 'event', 'shareMenuDisable', 'click')
      $('.targetsearch-share-menu').remove()
    }
  })
}

Raven.context(function () {
  $(document).ready(() => {
    if (window.location.href.indexOf('.google.') !== -1 && $('#searchform').length) {
      ga('send', 'pageview');
      setUpLinks()
      setUpShareMenu()
      ga('send', 'pageview', '/search-results')
    } else {
      onNoneGooglePageLoad()
    }
  })
})

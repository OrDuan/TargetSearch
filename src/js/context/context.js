import Clipboard from 'clipboard'

const MIN_WORDS_TO_CUT = 3; // The minimum words count to have, until this threshold we wil try to take out word by word

function extractSearchText(text) {
  // Check for this wired middle dot, mostly a janner or a category
  text = text.split('·')[1] || text.split('·')[0];

  // Remove any spaces
  text = text.trim();

  // Sometimes they add a wired dot or comma in the end or start
  if (['.', ','].includes(text.slice(-1))) {
    text = text.slice(0, -1);
  }

  if (['.', ','].includes(text.slice(0, 1))) {
    text = text.slice(1, -1);
  }

  text = text.replace(/"/g, String.raw`\"`)

  return text.trim();
}


function getTextFromSearchResult(elm) {
  elm.find('span:contains("Jump")').remove(); // Remove redundant "jump to" tags etc
  return elm.html();
}

function getCleanTextFromSearchResult(elm) {
  elm.find('span').not('[dir="rtl"]').remove(); // Remove redundant "jump to" tags etc
  return elm.text();
}

function onClickSection() {
  let url = decodeURI(this.getAttribute('data-target-search-url'));
  let text = decodeURI(this.getAttribute('data-target-search-text'));
  chrome.storage.local.set({[url]: text});
  window.open(url);
}

function attachLink(section, url, text) {
  return `<span onmouseover="this.style.textDecoration='underline';this.style.cursor='pointer';" 
    onmouseout="this.style.textDecoration='none';" data-target-search-url="${encodeURI(url)}" data-target-search-text="${encodeURI(text)}">${section}</span>`
}

function setUpParagraph(url, $paragraph) {
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
  console.log('Setting links');
  // When google finds the best result, it features it on top of the search paragraphs
  let featuredElm = document.getElementsByClassName('xpdopen')
  let url, $paragraph
  if (featuredElm.length) {
    let $featuredElm = $(featuredElm[0]);
    url = $featuredElm.find('._Rm').text()
    $paragraph = $featuredElm.find('._Tgc')
    setUpParagraph(url, $paragraph)
  }

  // Normal search paragraphs
  for (let elm of document.getElementsByClassName('rc')) {
    $paragraph = $(elm).find('span.st')
    url = $(elm).find('a').attr('href')
    setUpParagraph(url, $paragraph)
  }

  // Setup the onclick event to trigger window open
  $('span[data-target-search-url]').on('click', onClickSection)

}

function handleUI($obj) {
  let iconUrl = chrome.extension.getURL('icons/icon16.png')
  let originBackgroundcolor = $obj.css('background-color')
  $obj.prepend(`<img class="targetsearch-icon-sm targetsearch-icon-flash" alt="TargetSearch" src="${iconUrl}">`)

  $obj.animate({
    backgroundColor: $.Color("#abcdef")
  }, 100)

  $obj.animate({
    backgroundColor: $.Color(originBackgroundcolor)
  }, 1500)
}

function scrollToElement($obj) {
  let body = $("html, body")
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
  body.animate({scrollTop: offset}, 500)
  handleUI($obj)
}

function handleGetHrefFromStorage(response) {
  let responseText = response[window.location.href]
  let extractedText = extractSearchText(responseText)
  let text = extractedText
  console.log('Got data', text)
  while (text.split(' ').length > MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`)
    if (obj.length) {
      scrollToElement(obj)
      return
    }
    text = text.split(' ').slice(0, -1).join(' ')
  }

  // Try this again but this time cut from the beginning
  text = extractedText
  while (text.split(' ').length > MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`)
    if (obj.length) {
      scrollToElement(obj)
      return
    }
    text = text.split(' ').slice(1).join(' ')
  }

  // Last time, now trying to remove from both sides at the same time
  text = extractedText
  while (text.split(' ').length > MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`)
    if (obj.length) {
      scrollToElement(obj)
      return
    }
    text = text.split(' ').slice(1).slice(0, -1).join(' ')
  }
}


function findElement() {
  chrome.storage.local.get(window.location.href, response => {
    if (response) {
      handleGetHrefFromStorage(response)
      chrome.storage.local.remove(window.location.href)
    }
  })
}

function setUpShareMenu() {
  let iconUrl = chrome.extension.getURL('icons/icon48.png')
  let copyMenu = chrome.extension.getURL('media/copy_link_menu.png')
  // TODO shorten the url to track it? can we fire an event when someone opens the link?
  let extensionUrl = "https://chrome.google.com/webstore/detail/targetsearch/nohmjponpgbnhjokbmagdbnjpnmdaigb"
  $('body').append(`
    <div class="targetsearch-share-menu" data-clipboard-text="${extensionUrl}">
      <div class="targetsearch-share-menu-context">
        <img class="targetsearch-icon-md targetsearch-icon" alt="TargetSearch" src="${iconUrl}">
        <div class="targetsearch-share-menu-default">
          <span>Help us to spread the word about TargetSearch?</span>
        </div>
        <div class="targetsearch-share-menu-hover">
            Click to copy extension's link :) Thanks! <3
        </div>
        <div class="targetsearch-share-menu-on-copy-success">
          <div>Link copied!</div>
          <p>
            Next time you can copy the link from the extension menu:
            <img src="${copyMenu}" class="targetsearch-share-menu-copy">
          </p>
        </div>
      </div>
    </div>
`)
  $('.targetsearch-share-menu')
    .mouseenter(() => {
      $('.targetsearch-share-menu-default').hide();
      $('.targetsearch-share-menu-hover').show();
    })
    .mouseleave(() => {
      $('.targetsearch-share-menu-hover').hide();
      $('.targetsearch-share-menu-default').show();
    })
  let cb = new Clipboard('.targetsearch-share-menu')
  cb.on('success', () => {
    // TODO analytics event
    $('.targetsearch-share-menu-hover').remove();
    $('.targetsearch-share-menu-default').remove();
    $('.targetsearch-share-menu-on-copy-success').fadeIn();
  })
}

$(document).ready(() => {
  if (window.location.href.indexOf('.google.') !== -1 && $('#searchform').length) {
    setUpLinks()
    setUpShareMenu()
  } else {
    findElement()
  }
})

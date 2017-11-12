const MIN_WORDS_TO_CUT = 3; // The minimum words count to have, until this threshold we wil try to take out word by word

function extractSearchText(text) {
  // Check for this wired middle dot, mostly a janner or a category
  text = text.split('·')[1] || text.split('·')[0];

  // Remove any spaces
  text = text.trim();

  // Take only the `n` words
  // let words = text.split(' ');
  // let maxWords = Math.min(words.length, NUMBER_OF_WORDS);
  // let sentence = words.slice(0, maxWords).join(' ');

  // Sometimes they add a wired dot or comma in the end or start
  if (['.', ','].includes(text.slice(-1))) {
    text = text.slice(0, -1);
  }

  if (['.', ','].includes(text.slice(0, 1))) {
    text = text.slice(1, -1);
  }

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
  let url = this.getAttribute('data-target-search-url');
  let request = {
    action: 'add',
    data: {
      text: this.getAttribute('data-target-search-text'),
      url: url
    }
  };
  chrome.runtime.sendMessage(request, response => {
    console.log(response);
  });
  window.open(url);
}

function attachLink(section, url, text) {
  return `<span onmouseover="this.style.textDecoration='underline';this.style.cursor='pointer';" 
    onmouseout="this.style.textDecoration='none';" data-target-search-url="${url}" data-target-search-text="${text}">${section}</span>`
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
    url = $(featuredElm).find('a').attr('href')
    $paragraph = $(featuredElm).find('._Tgc')
    setUpParagraph(url, $paragraph)
  }

  // Normal search paragraphs
  for (let elm of document.getElementsByClassName('rc')) {
    $paragraph = $(elm).find('span.st')
    url = $(elm).find('a').attr('href')
    setUpParagraph(url, $paragraph)
  }
}

function handleUI($obj) {
  let iconUrl = chrome.extension.getURL('icons/icon16.png')
  let originBackgroundcolor = $obj.css('background-color')
  $obj.prepend('<img class="searchtarget-icon" alt="TargetSearch" src="' + iconUrl + '"> ')

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
    offset = elOffset - (((windowHeight / 2) - (elHeight / 2)) - 200)
  }
  else {
    offset = elOffset
  }
  body.animate({scrollTop: offset}, 500)
  handleUI($obj)
}

function findElement() {
  // For any other webpages check if we have it in out storage
  chrome.runtime.sendMessage({action: "get", "data": window.location.href}, response => {
    if ($.isEmptyObject(response.data)) {
      console.log('No data for this url')
      console.log('Response:', response)
      return
    }

    let extractedText = extractSearchText(response.data.text)
    let text = extractedText
    console.log('Got data', text)
    while (text.split(' ').length > MIN_WORDS_TO_CUT) {
      let obj = $('body').find('*:contains("' + text + '"):last')
      if (obj.length) {
        scrollToElement(obj)
        return
      }
      text = text.split(' ').slice(0, -1).join(' ')
    }

    // Try this again but this time cut from the beginning
    text = extractedText
    while (text.split(' ').length > MIN_WORDS_TO_CUT) {
      let obj = $('body').find('*:contains("' + text + '"):last')
      if (obj.length) {
        scrollToElement(obj)
        return
      }
      text = text.split(' ').slice(1).join(' ')
    }

    // Last time, now trying to remove from both sides at the same time
    text = extractedText
    while (text.split(' ').length > MIN_WORDS_TO_CUT) {
      let obj = $('body').find('*:contains("' + text + '"):last')
      if (obj.length) {
        scrollToElement(obj)
        return
      }
      text = text.split(' ').slice(1).slice(0, -1).join(' ')
    }
  })
}

$(document).ready(() => {
  if (window.location.href.indexOf('.google.') !== -1 && $('#searchform').length) {
    setUpLinks()
    $('span[data-target-search-url]').on('click', onClickSection)
  } else {
    findElement()
  }
})

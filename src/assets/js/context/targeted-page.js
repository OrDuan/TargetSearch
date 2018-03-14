// @flow

import StorageManager from '../storage-manager';
import * as URL from 'url';
import * as settings from '../settings';
import {ga} from '../analytices-manager';

function extractSearchText(text: string): string {
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

  text = text.replace(/"/g, '\\"');  // TODO This is changed, might break stuff

  return text.trim();
}

function handleUI($obj) {
  let iconUrl = chrome.runtime.getURL('assets/media/icons/icon16.png');
  let originBackgroundcolor = $obj.css('background-color');
  $obj.prepend(`<img class="targetsearch-icon-sm targetsearch-icon-flash" alt="TargetSearch" src="${iconUrl}"> `);

  $obj.animate({
    // $FlowFixMe
    backgroundColor: $.Color('#abcdef'),
  }, 100);

  $obj.animate({
    // $FlowFixMe
    backgroundColor: $.Color(originBackgroundcolor),
  }, 1500);
}

function scrollToElement($obj) {
  const scroll = () => {
    console.log('scrolling to element...');
    let body = $('html, body');
    let elOffset = $obj.offset().top;
    let elHeight = $obj.height();
    let windowHeight = $(window).height();
    let offset;

    if (elHeight < windowHeight) {
      offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
    }
    else {
      offset = elOffset;
    }

    body.animate({scrollTop: offset}, settings.SCROLLING_SPEED);
    handleUI($obj);
  };

  console.log('Element found!');
  if (!document.hidden) {
    scroll();
  } else {
    $(window).one('focus', scroll);
  }
}

function findText(storageText: string): boolean {
  let extractedText = extractSearchText(storageText);
  let text = extractedText;
  console.log('Got data', text);
  while (text.split(' ').length > settings.MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`);
    if (obj.length) {
      ga('send', 'event', 'findingAlgo', 'algo1');
      scrollToElement(obj);
      return true;
    }
    text = text.split(' ').slice(0, -1).join(' ');
  }

  // Try this again but this time cut from the beginning
  text = extractedText;
  while (text.split(' ').length > settings.MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`);
    if (obj.length) {
      ga('send', 'event', 'findingAlgo', 'algo1');
      scrollToElement(obj);
      return true;
    }
    text = text.split(' ').slice(1).join(' ');
  }

  // Last time, now trying to remove from both sides at the same time
  text = extractedText;
  while (text.split(' ').length > settings.MIN_WORDS_TO_CUT) {
    let obj = $('body').find(`*:contains("${text}"):last`);
    if (obj.length) {
      ga('send', 'event', 'findingAlgo', 'algo1');
      scrollToElement(obj);
      return true;
    }
    text = text.split(' ').slice(1).slice(0, -1).join(' ');
  }
  return false;
}


async function getTextFromStorage(): Promise<string | null> {
  let currentUrl = window.location.href;
  let url = await StorageManager.get(currentUrl);
  if (!$.isEmptyObject(url)) {
    chrome.storage.local.remove(window.location.href);
    return url[currentUrl];
  }

  // If we couldn't find the url in the list, it means we redirected 302/301, let's try to find if the hostname
  // is in our storage, if it does we guessing it is the right one.
  // TODO Don't get just the first one, order them by rank and pick the winner
  let allUrls = await StorageManager.get(null);
  for (let url in allUrls) {
    let hostname = URL.parse(url).hostname;
    let currentHostname = URL.parse(currentUrl).hostname;
    if (hostname === currentHostname) {
      // Remove the url key, but with a delay, this way if the user open the same tab twice we'll still
      // find it on both pages and not just on the first one.
      setTimeout(() => chrome.storage.local.remove(url), settings.TIME_BEFORE_DELETING_URL);

      ga('send', 'event', 'textFromStorage', 'foundAsHost');
      return allUrls[url];
    }
  }

  return null;
}

export async function onNoneGooglePageLoad() {
  let text = await getTextFromStorage();
  if (text === null) {
    console.log('Could not find any text for this page.');
    return;
  }

  ga('send', 'pageview');

  // If could't find the text on the first time, try again in X time, so ajax/js render will run first.
  if (!findText(text)) {
    setTimeout(() => {
      // $FlowFixMe TODO No idea why it error about the text
      if (!findText(text)) {
        ga('send', 'event', 'findingAlgo', 'cantFind');
        console.log('Can\'t find the target text.');
      }
    }, settings.TIME_BEFORE_RETRY_TO_SEARCH_TEXT);
  }
}

import Clipboard from 'clipboard';
import StorageManager from '../storage-manager';
import * as settings from '../settings';
import {ga} from '../analytices-manager';

let isRTL;

function getTextFromSearchResult(elm) {
  elm.find('span:contains("Jump")').remove(); // Remove redundant "jump to" tags etc
  return elm.html();
}

function getCleanTextFromSearchResult(elm) {
  if (isRTL) {
    elm.find('span').not('[dir="ltr"]').remove();
  } else {
    elm.find('span').not('[dir="rtl"]').remove();
  }

  return elm.text();
}

async function onClickSection() {
  let userData = await StorageManager.getUserData();
  let url = decodeURI(this.getAttribute('data-target-search-url'));
  let text = decodeURI(this.getAttribute('data-target-search-text'));
  console.log(`section clicked: ${url}`);
  StorageManager.set({
    ...userData,
    'userData.shareMenuCount': userData['userData.shareMenuCount'] + 1,
    [url]: text,
  });
}

function attachLink(section, url, text) {
  return `<a class="targetsearch-section-link" href="${url}" data-target-search-url="${encodeURI(url)}" data-target-search-text="${encodeURI(text)}">${section}</a>`;
}

function setUpParagraph(url, $paragraph) {
  let newSections = [];
  let paragraphPosition = 0;

  // No support for pdf
  if (url.slice(-4) === '.pdf') {
    return false;
  }

  // For related search result we might have a redundant $elm
  if (!$paragraph.length) {
    return false;
  }

  // We might have paragraph elm, but it is has no text
  if (!$paragraph.html()) {
    return false;
  }

  let paragraphText = getTextFromSearchResult($paragraph);
  let paragraphCleanText = getCleanTextFromSearchResult($paragraph);
  for (let section of paragraphText.split('...')) {
    if (!section) {
      continue;
    }
    newSections.push(attachLink(section, url, paragraphCleanText.split('...')[paragraphPosition]));
    paragraphPosition++;
  }
  $paragraph.html(newSections.join('...'));
  return true;
}

export function setUpLinks() {
  console.log('Setting links');

  // When google finds the best result, it features it on top of the search paragraphs
  let $featuredElms = $('.xpdopen');
  let url, $paragraph;

  isRTL = $('html').attr('dir') === 'rtl';

  $featuredElms = $featuredElms || [];
  $featuredElms.each((i, featuredElm) => {
    let $featuredElm = $(featuredElm);
    // Featured elements on the right side has no real links,
    // just a general maps/photos/website links
    if ($featuredElm.find('.kp-header').length) {
      return;
    }

    if ($featuredElm.length) {
      url = $featuredElm.find('a[ping]').attr('href');
      $paragraph = $featuredElm.find('._Tgc');

      // In rtl template we might have `xpdopen` so we need more validation
      if (url && url.length && $paragraph.length) {
        setUpParagraph(url, $paragraph);
      }
    }
  });

  // Normal search paragraphs
  for (let elm of document.getElementsByClassName('rc')) {
    $paragraph = $(elm).find('span.st');
    url = $(elm).find('a[ping]').attr('href');
    setUpParagraph(url, $paragraph);
  }

  // Setup the onclick event to trigger window open
  // The `mouseup` is for middle mouse click that doesn't work with `click`
  $('a[data-target-search-url]').on('click mouseup', onClickSection);

}

async function shouldShowShareMenu() {
  let userData = await StorageManager.getUserData();
  if (userData['userData.disableShareMenu'] === true) {
    return false;
  }

  if (userData['userData.shareMenuCount'] < settings.MIN_CLICKS_BEFORE_SHOWING_SHARE_MENU) {
    return false;
  }

  if (userData['userData.shareMenuCount'] > settings.MAX_CLICKS_BEFORE_DISABLING_SHARE_MENU) {
    return false;
  }

  return true;
}

export async function setUpShareMenu() {
  if (!await shouldShowShareMenu()) {
    return;
  }

  let iconUrl = chrome.runtime.getURL('assets/media/icons/icon48.png');
  let copyMenu = chrome.runtime.getURL('assets/media/copy_link_menu.png');
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
`);
  $('.targetsearch-share-menu')
    .mouseenter(() => {
      $('.targetsearch-share-menu-default').hide();
      $('.targetsearch-share-menu-hover').show();
    })
    .mouseleave(() => {
      $('.targetsearch-share-menu-hover').hide();
      $('.targetsearch-share-menu-default').show();
    });

  let cb = new Clipboard('.targetsearch-share-menu');
  cb.on('success', () => {
    ga('send', 'event', 'shareMenu', 'click');
    $('.targetsearch-share-menu-hover').remove();
    $('.targetsearch-share-menu-default').remove();
    $('.targetsearch-share-menu .disable-btn').remove();
    $('.targetsearch-share-menu-on-copy-success').fadeIn();
    setTimeout(() => $('.targetsearch-share-menu').fadeOut(), 8000);
  });

  const $targetsearch = $('.targetsearch-share-menu .disable-btn');
  $targetsearch.hover(e => {
    e.stopPropagation();
  });

  $targetsearch.on('click', async (e) => {
    e.stopPropagation();
    if (confirm('Are you sure you don\'t want to share the extension\'s link? Help other people by sharing it!')) {
      await StorageManager.set({'userData.disableShareMenu': true});
      ga('send', 'event', 'shareMenuDisable', 'click');
      $('.targetsearch-share-menu').remove();
    }
  });
}

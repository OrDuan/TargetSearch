import Clipboard from 'clipboard'
import StorageManager from './storage-manager'
import * as settings from './settings'
import ga from './analytices-manager'

function alertMessage(html) {
  let $alert = $('.alert')
  $alert.fadeIn(300)
  $alert.find('.text').html(html)
  setTimeout(() => $alert.fadeOut(1000), 3000)
}

$(document).ready(async () => {
  $('.copy-btn').attr('data-clipboard-text', settings.CHROME_STORE_LINK)
  let cb = new Clipboard('.copy-btn')
  cb.on('success', () => {
    ga('send', 'event', 'popupShareLink', 'copy')
    alertMessage('Link copied.<br><br>Please share it! ♥')
  })
  let currentRank = (await StorageManager.get('userData.extensionRanking'))['userData.extensionRanking']

  if (1 <= currentRank && currentRank <= 3) {
    $('.rating').hide()
  }

  $(`.rating #star${currentRank}`).prop('checked', true);

  $('.rating label').on('click', async function () {
    let rank = parseInt(this.getAttribute('data-value'))
    ga('send', 'event', 'popupUserRanking', 'click', '', rank)

    await StorageManager.set({'userData.extensionRanking': rank})

    if (rank >= settings.MIN_RANK_TO_REDIRECT_TO_CHROME) {
      window.open(settings.CHROME_STORE_LINK_REVIEW)
    }

    alertMessage('Feedback received.')
  })
})

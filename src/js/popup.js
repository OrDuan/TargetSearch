import Clipboard from 'clipboard'


$(document).ready(() => {
  let cb = new Clipboard('.copy-btn')
  cb.on('success', () => {
    // TODO Analytics event
    let $alert = $('.alert');
    $alert.fadeIn(300)
    setTimeout(() => $alert.fadeOut(1000), 3000)
  })
})

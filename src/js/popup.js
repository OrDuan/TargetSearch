import Clipboard from 'clipboard'


$(document).ready(() => {
  let cb = new Clipboard('.copy-btn')
  cb.on('success', () => {
    // TODO Analytics event
  })
})

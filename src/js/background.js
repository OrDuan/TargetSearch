chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request)
  if (request.action === 'add') {
    chrome.storage.local.set({[request.data.url]: request.data.text}, () => {
      console.log('backend', 'data saved:', request.data)
      sendResponse({status: "OK"})
    })
  } else if (request.action === 'get') {
    console.log('backend', 'Getting data')
    console.log('backend', request.data)
    chrome.storage.local.get(request.data, response => {
      let text = response[request.data]
      console.log('backend', text)
      if (text) {
        chrome.storage.local.remove(request.data, () => {
          sendResponse({status: "OK", data: {text: text}})
        })
      }
      return true // I'm going to return a response soon
    })
    return true // I'm going to return a response soon
  }
  return false // I'm not going to return a response anymore
})

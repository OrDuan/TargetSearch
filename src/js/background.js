chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request);
  if (request.action === 'add') {
    // TODO Might get too big, we need to truncate it somehow
    chrome.storage.local.set({[request.data.url]: request.data.text}, function () {
      console.log('backend', 'data saved:', request.data);
      sendResponse({status: "OK"});
    });
  } else if (request.action === 'get') {
    // TODO Delete the value?
    console.log('backend', 'Getting data');
    console.log('backend', request.data);
    chrome.storage.local.get(request.data, function (response) {
      console.log('backend', response[request.data]);
      sendResponse({status: "OK", data: {text: response[request.data]}});
    });
    return true; // I'm going to return a response soon
  }
  return false; // I'm not going to return a response anymore
});

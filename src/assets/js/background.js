import {setRaven} from './analytices-manager'
import StorageManager from './storage-manager'
import * as Raven from 'raven-js'

(async function() {
  if (process.env.NODE_ENV === 'production') {
    let userData = await StorageManager.getUserData()
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-48268499-10', {'cookieDomain': 'none'});
    ga('set', 'checkProtocolTask', function(){});
    ga('require', 'displayfeatures');

    ga('set', 'userId', userData['userData.uid']);

    setRaven()
  } else {
    window.ga = () => {}
    console.log('No analytics in development environment')
  }
})()

function onReady() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    ga(...request.params)
  });
}

Raven.context(function () {
  $(document).ready(() => {
    onReady()
  })
})


if (process.env.NODE_ENV === 'production') {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-48268499-10', {'cookieDomain': 'none'});
  ga('set', 'checkProtocolTask', function(){});
  ga('require', 'displayfeatures');
} else {
  window.ga = () => {}
  console.log('not analitycs for backgou')
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  ga(...request.params)
});
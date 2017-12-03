// @flow

import {ga, setRaven} from '../analytices-manager'
import * as Raven from 'raven-js'
import {setUpLinks, setUpShareMenu} from './search-resulst-page'
import {onNoneGooglePageLoad} from './targeted-page'

setRaven()


Raven.context(function () {
  $(document).ready(() => {
    if (window.location.href.indexOf('.google.') !== -1 && $('#searchform').length) {
      ga('send', 'pageview');
      setUpLinks()
      setUpShareMenu()
       ga('send', 'pageview', '/search-results')
    } else {
      onNoneGooglePageLoad()
    }
  })
})

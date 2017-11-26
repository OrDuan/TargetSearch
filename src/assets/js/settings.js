export const MIN_WORDS_TO_CUT = 3 // The minimum words count to have, until this threshold we wil try to take out word by word
export const SCROLLING_SPEED = 500 // How fast to scroll to the target text
export const MIN_CLICKS_BEFORE_SHOWING_SHARE_MENU = 5  // Clicks on out section links
export const MAX_CLICKS_BEFORE_DISABLING_SHARE_MENU = 20 // Clicks on out section links
export const MIN_RANK_TO_REDIRECT_TO_CHROME = 5 // If the user rank us this number or higher, we'll redirect him to chrome store
// TODO shorten the url to track it? can we fire an event when someone opens the link?
export const CHROME_STORE_ITEM_ID = 'nohmjponpgbnhjokbmagdbnjpnmdaigb' // Each app/extension has an id
export const CHROME_STORE_LINK = `https://chrome.google.com/webstore/detail/targetsearch/${CHROME_STORE_ITEM_ID}` // URL to the extension chrome store
export const CHROME_STORE_LINK_REVIEW = `https://chrome.google.com/webstore/detail/targetsearch/${CHROME_STORE_ITEM_ID}/reviews` // URL to the extension chrome store
export const RAVEN_DSN = 'https://fe0945129f1f4c0fb6eea719334fe744@sentry.io/247331' // The URL of Data Source Name, it's a public key!
export const TIME_BEFORE_RETRY_TO_SEARCH_TEXT = 1500 // Time in ms before calling the findText function again on a page with target text
export const TIME_BEFORE_DELETING_URL = 3000 // Time in ms before deleting the url key in the browser storage, used to handle multiple clicks on the same sectionlink

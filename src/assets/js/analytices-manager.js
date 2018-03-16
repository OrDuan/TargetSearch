import * as Raven from 'raven-js';
import * as settings from './settings';
import StorageManager from './storage-manager';

export function ga(...args) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({params: args}, response => {
        resolve(response);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function setRaven() {
  if (process.env.NODE_ENV === 'production') {
    Raven.config(settings.RAVEN_DSN, {
      release: process.env.RELEASE_STAMP,
    }).install();

    // To capture unhandled promises with sentry
    window.onunhandledrejection = function (evt) {
      Raven.captureException(evt);
    };

    let userData = await StorageManager.getUserData();
    Raven.setUserContext({
      id: userData['userData.uid'],
    });
  }
}



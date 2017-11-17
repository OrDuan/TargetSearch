class StorageManager {
  constructor() {
    this.userDataDefaults = {
      'userData.shareMenuCount': 0,
      'userData.disableShareMenu': false,
      'userData.extensionRanking': 0,
    }
  }

  get(items) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(items, responseItems => {
          resolve(responseItems)
        })
      }
      catch (e) {
        reject(e)
      }
    })
  }

  set(items) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set(items, responseItems => {
          resolve(responseItems)
        })
      }
      catch (e) {
        reject(e)
      }
    })
  }

  async getUserData() {
    let items = Object.keys(this.userDataDefaults)
    return {...this.userDataDefaults, ...await this.get(items)}
  }
}

export default new StorageManager()

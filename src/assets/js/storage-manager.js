// @flow

type userDataType = {
  'userData.shareMenuCount': number,
  'userData.disableShareMenu': boolean,
  'userData.extensionRanking': number,
  'userData.uid': string
}

class StorageManager {
  userDataDefaults: userDataType = {
    'userData.shareMenuCount': 0,
    'userData.disableShareMenu': false,
    'userData.extensionRanking': 0,
    'userData.uid': [...Array(30)].map(() => Math.random().toString(36)[3]).join(''), // random token
  }

  get(items: string | string[] | null): Promise<*> {
    return new Promise((resolve, reject) => {
      try {
        // $FlowFixMe The flow api isn't updated
        chrome.storage.local.get(items, responseItems => {
          resolve(responseItems)
        })
      }
      catch (e) {
        reject(e)
      }
    })
  }

  set(items: Object): Promise<any>  {
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

  async getUserData(): Promise<userDataType> {
    let items = Object.keys(this.userDataDefaults)
    return {...this.userDataDefaults, ...await this.get(items)}
  }
}

export default new StorageManager()

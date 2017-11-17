export default function ga(...args) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({params: args}, response => {
        resolve(response)
      })
    } catch (e) {
      reject(e)
    }
  })
}






setConnectionId();


function getRandomToken() {
  // E.g. 8 * 32 = 256 bits token
  var randomPool = new Uint8Array(32);
  crypto.getRandomValues(randomPool);
  var hex = "";
  for (var i = 0; i < randomPool.length; ++i) {
    hex += randomPool[i].toString(16);
  }
  // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
  return hex;
}

async function setConnectionId() {
  chrome.storage.sync.get("id").then((data) => {
    if (data.id) {
      console.log("Id found in storage", data.id);
    } else {
      const id = getRandomToken();
      chrome.storage.sync.set({ id });
    }
  });
}

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const popupSource = fs.readFileSync(path.join(__dirname, 'js/script.js'), 'utf8');
const contentSource = fs.readFileSync(path.join(__dirname, 'js/common.js'), 'utf8');
const quietConsole = { log() {}, warn() {}, error() {} };

async function createPopup(existingSession) {
  const elements = {};
  for (const id of ['enable-btn', 'not-supported', 'connect-info', 'connection-status', 'invite-info', 'qr', 'qr-link']) {
    elements[id] = { style: {}, hidden: false };
  }
  const image = {};
  const label = {};
  const sent = [];
  let onMessage;
  let injections = 0;
  const chrome = {
    runtime: { lastError: null, onMessage: { addListener: listener => { onMessage = listener; } } },
    tabs: {
      query: () => Promise.resolve([{ id: 7, url: 'https://www.youtube.com/watch' }]),
      sendMessage: (tabId, message, callback) => {
        sent.push(message);
        callback(message.type === 'get-connection-status' ? existingSession : 'ok');
      }
    },
    scripting: { executeScript: () => { injections++; return Promise.resolve(); } }
  };
  const context = {
    chrome,
    console: quietConsole,
    crypto: { getRandomValues: bytes => bytes },
    document: {
      getElementById: id => elements[id],
      querySelector: selector => selector.includes('img') ? image : label
    },
    QRious: class {},
    Uint8Array,
    window: {}
  };
  vm.runInNewContext(popupSource, context);
  await new Promise(resolve => setImmediate(resolve));
  return { elements, sent, onMessage, getInjections: () => injections };
}

test('popup restores the connected session and follows its recovery', async () => {
  const popup = await createPopup({ id: 'ABC123', stage: 2 });
  assert.equal(popup.getInjections(), 0);
  assert.equal(popup.elements['connection-status'].textContent, 'Connected');
  assert.equal(popup.elements['invite-info'].hidden, true);

  popup.onMessage({ type: 'connection-status', id: 'ABC123', stage: 4 }, { tab: { id: 99 } });
  assert.equal(popup.elements['invite-info'].hidden, true);
  popup.onMessage({ type: 'connection-status', id: 'ABC123', stage: 4 }, { tab: { id: 7 } });
  assert.equal(popup.elements['connection-status'].textContent, 'Reconnecting...');
  assert.equal(popup.elements['invite-info'].hidden, false);
  popup.onMessage({ type: 'connection-status', id: 'ABC123', stage: 3 }, { tab: { id: 7 } });
  assert.equal(popup.elements['invite-info'].hidden, true);
});

test('enabling starts one client and hides the invitation when connected', async () => {
  const popup = await createPopup(null);
  popup.elements['enable-btn'].onclick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(popup.getInjections(), 1);
  assert.equal(popup.sent[1].id, 'AAAAAA');
  popup.onMessage({ type: 'connection-status', id: 'AAAAAA', stage: 2 }, { tab: { id: 7 } });
  assert.equal(popup.elements['connection-status'].textContent, 'Connected');
  assert.equal(popup.elements['invite-info'].hidden, true);
});

test('content script reports and broadcasts its connection stage', () => {
  let onMessage;
  let clientArguments;
  let response;
  const broadcasts = [];
  const chrome = {
    runtime: {
      lastError: null,
      onMessage: { addListener: listener => { onMessage = listener; } },
      sendMessage: (message, callback) => { broadcasts.push(message); callback(); }
    }
  };
  const context = {
    chrome,
    console: quietConsole,
    window: {},
    WebRTCClient: class { constructor(...args) { clientArguments = args; } }
  };
  vm.runInNewContext(contentSource, context);
  onMessage({ id: 'ABC123' }, {}, () => {});
  assert.equal(clientArguments[5].maxReconnectAttempts, -1);
  clientArguments[4](2);
  onMessage({ type: 'get-connection-status' }, {}, result => { response = result; });
  assert.equal(response.id, 'ABC123');
  assert.equal(response.stage, 2);
  assert.equal(broadcasts[0].stage, 2);
  clientArguments[4](4);
  assert.equal(broadcasts[1].stage, 4);
});
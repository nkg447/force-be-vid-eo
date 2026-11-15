const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'js/script.js'), 'utf8');

function createApp(Client) {
  const classes = new Set();
  const bar = {
    textContent: '',
    classList: {
      add: name => classes.add(name),
      remove: name => classes.delete(name)
    }
  };
  const context = {
    console: { log() {}, error() {} },
    document: { getElementById: () => bar, addEventListener() {} },
    URLSearchParams,
    WebRTCClient: Client,
    window: { location: { search: '' } }
  };
  vm.runInNewContext(source, context);
  return { bar, classes, utils: context.window.playerUtils };
}

test('app displays connection and recovery stages', () => {
  let callbacks;
  const app = createApp(class {
    constructor(...args) { callbacks = args; }
    createOffer() {}
  });
  app.utils.initializeWebRTCClient('ABC123');
  assert.equal(callbacks[5].maxReconnectAttempts, -1);
  for (const [stage, text, connected] of [
    [0, 'Disconnected', false],
    [1, 'Waiting for peer...', false],
    [2, 'Connected', true],
    [3, 'Connected', true],
    [4, 'Reconnecting...', false],
    [5, 'Connection failed', false]
  ]) {
    callbacks[4](stage);
    assert.equal(app.bar.textContent, text);
    assert.equal(app.classes.has('connected'), connected);
  }
});

test('app displays client initialization failures', () => {
  const app = createApp(class { constructor() { throw new Error('failed'); } });
  assert.equal(app.utils.initializeWebRTCClient('ABC123'), null);
  assert.equal(app.bar.textContent, 'Connection failed');
  assert.equal(app.classes.has('connected'), false);
});
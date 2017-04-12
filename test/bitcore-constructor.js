import assert from 'assert';

import {BitcoreBlockchain} from '../lib/bitcore';
import {Stream} from '../lib/utils/stream';

// helper, ensuring that workers are killed on end of every test
var workers = [];
function killAllWorkers() {
  workers.forEach((w) => w.terminate());
  workers = [];
}

// hack for workers in both node and browser
var socketWorkerFactory = () => {
  var w = null;
  if (typeof Worker === 'undefined') {
    var TinyWorker = require('tiny-worker');
    w = new TinyWorker(() => {
      require('babel-register');
      require('../../../lib/socketio-worker/inside.js');
    });
  } else {
    w = new Worker('../../lib/socketio-worker/inside.js');
  }

  workers.push(w);
  return w;
}

describe('bitcore', () => {
  describe('constructor', () => {
    var blockchain = new BitcoreBlockchain(['https://nonsense.com'], socketWorkerFactory);

    it('creates something', () => {
      assert.ok(blockchain);
    });

    it('looks like blockchain object before initialization', () => {
      assert.ok(blockchain.errors instanceof Stream);
      assert.ok(blockchain.notifications instanceof Stream);
      assert.ok(blockchain.blocks instanceof Stream);

      assert.ok(blockchain.addresses instanceof Set);

      assert.ok(blockchain.socket.promise instanceof Promise);
      assert.ok(blockchain.endpoints instanceof Array);
      assert.ok(blockchain.workingUrl === 'none');
      assert.ok(typeof blockchain.zcash === 'boolean');
    });

    killAllWorkers();
  });
});

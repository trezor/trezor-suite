import assert from 'assert';
import Worker from 'tiny-worker';

import {BitcoreBlockchain} from '../lib/bitcore';
import {Stream} from '../lib/utils/stream';

// helper, ensuring that workers are killed on end of every test
var workers = [];
function killAllWorkers() {
  workers.forEach((w) => w.terminate());
  workers = [];
}

var socketWorkerFactory = () => {
   var w = new Worker(() => {
      require('babel-register');
      require('../../../lib/socketio-worker/inside.js');
   });

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

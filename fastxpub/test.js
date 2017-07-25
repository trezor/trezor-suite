var fastxpub = require('./fastxpub');
var fs = require('fs');
var file = fs.readFileSync('fastxpub.wasm');

function test_derivation(xpub, version, addressFormat, filename) {
  var bitcoin  = require('bitcoinjs-lib');
  var node = bitcoin.HDNode.fromBase58(xpub).derive(0);

  var nodeStruct = {
    depth: node.depth,
    child_num: node.index,
    fingerprint: node.parentFingerprint,
    chain_code: node.chainCode,
    public_key: node.keyPair.getPublicKeyBuffer()
  };

  var addresses = fastxpub.deriveAddressRange(nodeStruct, 0, 999, version, addressFormat);

  var correct = fs.readFileSync(filename).toString().split("\n");

  for (var i = 0; i <= 999; i++) {
    if (correct[i] !== addresses[i]) {
      console.log("FAILED", i, correct[i], addresses[i]);
      return false;
    }
  }
  return true;
}

fastxpub.init(file).then(() => {

    var success;

    success = test_derivation('xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy', 0, 0, 'test-addresses.txt');
    if (!success) process.exit(1);

    success = test_derivation('xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx', 5, 1, 'test-addresses-segwit-p2sh.txt');
    if (!success) process.exit(1);

    console.log('PASSED');
    process.exit(0);
});

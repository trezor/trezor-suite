const bitcore = require('bitcore-lib');

const { PublicKey } = bitcore;
const { BufferWriter } = bitcore.encoding;
const { Signature, ECDSA, Hash } = bitcore.crypto;
const { sha256sha256, sha256 } = Hash;

function verify(hiddenChallenge, visualChallenge, pubKey, signature, version) {
    hiddenChallenge = Buffer.from(hiddenChallenge, 'hex');
    visualChallenge = Buffer.from(visualChallenge);
    pubKey = new PublicKey(Buffer.from(pubKey, 'hex'));
    signature = Signature.fromCompact(Buffer.from(signature, 'hex'));

    let message;

    if (version === 1) {
        message = Buffer.concat([hiddenChallenge, visualChallenge]);
    } else if (version === 2) {
        message = Buffer.concat([sha256(hiddenChallenge), sha256(visualChallenge)]);
    } else {
        throw new Error('Unknown version');
    }

    const magicBytes = Buffer.from('Bitcoin Signed Message:\n');
    const prefix1 = BufferWriter.varintBufNum(magicBytes.length);
    const prefix2 = BufferWriter.varintBufNum(message.length);
    const buf = Buffer.concat([prefix1, magicBytes, prefix2, message]);
    const hash = sha256sha256(buf);

    return ECDSA.verify(hash, signature, pubKey);
}

const hidden = 'cd8552569d6e4509266ef137584d1e62c7579b5b8ed69bbafa4b864c6521e7c2'; // Use random value
const visual = '2015-03-23 17:39:22';
const pubKey = '023a472219ad3327b07c18273717bb3a40b39b743756bf287fbd5fa9d263237f45';
const signature =
    '20f2d1a42d08c3a362be49275c3ffeeaa415fc040971985548b9f910812237bb41770bf2c8d488428799fbb7e52c11f1a3404011375e4080e077e0e42ab7a5ba02';

// eslint-disable-next-line no-console
console.log(verify(hidden, visual, pubKey, signature, 2));

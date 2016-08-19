/* @flow */

// Module for verifying ECDSA signature of configuration.

import {ECPair, ECSignature, crypto} from "bitcoinjs-lib";

import BigInteger from "bigi";

/* eslint-disable quotes */
const SATOSHI_KEYS: Array<string> = [
  '\x04\xd5\x71\xb7\xf1\x48\xc5\xe4\x23\x2c\x38\x14\xf7\x77\xd8\xfa\xea\xf1\xa8\x42\x16\xc7\x8d\x56\x9b\x71\x04\x1f\xfc\x76\x8a\x5b\x2d\x81\x0f\xc3\xbb\x13\x4d\xd0\x26\xb5\x7e\x65\x00\x52\x75\xae\xde\xf4\x3e\x15\x5f\x48\xfc\x11\xa3\x2e\xc7\x90\xa9\x33\x12\xbd\x58',
  '\x04\x63\x27\x9c\x0c\x08\x66\xe5\x0c\x05\xc7\x99\xd3\x2b\xd6\xba\xb0\x18\x8b\x6d\xe0\x65\x36\xd1\x10\x9d\x2e\xd9\xce\x76\xcb\x33\x5c\x49\x0e\x55\xae\xe1\x0c\xc9\x01\x21\x51\x32\xe8\x53\x09\x7d\x54\x32\xed\xa0\x6b\x79\x20\x73\xbd\x77\x40\xc9\x4c\xe4\x51\x6c\xb1',
  '\x04\x43\xae\xdb\xb6\xf7\xe7\x1c\x56\x3f\x8e\xd2\xef\x64\xec\x99\x81\x48\x25\x19\xe7\xef\x4f\x4a\xa9\x8b\x27\x85\x4e\x8c\x49\x12\x6d\x49\x56\xd3\x00\xab\x45\xfd\xc3\x4c\xd2\x6b\xc8\x71\x0d\xe0\xa3\x1d\xbd\xf6\xde\x74\x35\xfd\x0b\x49\x2b\xe7\x0a\xc7\x5f\xde\x58',
  '\x04\x87\x7c\x39\xfd\x7c\x62\x23\x7e\x03\x82\x35\xe9\xc0\x75\xda\xb2\x61\x63\x0f\x78\xee\xb8\xed\xb9\x24\x87\x15\x9f\xff\xed\xfd\xf6\x04\x6c\x6f\x8b\x88\x1f\xa4\x07\xc4\xa4\xce\x6c\x28\xde\x0b\x19\xc1\xf4\xe2\x9f\x1f\xcb\xc5\xa5\x8f\xfd\x14\x32\xa3\xe0\x93\x8a',
  '\x04\x73\x84\xc5\x1a\xe8\x1a\xdd\x0a\x52\x3a\xdb\xb1\x86\xc9\x1b\x90\x6f\xfb\x64\xc2\xc7\x65\x80\x2b\xf2\x6d\xbd\x13\xbd\xf1\x2c\x31\x9e\x80\xc2\x21\x3a\x13\x6c\x8e\xe0\x3d\x78\x74\xfd\x22\xb7\x0d\x68\xe7\xde\xe4\x69\xde\xcf\xbb\xb5\x10\xee\x9a\x46\x0c\xda\x45',
];
/* eslint-enable */

const keys: Array<Buffer> = SATOSHI_KEYS.map(key => new Buffer(key, `binary`));

// Verifies ECDSA signature
// pubkeys - Public keys
// signature - ECDSA signature (concatenated R and S, both 32 bytes)
// data - Data that are signed
// returns True, iff the signature is correct with any of the pubkeys
function verify(pubkeys: Array<Buffer>, bsignature: Buffer, data: Buffer): boolean {
  const r = BigInteger.fromBuffer(bsignature.slice(0, 32));
  const s = BigInteger.fromBuffer(bsignature.slice(32));
  const signature = new ECSignature(r, s);

  const hash = crypto.sha256(data);

  return pubkeys.some(pubkey => {
    const pair = ECPair.fromPublicKeyBuffer(pubkey);
    return pair.verify(hash, signature);
  });
}

// Verifies if a given data is a correctly signed config
// Returns the data, if correctly signed, else throws
export function verifyHexBin(data: string): Buffer {
  const signature = new Buffer(data.slice(0, 64 * 2), `hex`);
  const dataB = new Buffer(data.slice(64 * 2), `hex`);
  const verified = verify(keys, signature, dataB);
  if (!verified) {
    throw new Error(`Not correctly signed.`);
  } else {
    return dataB;
  }
}

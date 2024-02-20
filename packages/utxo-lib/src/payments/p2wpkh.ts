// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/p2wpkh.ts

import ecc from 'tiny-secp256k1';
import { bech32 } from 'bech32';
import * as bcrypto from '../crypto';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import { Payment, PaymentOpts, typeforce } from '../types';
import * as lazy from './lazy';

const { OPS } = bscript;

const EMPTY_BUFFER = Buffer.alloc(0);

// witness: {signature} {pubKey}
// input: <>
// output: OP_0 {pubKeyHash}
export function p2wpkh(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.hash && !a.output && !a.pubkey && !a.witness)
        throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typeforce(
        {
            address: typeforce.maybe(typeforce.String),
            hash: typeforce.maybe(typeforce.BufferN(20)),
            input: typeforce.maybe(typeforce.BufferN(0)),
            network: typeforce.maybe(typeforce.Object),
            output: typeforce.maybe(typeforce.BufferN(22)),
            pubkey: typeforce.maybe(ecc.isPoint),
            signature: typeforce.maybe(bscript.isCanonicalScriptSignature),
            witness: typeforce.maybe(typeforce.arrayOf(typeforce.Buffer)),
        },
        a,
    );

    const _address = lazy.value(() => {
        const result = bech32.decode(a.address!);
        const version = result.words.shift();
        const data = bech32.fromWords(result.words);

        return {
            version,
            prefix: result.prefix,
            data: Buffer.from(data),
        };
    });

    const network = a.network || BITCOIN_NETWORK;
    const o: Payment = { name: 'p2wpkh', network };

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;

        const words = bech32.toWords(o.hash);
        words.unshift(0x00);

        return bech32.encode(network.bech32, words);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.subarray(2, 22);
        if (a.address) return _address().data;
        if (a.pubkey || o.pubkey) return bcrypto.hash160(a.pubkey! || o.pubkey!);
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;

        return bscript.compile([OPS.OP_0, o.hash]);
    });
    lazy.prop(o, 'pubkey', () => {
        if (a.pubkey) return a.pubkey;
        if (!a.witness) return;

        return a.witness[1];
    });
    lazy.prop(o, 'signature', () => {
        if (!a.witness) return;

        return a.witness[0];
    });
    lazy.prop(o, 'input', () => {
        if (!o.witness) return;

        return EMPTY_BUFFER;
    });
    lazy.prop(o, 'witness', () => {
        if (!a.pubkey) return;
        if (!a.signature) return;

        return [a.signature, a.pubkey];
    });

    // extended validation
    if (opts.validate) {
        let hash = Buffer.from([]);
        if (a.address) {
            const { prefix, version, data } = _address();
            if (network && network.bech32 !== prefix)
                throw new TypeError('Invalid prefix or Network mismatch');
            if (version !== 0x00) throw new TypeError('Invalid address version');
            if (data.length !== 20) throw new TypeError('Invalid address data');
            hash = data;
        }

        if (a.hash) {
            if (hash.length > 0 && !hash.equals(a.hash)) throw new TypeError('Hash mismatch');
            else hash = a.hash;
        }

        if (a.output) {
            if (a.output.length !== 22 || a.output[0] !== OPS.OP_0 || a.output[1] !== 0x14)
                throw new TypeError('Output is invalid');
            if (hash.length > 0 && !hash.equals(a.output.subarray(2)))
                throw new TypeError('Hash mismatch');
            else hash = a.output.subarray(2);
        }

        if (a.pubkey) {
            const pkh = bcrypto.hash160(a.pubkey);
            if (hash.length > 0 && !hash.equals(pkh)) throw new TypeError('Hash mismatch');
            else hash = pkh;
            if (!ecc.isPoint(a.pubkey) || a.pubkey.length !== 33)
                throw new TypeError('Invalid pubkey for p2wpkh');
        }

        if (a.witness) {
            if (a.witness.length !== 2) throw new TypeError('Witness is invalid');
            if (!bscript.isCanonicalScriptSignature(a.witness[0]))
                throw new TypeError('Witness has invalid signature');
            if (!ecc.isPoint(a.witness[1]) || a.witness[1].length !== 33)
                throw new TypeError('Witness has invalid pubkey');

            if (a.signature && !a.signature.equals(a.witness[0]))
                throw new TypeError('Signature mismatch');
            if (a.pubkey && !a.pubkey.equals(a.witness[1])) throw new TypeError('Pubkey mismatch');

            const pkh = bcrypto.hash160(a.witness[1]);
            if (hash.length > 0 && !hash.equals(pkh)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

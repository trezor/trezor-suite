// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/p2pkh.ts
// differences:
// - using bs58check.decodeAddress instead of bs58check.decode
// - using bs58check.encodeAddress instead of bs58check.encode

import ecc from 'tiny-secp256k1';
import * as bs58check from '../bs58check';
import * as bcrypto from '../crypto';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import { Payment, PaymentOpts, StackFunction, typeforce } from '../types';

const { OPS } = bscript;

// input: {signature} {pubkey}
// output: OP_DUP OP_HASH160 {hash160(pubkey)} OP_EQUALVERIFY OP_CHECKSIG
export function p2pkh(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.hash && !a.output && !a.pubkey && !a.input)
        throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typeforce(
        {
            network: typeforce.maybe(typeforce.Object),
            address: typeforce.maybe(typeforce.String),
            hash: typeforce.maybe(typeforce.BufferN(20)),
            output: typeforce.maybe(typeforce.BufferN(25)),

            pubkey: typeforce.maybe(ecc.isPoint),
            signature: typeforce.maybe(bscript.isCanonicalScriptSignature),
            input: typeforce.maybe(typeforce.Buffer),
        },
        a,
    );

    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, a.network));

    const _chunks = lazy.value(() => bscript.decompile(a.input!)) as StackFunction;

    const network = a.network || BITCOIN_NETWORK;
    const o: Payment = { name: 'p2pkh', network };

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;

        return bs58check.encodeAddress(o.hash, network.pubKeyHash, network);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.subarray(3, 23);
        if (a.address) return _address().hash;
        if (a.pubkey || o.pubkey) return bcrypto.hash160(a.pubkey! || o.pubkey!);
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;

        return bscript.compile([
            OPS.OP_DUP,
            OPS.OP_HASH160,
            o.hash,
            OPS.OP_EQUALVERIFY,
            OPS.OP_CHECKSIG,
        ]);
    });
    lazy.prop(o, 'pubkey', () => {
        if (!a.input) return;

        return _chunks()[1] as Buffer;
    });
    lazy.prop(o, 'signature', () => {
        if (!a.input) return;

        return _chunks()[0] as Buffer;
    });
    lazy.prop(o, 'input', () => {
        if (!a.pubkey) return;
        if (!a.signature) return;

        return bscript.compile([a.signature, a.pubkey]);
    });
    lazy.prop(o, 'witness', () => {
        if (!o.input) return;

        return [];
    });

    // extended validation
    if (opts.validate) {
        let hash = Buffer.from([]);
        if (a.address) {
            const { version, hash: aHash } = _address();
            if (version !== network.pubKeyHash)
                throw new TypeError('Invalid version or Network mismatch');
            if (aHash.length !== 20) throw new TypeError('Invalid address');
            hash = aHash;
        }

        if (a.hash) {
            if (hash.length > 0 && !hash.equals(a.hash)) throw new TypeError('Hash mismatch');
            else hash = a.hash;
        }

        if (a.output) {
            if (
                a.output.length !== 25 ||
                a.output[0] !== OPS.OP_DUP ||
                a.output[1] !== OPS.OP_HASH160 ||
                a.output[2] !== 0x14 ||
                a.output[23] !== OPS.OP_EQUALVERIFY ||
                a.output[24] !== OPS.OP_CHECKSIG
            )
                throw new TypeError('Output is invalid');

            const hash2 = a.output.subarray(3, 23);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
            else hash = hash2;
        }

        if (a.pubkey) {
            const pkh = bcrypto.hash160(a.pubkey);
            if (hash.length > 0 && !hash.equals(pkh)) throw new TypeError('Hash mismatch');
            else hash = pkh;
        }

        if (a.input) {
            const chunks = _chunks();
            if (chunks.length !== 2) throw new TypeError('Input is invalid');
            if (!bscript.isCanonicalScriptSignature(chunks[0] as Buffer))
                throw new TypeError('Input has invalid signature');
            if (!ecc.isPoint(chunks[1])) throw new TypeError('Input has invalid pubkey');

            if (a.signature && !a.signature.equals(chunks[0] as Buffer))
                throw new TypeError('Signature mismatch');
            if (a.pubkey && !a.pubkey.equals(chunks[1] as Buffer))
                throw new TypeError('Pubkey mismatch');

            const pkh = bcrypto.hash160(chunks[1] as Buffer);
            if (hash.length > 0 && !hash.equals(pkh)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

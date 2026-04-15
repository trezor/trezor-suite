// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/p2wpkh.ts

import { bech32 } from '@scure/base';

import * as bcrypto from '../crypto';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as ecc from '../noble-compatibility';
import * as bscript from '../script';
import { type Payment, type PaymentOpts } from '../types';
import * as lazy from './lazy';
import { BufferNSchema, BufferSchema, Point, Type, assertType } from '../types/validation';

const { OPS } = bscript;

const EMPTY_BUFFER = Buffer.alloc(0);

// witness: {signature} {pubKey}
// input: <>
// output: OP_0 {pubKeyHash}
export function p2wpkh(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.hash && !a.output && !a.pubkey && !a.witness)
        throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    assertType(
        Type.Object(
            {
                address: Type.Optional(Type.String()),
                hash: Type.Optional(BufferNSchema(20)),
                input: Type.Optional(BufferNSchema(0)),
                network: Type.Optional(Type.Object({}, { additionalProperties: true })),
                output: Type.Optional(BufferNSchema(22)),
                pubkey: Type.Optional(Point),
                signature: Type.Optional(BufferSchema),
                witness: Type.Optional(Type.Array(BufferSchema)),
            },
            { additionalProperties: true },
        ),
        a,
    );

    if (a.signature && !bscript.isCanonicalScriptSignature(a.signature))
        throw new TypeError('Expected canonical script signature');

    const _address = lazy.value(() => {
        const result = bech32.decode(a.address! as `${string}1${string}`);
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

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const op0: number = OPS.OP_0;

        return bscript.compile([op0, o.hash]);
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
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const witnessSig: Buffer = a.witness[0];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const witnessPubkey: Buffer = a.witness[1];
            if (!bscript.isCanonicalScriptSignature(witnessSig))
                throw new TypeError('Witness has invalid signature');
            if (!ecc.isPoint(witnessPubkey) || witnessPubkey.length !== 33)
                throw new TypeError('Witness has invalid pubkey');

            if (a.signature && !a.signature.equals(witnessSig))
                throw new TypeError('Signature mismatch');
            if (a.pubkey && !a.pubkey.equals(witnessPubkey)) throw new TypeError('Pubkey mismatch');

            const pkh = bcrypto.hash160(witnessPubkey);
            if (hash.length > 0 && !hash.equals(pkh)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

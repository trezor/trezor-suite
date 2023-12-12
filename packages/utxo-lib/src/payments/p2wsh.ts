// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/p2wsh.ts

import ecc from 'tiny-secp256k1';
import { bech32 } from 'bech32';
import * as bcrypto from '../crypto';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import { Payment, PaymentOpts, StackElement, StackFunction, typeforce } from '../types';

const { OPS } = bscript;

const EMPTY_BUFFER = Buffer.alloc(0);

function stacksEqual(a: Buffer[], b: Buffer[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((x, i) => x.equals(b[i]));
}

function chunkHasUncompressedPubkey(chunk: StackElement): boolean {
    if (Buffer.isBuffer(chunk) && chunk.length === 65 && chunk[0] === 0x04 && ecc.isPoint(chunk)) {
        return true;
    }
    return false;
}

// input: <>
// witness: [redeemScriptSig ...] {redeemScript}
// output: OP_0 {sha256(redeemScript)}
export function p2wsh(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.hash && !a.output && !a.redeem && !a.witness)
        throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typeforce(
        {
            network: typeforce.maybe(typeforce.Object),

            address: typeforce.maybe(typeforce.String),
            hash: typeforce.maybe(typeforce.BufferN(32)),
            output: typeforce.maybe(typeforce.BufferN(34)),

            redeem: typeforce.maybe({
                input: typeforce.maybe(typeforce.Buffer),
                network: typeforce.maybe(typeforce.Object),
                output: typeforce.maybe(typeforce.Buffer),
                witness: typeforce.maybe(typeforce.arrayOf(typeforce.Buffer)),
            }),
            input: typeforce.maybe(typeforce.BufferN(0)),
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

    const _rchunks = lazy.value(() => bscript.decompile(a.redeem!.input!)) as StackFunction;

    let { network } = a;
    if (!network) {
        network = (a.redeem && a.redeem.network) || BITCOIN_NETWORK;
    }

    const o: Payment = { name: 'p2wsh', network };

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;
        const words = bech32.toWords(o.hash);
        words.unshift(0x00);
        return bech32.encode(network!.bech32, words);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.subarray(2);
        if (a.address) return _address().data;
        if (o.redeem && o.redeem.output) return bcrypto.sha256(o.redeem.output);
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;
        return bscript.compile([OPS.OP_0, o.hash]);
    });
    lazy.prop(o, 'redeem', () => {
        if (!a.witness) return;
        return {
            output: a.witness[a.witness.length - 1],
            input: EMPTY_BUFFER,
            witness: a.witness.slice(0, -1),
        };
    });
    lazy.prop(o, 'input', () => {
        if (!o.witness) return;
        return EMPTY_BUFFER;
    });
    lazy.prop(o, 'witness', () => {
        // transform redeem input to witness stack?
        if (
            a.redeem &&
            a.redeem.input &&
            a.redeem.input.length > 0 &&
            a.redeem.output &&
            a.redeem.output.length > 0
        ) {
            const stack = bscript.toStack(_rchunks());

            // assign, and blank the existing input
            o.redeem = Object.assign({ witness: stack }, a.redeem);
            o.redeem.input = EMPTY_BUFFER;
            return ([] as Buffer[]).concat(stack, a.redeem.output);
        }

        if (!a.redeem) return;
        if (!a.redeem.output) return;
        if (!a.redeem.witness) return;
        return ([] as Buffer[]).concat(a.redeem.witness, a.redeem.output);
    });
    lazy.prop(o, 'name', () => {
        const nameParts = ['p2wsh'];
        if (o.redeem !== undefined && o.redeem.name !== undefined) nameParts.push(o.redeem.name!);
        return nameParts.join('-');
    });

    // extended validation
    if (opts.validate) {
        let hash = Buffer.from([]);
        if (a.address) {
            const { prefix, version, data } = _address();
            if (prefix !== network.bech32)
                throw new TypeError('Invalid prefix or Network mismatch');
            if (version !== 0x00) throw new TypeError('Invalid address version');
            if (data.length !== 32) throw new TypeError('Invalid address data');
            hash = data;
        }

        if (a.hash) {
            if (hash.length > 0 && !hash.equals(a.hash)) throw new TypeError('Hash mismatch');
            else hash = a.hash;
        }

        if (a.output) {
            if (a.output.length !== 34 || a.output[0] !== OPS.OP_0 || a.output[1] !== 0x20)
                throw new TypeError('Output is invalid');
            const hash2 = a.output.subarray(2);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
            else hash = hash2;
        }

        if (a.redeem) {
            if (a.redeem.network && a.redeem.network !== network)
                throw new TypeError('Network mismatch');

            // is there two redeem sources?
            if (
                a.redeem.input &&
                a.redeem.input.length > 0 &&
                a.redeem.witness &&
                a.redeem.witness.length > 0
            )
                throw new TypeError('Ambiguous witness source');

            // is the redeem output non-empty?
            if (a.redeem.output) {
                if (bscript.decompile(a.redeem.output)!.length === 0)
                    throw new TypeError('Redeem.output is invalid');

                // match hash against other sources
                const hash2 = bcrypto.sha256(a.redeem.output);
                if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
                else hash = hash2;
            }

            if (a.redeem.input && !bscript.isPushOnly(_rchunks()))
                throw new TypeError('Non push-only scriptSig');
            if (a.witness && a.redeem.witness && !stacksEqual(a.witness, a.redeem.witness))
                throw new TypeError('Witness and redeem.witness mismatch');
            if (
                (a.redeem.input && _rchunks().some(chunkHasUncompressedPubkey)) ||
                (a.redeem.output &&
                    (bscript.decompile(a.redeem.output) || []).some(chunkHasUncompressedPubkey))
            ) {
                throw new TypeError('redeem.input or redeem.output contains uncompressed pubkey');
            }
        }

        if (a.witness && a.witness.length > 0) {
            const wScript = a.witness[a.witness.length - 1];
            if (a.redeem && a.redeem.output && !a.redeem.output.equals(wScript))
                throw new TypeError('Witness and redeem.output mismatch');
            if (
                a.witness.some(chunkHasUncompressedPubkey) ||
                (bscript.decompile(wScript) || []).some(chunkHasUncompressedPubkey)
            )
                throw new TypeError('Witness contains uncompressed pubkey');
        }
    }

    return Object.assign(o, a);
}

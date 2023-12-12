// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/p2sh.ts
// differences:
// - using bs58check.decodeAddress instead of bs58check.decode
// - using bs58check.encodeAddress instead of bs58check.encode

import * as bs58check from '../bs58check';
import * as bcrypto from '../crypto';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import { Payment, PaymentFunction, PaymentOpts, Stack, StackFunction, typeforce } from '../types';

const { OPS } = bscript;

function stacksEqual(a: Buffer[], b: Buffer[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((x, i) => x.equals(b[i]));
}

// input: [redeemScriptSig ...] {redeemScript}
// witness: <?>
// output: OP_HASH160 {hash160(redeemScript)} OP_EQUAL
export function p2sh(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.hash && !a.output && !a.redeem && !a.input)
        throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typeforce(
        {
            network: typeforce.maybe(typeforce.Object),

            address: typeforce.maybe(typeforce.String),
            hash: typeforce.maybe(typeforce.BufferN(20)),
            output: typeforce.maybe(typeforce.BufferN(23)),

            redeem: typeforce.maybe({
                network: typeforce.maybe(typeforce.Object),
                output: typeforce.maybe(typeforce.Buffer),
                input: typeforce.maybe(typeforce.Buffer),
                witness: typeforce.maybe(typeforce.arrayOf(typeforce.Buffer)),
            }),
            input: typeforce.maybe(typeforce.Buffer),
            witness: typeforce.maybe(typeforce.arrayOf(typeforce.Buffer)),
        },
        a,
    );

    let { network } = a;
    if (!network) {
        network = (a.redeem && a.redeem.network) || BITCOIN_NETWORK;
    }

    const o: Payment = { name: 'p2sh', network };

    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, a.network));

    const _chunks = lazy.value(() => bscript.decompile(a.input!)) as StackFunction;

    const _redeem = lazy.value((): Payment => {
        const chunks = _chunks();
        return {
            network,
            output: chunks[chunks.length - 1] as Buffer,
            input: bscript.compile(chunks.slice(0, -1)),
            witness: a.witness || [],
        };
    }) as PaymentFunction;

    // output dependents
    lazy.prop(o, 'address', () => {
        if (!o.hash) return;
        return bs58check.encodeAddress(o.hash, network!.scriptHash, network);
    });
    lazy.prop(o, 'hash', () => {
        // in order of least effort
        if (a.output) return a.output.subarray(2, 22);
        if (a.address) return _address().hash;
        if (o.redeem && o.redeem.output) return bcrypto.hash160(o.redeem.output);
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;
        return bscript.compile([OPS.OP_HASH160, o.hash, OPS.OP_EQUAL]);
    });

    // input dependents
    lazy.prop(o, 'redeem', () => {
        if (!a.input) return;
        return _redeem();
    });
    lazy.prop(o, 'input', () => {
        if (!a.redeem || !a.redeem.input || !a.redeem.output) return;
        return bscript.compile(
            ([] as Stack).concat(bscript.decompile(a.redeem.input) as Stack, a.redeem.output),
        );
    });
    lazy.prop(o, 'witness', () => {
        if (o.redeem && o.redeem.witness) return o.redeem.witness;
        if (o.input) return [];
    });
    lazy.prop(o, 'name', () => {
        const nameParts = ['p2sh'];
        if (o.redeem !== undefined && o.redeem.name !== undefined) nameParts.push(o.redeem.name!);
        return nameParts.join('-');
    });

    if (opts.validate) {
        let hash = Buffer.from([]);
        if (a.address) {
            const { version, hash: aHash } = _address();
            if (version !== network.scriptHash)
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
                a.output.length !== 23 ||
                a.output[0] !== OPS.OP_HASH160 ||
                a.output[1] !== 0x14 ||
                a.output[22] !== OPS.OP_EQUAL
            )
                throw new TypeError('Output is invalid');

            const hash2 = a.output.subarray(2, 22);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
            else hash = hash2;
        }

        // inlined to prevent 'no-inner-declarations' failing
        const checkRedeem = (redeem: Payment): void => {
            // is the redeem output empty/invalid?
            if (redeem.output) {
                const decompile = bscript.decompile(redeem.output);
                if (!decompile || decompile.length < 1)
                    throw new TypeError('Redeem.output too short');

                // match hash against other sources
                const hash2 = bcrypto.hash160(redeem.output);
                if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
                else hash = hash2;
            }

            if (redeem.input) {
                const hasInput = redeem.input.length > 0;
                const hasWitness = redeem.witness && redeem.witness.length > 0;
                if (!hasInput && !hasWitness) throw new TypeError('Empty input');
                if (hasInput && hasWitness) throw new TypeError('Input and witness provided');
                if (hasInput) {
                    const richunks = bscript.decompile(redeem.input) as Stack;
                    if (!bscript.isPushOnly(richunks))
                        throw new TypeError('Non push-only scriptSig');
                }
            }
        };

        if (a.input) {
            const chunks = _chunks();
            if (!chunks || chunks.length < 1) throw new TypeError('Input too short');
            if (!Buffer.isBuffer(_redeem().output)) throw new TypeError('Input is invalid');

            checkRedeem(_redeem());
        }

        if (a.redeem) {
            if (a.redeem.network && a.redeem.network !== network)
                throw new TypeError('Network mismatch');
            if (a.input) {
                const redeem = _redeem();
                if (a.redeem.output && !a.redeem.output.equals(redeem.output!))
                    throw new TypeError('Redeem.output mismatch');
                if (a.redeem.input && !a.redeem.input.equals(redeem.input!))
                    throw new TypeError('Redeem.input mismatch');
            }

            checkRedeem(a.redeem);
        }

        if (a.witness) {
            if (a.redeem && a.redeem.witness && !stacksEqual(a.redeem.witness, a.witness))
                throw new TypeError('Witness and redeem.witness mismatch');
        }
    }

    return Object.assign(o, a);
}

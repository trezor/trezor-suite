// https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/p2pk.ts

import * as ecc from 'tiny-secp256k1';
import * as typef from 'typeforce';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import type { Payment, PaymentOpts, StackFunction } from './index';

const { OPS } = bscript;

// input: {signature}
// output: {pubKey} OP_CHECKSIG
export function p2pk(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.input && !a.output && !a.pubkey && !a.input && !a.signature)
        throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typef(
        {
            network: typef.maybe(typef.Object),
            output: typef.maybe(typef.Buffer),
            pubkey: typef.maybe(ecc.isPoint),

            signature: typef.maybe(bscript.isCanonicalScriptSignature),
            input: typef.maybe(typef.Buffer),
        },
        a,
    );

    const _chunks = lazy.value(() => bscript.decompile(a.input!)) as StackFunction;

    const network = a.network || BITCOIN_NETWORK;
    const o: Payment = { name: 'p2pk', network };

    lazy.prop(o, 'output', () => {
        if (!a.pubkey) return;
        return bscript.compile([a.pubkey, OPS.OP_CHECKSIG]);
    });
    lazy.prop(o, 'pubkey', () => {
        if (!a.output) return;
        return a.output.slice(1, -1);
    });
    lazy.prop(o, 'signature', () => {
        if (!a.input) return;
        return _chunks()[0] as Buffer;
    });
    lazy.prop(o, 'input', () => {
        if (!a.signature) return;
        return bscript.compile([a.signature]);
    });
    lazy.prop(o, 'witness', () => {
        if (!o.input) return;
        return [];
    });

    // extended validation
    if (opts.validate) {
        if (a.output) {
            if (a.output[a.output.length - 1] !== OPS.OP_CHECKSIG)
                throw new TypeError('Output is invalid');
            if (!ecc.isPoint(o.pubkey)) throw new TypeError('Output pubkey is invalid');
            if (a.pubkey && !a.pubkey.equals(o.pubkey!)) throw new TypeError('Pubkey mismatch');
        }

        if (a.signature) {
            if (a.input && !a.input.equals(o.input!)) throw new TypeError('Signature mismatch');
        }

        if (a.input) {
            if (_chunks().length !== 1) throw new TypeError('Input is invalid');
            if (!bscript.isCanonicalScriptSignature(o.signature!))
                throw new TypeError('Input has invalid signature');
        }
    }

    return Object.assign(o, a);
}

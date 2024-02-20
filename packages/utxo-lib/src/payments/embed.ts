// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/payments/embed.ts

import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import { Payment, PaymentOpts, Stack, typeforce } from '../types';

const { OPS } = bscript;

function stacksEqual(a: Buffer[], b: Buffer[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((x, i) => x.equals(b[i]));
}

// output: OP_RETURN ...
export function p2data(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.data && !a.output) throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typeforce(
        {
            network: typeforce.maybe(typeforce.Object),
            output: typeforce.maybe(typeforce.Buffer),
            data: typeforce.maybe(typeforce.arrayOf(typeforce.Buffer)),
        },
        a,
    );

    const network = a.network || BITCOIN_NETWORK;
    const o: Payment = { name: 'embed', network };

    lazy.prop(o, 'output', () => {
        if (!a.data) return;

        return bscript.compile(([OPS.OP_RETURN] as Stack).concat(a.data));
    });
    lazy.prop(o, 'data', () => {
        if (!a.output) return;

        return bscript.decompile(a.output)!.slice(1);
    });

    // extended validation
    if (opts.validate) {
        if (a.output) {
            const chunks = bscript.decompile(a.output);
            if (chunks![0] !== OPS.OP_RETURN) throw new TypeError('Output is invalid');
            if (!chunks!.slice(1).every(typeforce.Buffer)) throw new TypeError('Output is invalid');

            if (a.data && !stacksEqual(a.data, o.data as Buffer[]))
                throw new TypeError('Data mismatch');
        }
    }

    return Object.assign(o, a);
}

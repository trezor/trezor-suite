import * as typef from 'typeforce';
import * as bs58check from '../bs58check';
import { decred as DECRED_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import type { Payment, PaymentOpts, Stack } from './index';

const { OPS } = bscript;

// Decred Stake change
// OP_SSTXCHANGE OP_DUP OP_HASH160 {pubKeyHash} OP_EQUALVERIFY OP_CHECKSIG

export function sstxchange(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.hash && !a.output) throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typef(
        {
            network: typef.maybe(typef.Object),
            address: typef.maybe(typef.String),
            hash: typef.maybe(typef.BufferN(20)),
            output: typef.maybe(typef.Buffer),
        },
        a,
    );

    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, a.network));

    const network = a.network || DECRED_NETWORK;
    const o = { name: 'sstxchange', network } as Payment;

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;
        return bs58check.encodeAddress(o.hash, network.pubKeyHash, network);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.slice(4, 24);
        if (a.address) return _address().hash;
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;
        return bscript.compile([
            OPS.OP_SSTXCHANGE,
            OPS.OP_DUP,
            OPS.OP_HASH160,
            o.hash,
            OPS.OP_EQUALVERIFY,
            OPS.OP_CHECKSIG,
        ] as Stack);
    });

    // extended validation
    if (opts.validate) {
        let hash: Buffer = Buffer.from([]);
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
                a.output.length !== 26 ||
                a.output[0] !== OPS.OP_SSTXCHANGE ||
                a.output[1] !== OPS.OP_DUP ||
                a.output[2] !== OPS.OP_HASH160 ||
                a.output[3] !== 0x14 ||
                a.output[24] !== OPS.OP_EQUALVERIFY ||
                a.output[25] !== OPS.OP_CHECKSIG
            )
                throw new TypeError('sstxchange output is invalid');

            const hash2 = a.output.slice(4, 24);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

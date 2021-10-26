import * as typef from 'typeforce';
import * as bs58check from '../bs58check';
import { decred as DECRED_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import type { Payment, PaymentOpts } from './index';

const { OPS } = bscript;

// Decred Stake submission
// OP_SSTX OP_HASH160 {scriptHash} OP_EQUAL

export function sstxsh(a: Payment, opts?: PaymentOpts): Payment {
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

    const network = a.network || DECRED_NETWORK;
    const o = { name: 'sstxsh', network } as Payment;
    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, network));

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;
        return bs58check.encodeAddress(o.hash, network.scriptHash, network);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.slice(3, 23);
        if (a.address) return _address().hash;
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;
        return bscript.compile([OPS.OP_SSTX, OPS.OP_HASH160, o.hash, OPS.OP_EQUAL]);
    });

    // extended validation
    if (opts.validate) {
        let hash: Buffer = Buffer.from([]);
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
                a.output.length !== 24 ||
                a.output[0] !== OPS.OP_SSTX ||
                a.output[1] !== OPS.OP_HASH160 ||
                a.output[2] !== 0x14 ||
                a.output[23] !== OPS.OP_EQUAL
            )
                throw new TypeError('sstxsh output is invalid');

            const hash2 = a.output.slice(3, 23);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

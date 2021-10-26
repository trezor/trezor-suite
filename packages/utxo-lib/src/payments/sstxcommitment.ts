import * as typeforce from 'typeforce';
import { BufferWriter } from '../bufferutils';
import * as bs58check from '../bs58check';
import { decred as DECRED_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import type { Payment, PaymentOpts, Stack } from './index';

const { OPS } = bscript;

// Decred Stake commitment
// OP_RETURN [commitment address] [commitment amount] [fee limits]

export function sstxcommitment(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.amount && !a.hash && !a.output) throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    typeforce(
        {
            network: typeforce.maybe(typeforce.Object),
            address: typeforce.maybe(typeforce.String),
            amount: typeforce.maybe(typeforce.String),
            hash: typeforce.maybe(typeforce.BufferN(20)),
            output: typeforce.maybe(typeforce.Buffer),
        },
        a,
    );

    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, a.network));

    const network = a.network || DECRED_NETWORK;
    const o = { name: 'sstxcommitment', network } as Payment;

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;
        return bs58check.encodeAddress(o.hash, network.pubKeyHash, network);
    });

    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.slice(2, 22);
        if (a.address) return _address().hash;
    });

    lazy.prop(o, 'output', () => {
        if (!o.hash || !a.amount) return;
        // https://github.com/trezor/trezor-firmware/blob/c1843f9f9fa16f3ffa91a4beef4bc1133436fb41/core/src/apps/bitcoin/scripts_decred.py
        const buf = Buffer.allocUnsafe(o.hash.length + 10);
        const writer = new BufferWriter(buf);
        writer.writeSlice(o.hash);
        writer.writeUInt64(a.amount);
        writer.writeUInt8(0); // hardcoded in FW
        writer.writeUInt8(88); // hardcoded in FW
        return bscript.compile([OPS.OP_RETURN, buf] as Stack);
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
            if (a.output.length !== 32 || a.output[0] !== OPS.OP_RETURN)
                throw new TypeError('sstxcommitment output is invalid');

            const hash2 = a.output.slice(2, 22);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

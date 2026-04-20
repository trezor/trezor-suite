import * as bs58check from '../bs58check';
import { BufferWriter } from '../bufferutils';
import { decred as DECRED_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import { type Payment, type PaymentOpts, type Stack } from '../types';
import { BufferNSchema, BufferSchema, Type, assertType } from '../types/validation';

const { OPS } = bscript;

// Decred Stake commitment
// OP_RETURN [commitment address] [commitment amount] [fee limits]

export function sstxcommitment(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.amount && !a.hash && !a.output) throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    assertType(
        Type.Object(
            {
                network: Type.Optional(Type.Object({}, { additionalProperties: true })),
                address: Type.Optional(Type.String()),
                amount: Type.Optional(Type.String()),
                hash: Type.Optional(BufferNSchema(20)),
                output: Type.Optional(BufferSchema),
            },
            { additionalProperties: true },
        ),
        a,
    );

    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, a.network));

    const network = a.network || DECRED_NETWORK;
    const o: Payment = { name: 'sstxcommitment', network };

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;

        return bs58check.encodeAddress(o.hash, network.pubKeyHash, network);
    });

    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.subarray(2, 22);
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

            const hash2 = a.output.subarray(2, 22);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

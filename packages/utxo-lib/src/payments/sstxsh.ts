import * as bs58check from '../bs58check';
import { decred as DECRED_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import { type Payment, type PaymentOpts } from '../types';
import { BufferNSchema, BufferSchema, Type, assertType } from '../types/validation';

const { OPS } = bscript;

// Decred Stake submission
// OP_SSTX OP_HASH160 {scriptHash} OP_EQUAL

export function sstxsh(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.hash && !a.output) throw new TypeError('Not enough data');

    opts = Object.assign({ validate: true }, opts || {});

    assertType(
        Type.Object(
            {
                network: Type.Optional(Type.Object({}, { additionalProperties: true })),
                address: Type.Optional(Type.String()),
                hash: Type.Optional(BufferNSchema(20)),
                output: Type.Optional(BufferSchema),
            },
            { additionalProperties: true },
        ),
        a,
    );

    const network = a.network || DECRED_NETWORK;
    const o: Payment = { name: 'sstxsh', network };
    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, network));

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;

        return bs58check.encodeAddress(o.hash, network.scriptHash, network);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.subarray(3, 23);
        if (a.address) return _address().hash;
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const opSstx: number = OPS.OP_SSTX;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const opHash160: number = OPS.OP_HASH160;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const opEqual: number = OPS.OP_EQUAL;

        return bscript.compile([opSstx, opHash160, o.hash, opEqual]);
    });

    // extended validation
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
                a.output.length !== 24 ||
                a.output[0] !== OPS.OP_SSTX ||
                a.output[1] !== OPS.OP_HASH160 ||
                a.output[2] !== 0x14 ||
                a.output[23] !== OPS.OP_EQUAL
            )
                throw new TypeError('sstxsh output is invalid');

            const hash2 = a.output.subarray(3, 23);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

import * as bs58check from '../bs58check';
import { decred as DECRED_NETWORK } from '../networks';
import * as bscript from '../script';
import * as lazy from './lazy';
import { type Payment, type PaymentOpts, type Stack } from '../types';
import { BufferNSchema, BufferSchema, Type, assertType } from '../types/validation';

const { OPS } = bscript;

// Decred Stake change
// OP_SSTXCHANGE OP_DUP OP_HASH160 {pubKeyHash} OP_EQUALVERIFY OP_CHECKSIG

export function sstxchange(a: Payment, opts?: PaymentOpts): Payment {
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

    const _address = lazy.value(() => bs58check.decodeAddress(a.address!, a.network));

    const network = a.network || DECRED_NETWORK;
    const o: Payment = { name: 'sstxchange', network };

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;

        return bs58check.encodeAddress(o.hash, network.pubKeyHash, network);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.subarray(4, 24);
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
            // MUTATION: equivalent — bs58check.decodeAddress (src/bs58check.ts:71-78) constrains payload.length to 21 or 22 and computes hash = payload.subarray(offset) where offset = 1 (21-byte) or 2 (22-byte), so aHash.length is always exactly 20. The truthy arm of `aHash.length !== 20` is structurally unreachable from the public sstxchange() API; any input that would yield a non-20-byte hash throws earlier in bs58check.decodeAddress with 'too short' / 'too long'.
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

            const hash2 = a.output.subarray(4, 24);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
        }
    }

    return Object.assign(o, a);
}

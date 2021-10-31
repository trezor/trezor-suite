// SegWit version 1 P2TR output type for Taproot defined in
// https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki

import * as ecc from 'tiny-secp256k1';
import * as typef from 'typeforce';
import { bech32m } from 'bech32';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bcrypto from '../crypto';
import * as bscript from '../script';
import * as lazy from './lazy';
import type { Payment, PaymentOpts } from './index';

const { OPS } = bscript;

/**
 * A secp256k1 x coordinate with unknown discrete logarithm used for eliminating
 * keypath spends, equal to SHA256(uncompressedDER(SECP256K1_GENERATOR_POINT)).
 */

const TAGS = ['TapLeaf', 'TapBranch', 'TapTweak', 'KeyAgg list', 'KeyAgg coefficient'] as const;
type TaggedHashPrefix = typeof TAGS[number];
/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
const TAGGED_HASH_PREFIXES = TAGS.reduce((obj, tag) => {
    const tagHash = bcrypto.sha256(Buffer.from(tag));
    obj[tag] = Buffer.concat([tagHash, tagHash]);
    return obj;
}, {} as { [k in TaggedHashPrefix]: Buffer });

const EVEN_Y_COORD_PREFIX = new Uint8Array([0x02]);

function taggedHash(prefix: TaggedHashPrefix, data: Buffer): Buffer {
    return bcrypto.sha256(Buffer.concat([TAGGED_HASH_PREFIXES[prefix], data]));
}

function tapTweakPubkey(pubkey: Buffer, tapTreeRoot?: Buffer) {
    let tapTweak: Buffer;
    if (tapTreeRoot) {
        tapTweak = taggedHash('TapTweak', Buffer.concat([pubkey, tapTreeRoot]));
    } else {
        tapTweak = taggedHash('TapTweak', pubkey);
    }

    const tweakedPubkey = ecc.pointAddScalar(
        Buffer.concat([EVEN_Y_COORD_PREFIX, pubkey]),
        tapTweak,
    );
    return {
        parity: tweakedPubkey[0] === EVEN_Y_COORD_PREFIX[0] ? 0 : 1,
        pubkey: tweakedPubkey.slice(1),
    };
}

const liftX = (pubkey: Buffer) => {
    // bip32.derive returns one additional byte in publicKey
    const offset = pubkey.length === 33 ? 1 : 0;
    return pubkey.slice(offset);
};

// output: OP_1 {witnessProgram}
export function p2tr(a: Payment, opts?: PaymentOpts): Payment {
    if (!a.address && !a.pubkey && !a.output) throw new TypeError('Not enough data');
    opts = Object.assign({ validate: true }, opts || {});

    const network = a.network || BITCOIN_NETWORK;

    const o: Payment = { name: 'p2tr', network };

    typef(
        {
            network: typef.maybe(typef.Object),

            address: typef.maybe(typef.String),
            output: typef.maybe(typef.BufferN(34)),
            pubkey: typef.maybe(typef.anyOf(typef.BufferN(32), typef.BufferN(33))), // see liftX
        },
        a,
    );

    const _address = lazy.value(() => {
        const result = bech32m.decode(a.address!);
        const version = result.words.shift();
        const data = bech32m.fromWords(result.words);
        return {
            version,
            prefix: result.prefix,
            data: Buffer.from(data),
        };
    });

    lazy.prop(o, 'address', () => {
        if (!o.hash) return;
        const words = bech32m.toWords(o.hash);
        words.unshift(0x01);
        return bech32m.encode(network.bech32, words);
    });
    lazy.prop(o, 'hash', () => {
        if (a.output) return a.output.slice(2);
        if (a.address) return _address().data;
        if (a.pubkey) {
            return tapTweakPubkey(liftX(a.pubkey)).pubkey;
        }
    });
    lazy.prop(o, 'output', () => {
        if (!o.hash) return;
        return bscript.compile([OPS.OP_1, o.hash]);
    });

    // extended validation
    if (opts.validate) {
        let hash: Buffer = Buffer.from([]);
        if (a.address) {
            const { prefix, version, data } = _address();
            if (prefix !== network.bech32)
                throw new TypeError('Invalid prefix or Network mismatch');
            if (version !== 0x01) throw new TypeError('Invalid address version');
            if (data.length !== 32) throw new TypeError('Invalid address data');
            hash = data;
        }
        if (a.hash) {
            if (hash.length > 0 && !hash.equals(a.hash)) throw new TypeError('Hash mismatch');
            else hash = a.hash;
        }
        if (a.output) {
            if (a.output[0] !== OPS.OP_1 || a.output[1] !== 0x20)
                throw new TypeError('p2tr output is invalid');
            const hash2 = a.output.slice(2);
            if (hash.length > 0 && !hash.equals(hash2)) throw new TypeError('Hash mismatch');
            else hash = hash2;
        }
        if (a.pubkey) {
            const pkh = tapTweakPubkey(liftX(a.pubkey)).pubkey;
            if (hash.length > 0 && !hash.equals(pkh)) throw new TypeError('Hash mismatch');
            else hash = pkh;
            if (!ecc.isPoint(Buffer.concat([EVEN_Y_COORD_PREFIX, liftX(a.pubkey)])))
                throw new TypeError('Invalid pubkey for p2tr');
        }
    }

    return Object.assign(o, a);
}

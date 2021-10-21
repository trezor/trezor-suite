// upstream: https://github.com/bitcoinjs/bip32/blob/master/ts-src/bip32.ts
// differences:
// - add missing `compressed` field on BIP32Interface
// - changed order of `fromPrivateKeyLocal/fromPublicKeyLocal` (eslint no-use-before-define)
// - `identifier` method is using different hashing for Decred.
// - `fromBase58` and `toBase58` methods are using additional "network" param in bs58check.encode/decode (Decred support).

import * as ecc from 'tiny-secp256k1';
import * as wif from 'wif';
import * as typeforce from 'typeforce';
import * as bs58check from './bs58check';
import * as crypto from './crypto';
import { bitcoin as BITCOIN, isNetworkType } from './networks';
import type { Network } from './networks';

const UINT256_TYPE = typeforce.BufferN(32);
const NETWORK_TYPE = typeforce.compile({
    wif: typeforce.UInt8,
    bip32: {
        public: typeforce.UInt32,
        private: typeforce.UInt32,
    },
});

const HIGHEST_BIT = 0x80000000;
const UINT31_MAX = 2 ** 31 - 1;

function BIP32Path(value: string): boolean {
    return typeforce.String(value) && value.match(/^(m\/)?(\d+'?\/)*\d+'?$/) !== null;
}

function UInt31(value: number): boolean {
    return typeforce.UInt32(value) && value <= UINT31_MAX;
}

function fromPrivateKeyLocal(
    privateKey: Buffer,
    chainCode: Buffer,
    network?: Network,
    depth?: number,
    index?: number,
    parentFingerprint?: number,
): BIP32Interface {
    typeforce(
        {
            privateKey: UINT256_TYPE,
            chainCode: UINT256_TYPE,
        },
        { privateKey, chainCode },
    );
    network = network || BITCOIN;

    if (!ecc.isPrivate(privateKey)) throw new TypeError('Private key not in range [1, n)');
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new BIP32(privateKey, undefined, chainCode, network, depth, index, parentFingerprint);
}

function fromPublicKeyLocal(
    publicKey: Buffer,
    chainCode: Buffer,
    network?: Network,
    depth?: number,
    index?: number,
    parentFingerprint?: number,
): BIP32Interface {
    typeforce(
        {
            publicKey: typeforce.BufferN(33),
            chainCode: UINT256_TYPE,
        },
        { publicKey, chainCode },
    );
    network = network || BITCOIN;

    // verify the X coordinate is a point on the curve
    if (!ecc.isPoint(publicKey)) throw new TypeError('Point is not on the curve');
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new BIP32(undefined, publicKey, chainCode, network, depth, index, parentFingerprint);
}

export interface BIP32Interface {
    chainCode: Buffer;
    network: Network;
    lowR: boolean;
    depth: number;
    index: number;
    parentFingerprint: number;
    publicKey: Buffer;
    privateKey?: Buffer;
    identifier: Buffer;
    fingerprint: Buffer;
    compressed: boolean;
    isNeutered(): boolean;
    neutered(): BIP32Interface;
    toBase58(): string;
    toWIF(): string;
    derive(index: number): BIP32Interface;
    deriveHardened(index: number): BIP32Interface;
    derivePath(path: string): BIP32Interface;
    sign(hash: Buffer, lowR?: boolean): Buffer;
    verify(hash: Buffer, signature: Buffer): boolean;
}

class BIP32 implements BIP32Interface {
    lowR: boolean;
    constructor(
        private __D: Buffer | undefined,
        private __Q: Buffer | undefined,
        public chainCode: Buffer,
        public network: Network,
        private __DEPTH = 0,
        private __INDEX = 0,
        private __PARENT_FINGERPRINT = 0x00000000,
    ) {
        typeforce(NETWORK_TYPE, network);
        this.lowR = false;
    }

    get depth(): number {
        return this.__DEPTH;
    }

    get index(): number {
        return this.__INDEX;
    }

    get parentFingerprint(): number {
        return this.__PARENT_FINGERPRINT;
    }

    get publicKey(): Buffer {
        if (this.__Q === undefined) this.__Q = ecc.pointFromScalar(this.__D, true);
        return this.__Q!;
    }

    get privateKey(): Buffer | undefined {
        return this.__D;
    }

    get identifier(): Buffer {
        if (isNetworkType('decred', this.network)) return crypto.hash160blake256(this.publicKey);
        return crypto.hash160(this.publicKey);
    }

    get fingerprint(): Buffer {
        return this.identifier.slice(0, 4);
    }

    get compressed(): boolean {
        return true;
    }

    // Private === not neutered
    // Public === neutered
    isNeutered(): boolean {
        return this.__D === undefined;
    }

    neutered(): BIP32Interface {
        return fromPublicKeyLocal(
            this.publicKey,
            this.chainCode,
            this.network,
            this.depth,
            this.index,
            this.parentFingerprint,
        );
    }

    toBase58(): string {
        const { network } = this;
        const version = !this.isNeutered() ? network.bip32.private : network.bip32.public;
        const buffer = Buffer.allocUnsafe(78);

        // 4 bytes: version bytes
        buffer.writeUInt32BE(version, 0);

        // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ....
        buffer.writeUInt8(this.depth, 4);

        // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
        buffer.writeUInt32BE(this.parentFingerprint, 5);

        // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
        // This is encoded in big endian. (0x00000000 if master key)
        buffer.writeUInt32BE(this.index, 9);

        // 32 bytes: the chain code
        this.chainCode.copy(buffer, 13);

        // 33 bytes: the public key or private key data
        if (!this.isNeutered()) {
            // 0x00 + k for private keys
            buffer.writeUInt8(0, 45);
            this.privateKey!.copy(buffer, 46);

            // 33 bytes: the public key
        } else {
            // X9.62 encoding for public keys
            this.publicKey.copy(buffer, 45);
        }

        return bs58check.encode(buffer, network);
    }

    toWIF(): string {
        if (!this.privateKey) throw new TypeError('Missing private key');
        return wif.encode(this.network.wif, this.privateKey, true);
    }

    // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#child-key-derivation-ckd-functions
    derive(index: number): BIP32Interface {
        typeforce(typeforce.UInt32, index);

        const isHardened = index >= HIGHEST_BIT;
        const data = Buffer.allocUnsafe(37);

        // Hardened child
        if (isHardened) {
            if (this.isNeutered())
                throw new TypeError('Missing private key for hardened child key');

            // data = 0x00 || ser256(kpar) || ser32(index)
            data[0] = 0x00;
            this.privateKey!.copy(data, 1);
            data.writeUInt32BE(index, 33);

            // Normal child
        } else {
            // data = serP(point(kpar)) || ser32(index)
            //      = serP(Kpar) || ser32(index)
            this.publicKey.copy(data, 0);
            data.writeUInt32BE(index, 33);
        }

        const I = crypto.hmacSHA512(this.chainCode, data);
        const IL = I.slice(0, 32);
        const IR = I.slice(32);

        // if parse256(IL) >= n, proceed with the next value for i
        if (!ecc.isPrivate(IL)) return this.derive(index + 1);

        // Private parent key -> private child key
        let hd: BIP32Interface;
        if (!this.isNeutered()) {
            // ki = parse256(IL) + kpar (mod n)
            const ki = ecc.privateAdd(this.privateKey, IL);

            // In case ki == 0, proceed with the next value for i
            if (ki == null) return this.derive(index + 1);

            hd = fromPrivateKeyLocal(
                ki,
                IR,
                this.network,
                this.depth + 1,
                index,
                this.fingerprint.readUInt32BE(0),
            );

            // Public parent key -> public child key
        } else {
            // Ki = point(parse256(IL)) + Kpar
            //    = G*IL + Kpar
            const Ki = ecc.pointAddScalar(this.publicKey, IL, true);

            // In case Ki is the point at infinity, proceed with the next value for i
            if (Ki === null) return this.derive(index + 1);

            hd = fromPublicKeyLocal(
                Ki,
                IR,
                this.network,
                this.depth + 1,
                index,
                this.fingerprint.readUInt32BE(0),
            );
        }

        return hd;
    }

    deriveHardened(index: number): BIP32Interface {
        typeforce(UInt31, index);

        // Only derives hardened private keys by default
        return this.derive(index + HIGHEST_BIT);
    }

    derivePath(path: string): BIP32Interface {
        typeforce(BIP32Path, path);

        let splitPath = path.split('/');
        if (splitPath[0] === 'm') {
            if (this.parentFingerprint) throw new TypeError('Expected master, got child');

            splitPath = splitPath.slice(1);
        }

        return splitPath.reduce((prevHd, indexStr) => {
            let index;
            if (indexStr.slice(-1) === `'`) {
                index = parseInt(indexStr.slice(0, -1), 10);
                return prevHd.deriveHardened(index);
            }
            index = parseInt(indexStr, 10);
            return prevHd.derive(index);
        }, this as BIP32Interface);
    }

    sign(hash: Buffer, lowR?: boolean): Buffer {
        if (!this.privateKey) throw new Error('Missing private key');
        if (lowR === undefined) lowR = this.lowR;
        if (lowR === false) {
            return ecc.sign(hash, this.privateKey);
        }
        let sig = ecc.sign(hash, this.privateKey);
        const extraData = Buffer.alloc(32, 0);
        let counter = 0;
        // if first try is lowR, skip the loop
        // for second try and on, add extra entropy counting up
        while (sig[0] > 0x7f) {
            counter++;
            extraData.writeUIntLE(counter, 0, 6);
            sig = ecc.signWithEntropy(hash, this.privateKey, extraData);
        }
        return sig;
    }

    verify(hash: Buffer, signature: Buffer): boolean {
        return ecc.verify(hash, this.publicKey, signature);
    }
}

export function fromBase58(inString: string, network?: Network): BIP32Interface {
    const buffer = isNetworkType('decred', network)
        ? bs58check.decodeBlake256Key(inString)
        : bs58check.decode(inString, network);
    if (buffer.length !== 78) throw new TypeError('Invalid buffer length');
    network = network || BITCOIN;

    // 4 bytes: version bytes
    const version = buffer.readUInt32BE(0);
    if (version !== network.bip32.private && version !== network.bip32.public)
        throw new TypeError('Invalid network version');

    // 1 byte: depth: 0x00 for master nodes, 0x01 for level-1 descendants, ...
    const depth = buffer[4];

    // 4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
    const parentFingerprint = buffer.readUInt32BE(5);
    if (depth === 0) {
        if (parentFingerprint !== 0x00000000) throw new TypeError('Invalid parent fingerprint');
    }

    // 4 bytes: child number. This is the number i in xi = xpar/i, with xi the key being serialized.
    // This is encoded in MSB order. (0x00000000 if master key)
    const index = buffer.readUInt32BE(9);
    if (depth === 0 && index !== 0) throw new TypeError('Invalid index');

    // 32 bytes: the chain code
    const chainCode = buffer.slice(13, 45);
    let hd: BIP32Interface;

    // 33 bytes: private key data (0x00 + k)
    if (version === network.bip32.private) {
        if (buffer.readUInt8(45) !== 0x00) throw new TypeError('Invalid private key');
        const k = buffer.slice(46, 78);

        hd = fromPrivateKeyLocal(k, chainCode, network, depth, index, parentFingerprint);

        // 33 bytes: public key data (0x02 + X or 0x03 + X)
    } else {
        const X = buffer.slice(45, 78);

        hd = fromPublicKeyLocal(X, chainCode, network, depth, index, parentFingerprint);
    }

    return hd;
}

export function fromPrivateKey(
    privateKey: Buffer,
    chainCode: Buffer,
    network?: Network,
): BIP32Interface {
    return fromPrivateKeyLocal(privateKey, chainCode, network);
}

export function fromPublicKey(
    publicKey: Buffer,
    chainCode: Buffer,
    network?: Network,
): BIP32Interface {
    return fromPublicKeyLocal(publicKey, chainCode, network);
}

export function fromSeed(seed: Buffer, network?: Network): BIP32Interface {
    typeforce(typeforce.Buffer, seed);
    if (seed.length < 16) throw new TypeError('Seed should be at least 128 bits');
    if (seed.length > 64) throw new TypeError('Seed should be at most 512 bits');
    network = network || BITCOIN;

    const I = crypto.hmacSHA512(Buffer.from('Bitcoin seed', 'utf8'), seed);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);

    return fromPrivateKey(IL, IR, network);
}

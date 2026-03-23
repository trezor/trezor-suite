/* Utils ported from unmaintained bchaddrjs library */
import { sha256 } from '@noble/hashes/sha2.js';
import { base58check as createBase58check } from '@scure/base';
import * as cashaddr from 'cashaddrjs';

const bs58check = createBase58check(sha256);

type Format = 'legacy' | 'cashaddr';
type Network = 'mainnet' | 'testnet';
type Type = 'p2pkh' | 'p2sh';

const VERSION_BYTE: Record<Format, Record<Network, Record<Type, number>>> = {
    legacy: {
        mainnet: {
            p2pkh: 0x00,
            p2sh: 0x05,
        },
        testnet: {
            p2pkh: 0x6f,
            p2sh: 0xc4,
        },
    },
    cashaddr: {
        mainnet: {
            p2pkh: 0,
            p2sh: 1,
        },
        testnet: {
            p2pkh: 0,
            p2sh: 1,
        },
    },
};

type DecodedAddress = {
    hash: number[] | Uint8Array;
    format: Format;
    network: Network;
    type: Type;
};

const decodeBase58Address = (address: string): DecodedAddress => {
    const payload = bs58check.decode(address);
    if (payload.length !== 21) {
        throw new Error('Invalid base58 address payload length');
    }
    const version = payload[0];
    const hash = Array.prototype.slice.call(payload, 1);
    switch (version) {
        case 0x00:
            return { hash, format: 'legacy', network: 'mainnet', type: 'p2pkh' };
        case 0x05:
            return { hash, format: 'legacy', network: 'mainnet', type: 'p2sh' };
        case 0x6f:
            return { hash, format: 'legacy', network: 'testnet', type: 'p2pkh' };
        case 0xc4:
            return { hash, format: 'legacy', network: 'testnet', type: 'p2sh' };
        default:
            throw new Error('Unknown version byte: ' + version);
    }
};

const decodeCashAddressWithPrefix = (address: string): DecodedAddress => {
    const decoded = cashaddr.decode(address);
    const hash = Array.prototype.slice.call(decoded.hash, 0);
    const type: Type = decoded.type === 'P2PKH' ? 'p2pkh' : 'p2sh';
    switch (decoded.prefix) {
        case 'bitcoincash':
            return { hash, format: 'cashaddr', network: 'mainnet', type };
        case 'bchtest':
        case 'bchreg':
            return { hash, format: 'cashaddr', network: 'testnet', type };
        default:
            throw new Error('Unknown cashaddr prefix: ' + decoded.prefix);
    }
};

const decodeCashAddress = (address: string): DecodedAddress => {
    if (address.indexOf(':') !== -1) {
        return decodeCashAddressWithPrefix(address);
    } else {
        const prefixes = ['bitcoincash', 'bchtest', 'bchreg'];
        for (const prefix of prefixes) {
            try {
                return decodeCashAddressWithPrefix(prefix + ':' + address);
            } catch {
                /* ignore */
            }
        }
    }
    throw new Error('Invalid cashaddr address');
};

const decodeAddress = (address: string): DecodedAddress => {
    try {
        return decodeBase58Address(address);
    } catch {
        /* ignore */
    }
    try {
        return decodeCashAddress(address);
    } catch {
        /* ignore */
    }
    throw new Error('Invalid Bitcoin Cash address');
};

export const isCashAddress = (address: string): boolean =>
    decodeAddress(address).format === 'cashaddr';

export const toLegacyAddress = (address: string): string => {
    const decoded = decodeAddress(address);
    if (decoded.format === 'legacy') {
        return address;
    }
    const version = VERSION_BYTE['legacy'][decoded.network][decoded.type];
    const buffer = Buffer.alloc(1 + decoded.hash.length);
    buffer[0] = version;
    buffer.set(decoded.hash, 1);

    return bs58check.encode(buffer);
};

export const toCashAddress = (address: string): string => {
    const decoded = decodeAddress(address);
    const prefix = decoded.network === 'mainnet' ? 'bitcoincash' : 'bchtest';
    const type = decoded.type === 'p2pkh' ? 'P2PKH' : 'P2SH';
    const hash = new Uint8Array(decoded.hash);

    return cashaddr.encode(prefix, type, hash);
};

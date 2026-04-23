import BigNum from 'browserify-bignum';
import groestl from 'groestl-hash-js';
import jsSHA from 'jssha';

import * as base32Module from './base32';
import { decode as base58Decode } from './base58';
import Blake256 from './blake256';
import Blake2B from './blake2b';
import sha3 from './sha3';

const keccak256Fn = (sha3 as unknown as Record<string, (data: string) => string>)['keccak256'];

// Address types, compatible with Trezor
export const addressType = {
    ADDRESS: 'address',
    P2PKH: 'p2pkh',
    P2WPKH: 'p2wpkh',
    P2WSH: 'p2wsh',
    P2SH: 'p2sh',
    P2TR: 'p2tr',
    WITNESS_UNKNOWN: 'p2w-unknown',
} as const;

export function numberToHex(number: number, sizeInBytes: number): string {
    return Math.round(number)
        .toString(16)
        .padStart(sizeInBytes * 2, '0');
}

function isHexChar(c: string): 0 | 1 {
    if ((c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f') || (c >= '0' && c <= '9')) {
        return 1;
    }

    return 0;
}

/* Convert a hex char to value */
function hexChar2byte(c: string): number {
    let d = 0;
    if (c >= 'A' && c <= 'F') {
        d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else if (c >= 'a' && c <= 'f') {
        d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
    } else if (c >= '0' && c <= '9') {
        d = c.charCodeAt(0) - '0'.charCodeAt(0);
    }

    return d;
}

/* Convert a byte to string */
function byte2hexStr(byte: number): string {
    const hexByteMap = '0123456789ABCDEF';
    let str = '';
    str += hexByteMap.charAt(byte >> 4);
    str += hexByteMap.charAt(byte & 0x0f);

    return str;
}

export function byteArray2hexStr(byteArray: ArrayLike<number>): string {
    let str = '';
    let i;
    for (i = 0; i < byteArray.length - 1; i++) {
        str += byte2hexStr(byteArray[i]);
    }
    str += byte2hexStr(byteArray[i]);

    return str;
}

export function hexStr2byteArray(str: string): number[] {
    const byteArray: number[] = [];
    let d = 0;
    let j = 0;
    let k = 0;

    for (let i = 0; i < str.length; i++) {
        const c = str.charAt(i);
        if (isHexChar(c)) {
            d <<= 4;
            d += hexChar2byte(c);
            j++;
            if (0 === j % 2) {
                byteArray[k++] = d;
                d = 0;
            }
        }
    }

    return byteArray;
}

export function toHex(arrayOfBytes: ArrayLike<number>): string {
    let hex = '';
    for (let i = 0; i < arrayOfBytes.length; i++) {
        hex += numberToHex(arrayOfBytes[i], 1);
    }

    return hex;
}

export function sha256(payload: string, format: 'HEX' | 'TEXT' = 'HEX'): string {
    const sha = new jsSHA('SHA-256', format);
    sha.update(payload);

    return sha.getHash(format);
}

export function sha256x2(buffer: string, format: 'HEX' | 'TEXT' = 'HEX'): string {
    return sha256(sha256(buffer, format), format);
}

export function sha256Checksum(payload: string): string {
    return sha256(sha256(payload)).substr(0, 8);
}

export function blake256(hexString: string): string {
    return new (Blake256 as any)().update(hexString, 'hex').digest('hex');
}

export function blake256Checksum(payload: string): string {
    return blake256(blake256(payload)).substr(0, 8);
}

export function blake2b(hexString: string, outlen: number): string {
    return new (Blake2B as any)(outlen).update(Buffer.from(hexString, 'hex')).digest('hex');
}

export function keccak256(hexString: string): string {
    return keccak256Fn(hexString);
}

export function keccak256Checksum(payload: string | Buffer | Uint8Array): string {
    return keccak256Fn(payload as any)
        .toString()
        .substr(0, 8);
}

export function blake2b256(hexString: string): string {
    return new (Blake2B as any)(32).update(Buffer.from(hexString, 'hex'), 32).digest('hex');
}

export function groestl512x2(hexString: string): string {
    const result = groestl.groestl_2(Buffer.from(hexString, 'hex'), 1, 0).substr(0, 8);

    return result;
}

export function bigNumberToBuffer(bignumber: number | string, size?: number): Buffer {
    return new BigNum(bignumber).toBuffer({ size, endian: 'big' });
}

export const base58 = base58Decode;
export const base32 = base32Module;

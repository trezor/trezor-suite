import BigNum from 'browserify-bignum';
import groestl from 'groestl-hash-js';
import JsSHA from 'jssha/src/sha256';

import * as base32 from './base32';
import { decode as base58Decode } from './base58';
import Blake256 from './blake256';
import Blake2B from './blake2b';
import { keccak256 } from './sha3';
export type { AddressType } from '../types';

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

function isHexChar(char: string): boolean {
    return (
        (char >= 'A' && char <= 'F') || (char >= 'a' && char <= 'f') || (char >= '0' && char <= '9')
    );
}

function hexChar2byte(char: string): number {
    if (char >= 'A' && char <= 'F') {
        return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    }
    if (char >= 'a' && char <= 'f') {
        return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
    }
    if (char >= '0' && char <= '9') {
        return char.charCodeAt(0) - '0'.charCodeAt(0);
    }

    return 0;
}

function byte2hexStr(byte: number): string {
    const hexByteMap = '0123456789ABCDEF';
    let str = '';
    str += hexByteMap.charAt(byte >> 4);
    str += hexByteMap.charAt(byte & 0x0f);

    return str;
}

function byteArray2hexStr(byteArray: ArrayLike<number>): string {
    let str = '';
    for (let i = 0; i < byteArray.length - 1; i++) {
        str += byte2hexStr(byteArray[i]);
    }
    str += byte2hexStr(byteArray[byteArray.length - 1]);

    return str;
}

function hexStr2byteArray(str: string): number[] {
    const byteArray: number[] = [];
    let d = 0;
    let j = 0;
    let k = 0;

    for (let i = 0; i < str.length; i++) {
        const char = str.charAt(i);
        if (isHexChar(char)) {
            d <<= 4;
            d += hexChar2byte(char);
            j++;
            if (j % 2 === 0) {
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

export function sha256(payload: string, format = 'HEX'): string {
    // jssha typing is not available
    const sha = new (JsSHA as unknown as new (algo: string, format: string) => any)(
        'SHA-256',
        format,
    );
    sha.update(payload);

    return sha.getHash(format);
}

export function sha256x2(buffer: string, format = 'HEX'): string {
    return sha256(sha256(buffer, format), format);
}

export function sha256Checksum(payload: string): string {
    return sha256(sha256(payload)).substr(0, 8);
}

export function blake256(hexString: string): string {
    return new Blake256().update(hexString, 'hex').digest('hex');
}

export function blake256Checksum(payload: string): string {
    return blake256(blake256(payload)).substr(0, 8);
}

export function blake2b(hexString: string, outlen: number): string {
    return new Blake2B(outlen).update(Buffer.from(hexString, 'hex')).digest('hex');
}

export function keccak256Checksum(payload: string | ArrayLike<number>): string {
    return keccak256(payload).toString().substr(0, 8);
}

export function blake2b256(hexString: string): string {
    return new Blake2B(32).update(Buffer.from(hexString, 'hex')).digest('hex');
}

export function groestl512x2(hexString: string): string {
    return groestl.groestl_2(Buffer.from(hexString, 'hex'), 1, 0).substr(0, 8);
}

export const base58 = base58Decode;
export { base32 };
export { byteArray2hexStr, hexStr2byteArray };
export { keccak256 };

export function bigNumberToBuffer(value: string | number, size?: number): Buffer {
    return new (BigNum as any)(value).toBuffer({ size, endian: 'big' });
}

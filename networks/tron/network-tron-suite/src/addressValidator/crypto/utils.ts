import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { decode as base58Decode } from './base58';

function isHexChar(c: string): 0 | 1 {
    if ((c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f') || (c >= '0' && c <= '9')) {
        return 1;
    }

    return 0;
}

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
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const byte: number = byteArray[i];
        str += byte2hexStr(byte);
    }
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const lastByte: number = byteArray[i];
    str += byte2hexStr(lastByte);

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

export function sha256(hexPayload: string): string {
    return bytesToHex(nobleSha256(hexToBytes(hexPayload)));
}

export const base58 = base58Decode;

// Monero "CryptoNote" Base58 — block-based, NOT the Bitcoin variant.
//
// Faithful port of ph4r05/monero-agent monero_glue/misc/b58_mnr.py. Data is processed in 8-byte
// blocks; each full block encodes to 11 chars, the trailing block to a fixed shorter length. Used
// to decode/encode Monero addresses. 8-byte blocks span the full 2^64 range, hence bigint.

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = 58n;
const FULL_BLOCK_SIZE = 8;
const FULL_ENCODED_BLOCK_SIZE = 11;
// encoded-char-count for a decoded block of N bytes (index = N).
const ENCODED_BLOCK_SIZES = [0, 2, 3, 5, 6, 7, 9, 10, 11];

const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
    ALPHABET_MAP[ALPHABET[i]!] = i;
}

const uint8beToNum = (bytes: Uint8Array): bigint => {
    let result = 0n;
    for (const byte of bytes) {
        result = (result << 8n) | BigInt(byte);
    }

    return result;
};

const numToUint8be = (value: bigint, size: number): Uint8Array => {
    const result = new Uint8Array(size);
    let n = value;
    for (let i = size - 1; i >= 0; i--) {
        result[i] = Number(n & 0xffn);
        n >>= 8n;
    }

    return result;
};

const encodeBlock = (data: Uint8Array, buf: number[], index: number): void => {
    let num = uint8beToNum(data);
    let i = ENCODED_BLOCK_SIZES[data.length]! - 1;
    while (num > 0n) {
        const remainder = Number(num % BASE);
        num /= BASE;
        buf[index + i] = ALPHABET.charCodeAt(remainder);
        i -= 1;
    }
};

export const base58Encode = (data: Uint8Array): string => {
    if (data.length === 0) {
        return '';
    }
    const fullBlocks = Math.floor(data.length / FULL_BLOCK_SIZE);
    const lastBlockSize = data.length % FULL_BLOCK_SIZE;
    const resSize = fullBlocks * FULL_ENCODED_BLOCK_SIZE + ENCODED_BLOCK_SIZES[lastBlockSize]!;

    const buf = new Array<number>(resSize).fill(ALPHABET.charCodeAt(0));
    for (let i = 0; i < fullBlocks; i++) {
        encodeBlock(
            data.subarray(i * FULL_BLOCK_SIZE, i * FULL_BLOCK_SIZE + FULL_BLOCK_SIZE),
            buf,
            i * FULL_ENCODED_BLOCK_SIZE,
        );
    }
    if (lastBlockSize > 0) {
        encodeBlock(
            data.subarray(fullBlocks * FULL_BLOCK_SIZE),
            buf,
            fullBlocks * FULL_ENCODED_BLOCK_SIZE,
        );
    }

    return String.fromCharCode(...buf);
};

const decodeBlock = (block: string, out: Uint8Array, index: number): void => {
    const resSize = ENCODED_BLOCK_SIZES.indexOf(block.length);
    if (resSize <= 0) {
        throw new Error(`base58: invalid encoded block size ${block.length}`);
    }

    let resNum = 0n;
    let order = 1n;
    for (let i = block.length - 1; i >= 0; i--) {
        const digit = ALPHABET_MAP[block[i]!];
        if (digit === undefined) {
            throw new Error(`base58: invalid symbol "${block[i]}"`);
        }
        resNum += order * BigInt(digit);
        order *= BASE;
    }
    if (resSize < FULL_BLOCK_SIZE && 1n << BigInt(8 * resSize) <= resNum) {
        throw new Error('base58: block overflow');
    }
    // A full 8-byte block must still fit in a uint64; the reference rejects res_num > UINT64_MAX.
    if (resSize === FULL_BLOCK_SIZE && resNum > 0xffffffffffffffffn) {
        throw new Error('base58: block overflow');
    }

    out.set(numToUint8be(resNum, resSize), index);
};

export const base58Decode = (encoded: string): Uint8Array => {
    if (encoded.length === 0) {
        return new Uint8Array(0);
    }
    const fullBlocks = Math.floor(encoded.length / FULL_ENCODED_BLOCK_SIZE);
    const lastBlockSize = encoded.length % FULL_ENCODED_BLOCK_SIZE;
    const lastDecodedSize = ENCODED_BLOCK_SIZES.indexOf(lastBlockSize);
    if (lastDecodedSize < 0) {
        throw new Error(`base58: invalid encoded length ${encoded.length}`);
    }

    const out = new Uint8Array(fullBlocks * FULL_BLOCK_SIZE + lastDecodedSize);
    for (let i = 0; i < fullBlocks; i++) {
        decodeBlock(
            encoded.slice(
                i * FULL_ENCODED_BLOCK_SIZE,
                i * FULL_ENCODED_BLOCK_SIZE + FULL_ENCODED_BLOCK_SIZE,
            ),
            out,
            i * FULL_BLOCK_SIZE,
        );
    }
    if (lastBlockSize > 0) {
        decodeBlock(
            encoded.slice(fullBlocks * FULL_ENCODED_BLOCK_SIZE),
            out,
            fullBlocks * FULL_BLOCK_SIZE,
        );
    }

    return out;
};

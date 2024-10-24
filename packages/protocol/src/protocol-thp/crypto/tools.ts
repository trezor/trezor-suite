import * as crypto from 'crypto';

export const hmacSHA256 = (key: Buffer, data: Buffer) =>
    crypto.createHmac('sha256', key).update(data).digest();

export const sha256 = (buffer: Buffer) => crypto.createHash('sha256').update(buffer).digest();

export const hkdf = (chainingKey: Buffer, input: Buffer) => {
    const tempKey = hmacSHA256(chainingKey, input);
    const output1 = hmacSHA256(tempKey, Buffer.from([0x01]));

    const ctxOutput2 = crypto.createHmac('sha256', tempKey).update(output1);
    ctxOutput2.update(Buffer.from([0x02]));
    const output2 = ctxOutput2.digest();

    return [output1, output2];
};

export const hashOfTwo = (hash1: Buffer, hash2: Buffer) =>
    crypto.createHash('sha256').update(hash1).update(hash2).digest();

export const getIvFromNonce = (nonce: number): Buffer => {
    const iv = new Uint8Array(12);
    const nonceBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        nonceBytes[7 - i] = nonce & 0xff;
        nonce = nonce >> 8;
    }
    iv.set(nonceBytes, 4);

    return Buffer.from(iv);
};

// python int.from_bytes(array, "big")
export const bigEndianBytesToBigInt = (bytes: Uint8Array): bigint => {
    const result: bigint[] = [];
    const { length } = bytes;
    for (let i = 0; i < length; i++) {
        result.push(BigInt(bytes[i] * 256 ** (length - (1 + i))));
    }

    return result.reduce((prev, curr) => {
        return prev + curr;
    }, BigInt(0));
};

// python int.from_bytes(array, "little")
export const littleEndianBytesToBigInt = (bytes: Uint8Array): bigint => {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
        result += BigInt(bytes[i]) << (8n * BigInt(i));
    }

    return result;
};

export type QuantityResult = { success: true; value: bigint } | { success: false; error: string };

const HEX_QUANTITY = /^0x[0-9a-fA-F]{1,64}$/;
const HEX_BYTES = /^0x(?:[0-9a-fA-F]{2})*$/;

// JSON-RPC quantities are hex strings; parsing goes through BigInt so values above
// Number.MAX_SAFE_INTEGER survive exactly.
export const parseHexQuantity = (value: unknown): QuantityResult => {
    if (typeof value !== 'string' || !HEX_QUANTITY.test(value)) {
        return { success: false, error: 'not a hex quantity' };
    }

    return { success: true, value: BigInt(value) };
};

export const bytesToBigint = (bytes: Uint8Array): bigint => {
    let value = 0n;
    for (const byte of bytes) value = (value << 8n) | BigInt(byte);

    return value;
};

export const hexToBytes = (value: unknown): Uint8Array | null => {
    if (typeof value !== 'string' || !HEX_BYTES.test(value)) return null;
    const bytes = new Uint8Array((value.length - 2) / 2);
    for (let index = 0; index < bytes.length; index++) {
        bytes[index] = parseInt(value.slice(2 + index * 2, 4 + index * 2), 16);
    }

    return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string =>
    '0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

export const toDecimalString = (value: bigint): string => value.toString(10);
